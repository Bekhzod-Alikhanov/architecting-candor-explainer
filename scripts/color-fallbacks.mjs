/**
 * color-fallbacks.mjs — generates src/styles/color-fallbacks.css.
 *
 *   pnpm colors:fallbacks
 *   node scripts/color-fallbacks.mjs --stdout   (print instead of writing)
 *
 * Until Tailwind was removed, its compiler emitted static hex fallbacks for
 * every color-mix() under @supports. Safari 15.4–16.1 has no color-mix():
 * `background: var(--ground-raised)` is "invalid at computed-value time"
 * there, so it falls back to `transparent` and panels render see-through.
 * Every color-mix() in this codebase resolves to a constant, because the six
 * source colours in tokens.css are static values, not runtime input — so
 * this script resolves each one ahead of time with culori (parsing OKLCH,
 * interpolating in OKLab with premultiplied alpha per the CSS Color 4
 * color-mix() algorithm) and emits the result as a plain sRGB hex behind
 * `@supports not (color: color-mix(in oklab, red, blue))`.
 *
 * Two passes:
 *   1. Every `--name: color-mix(...)` declaration in tokens.css's :root
 *      becomes a `--name: #hex;` redefinition in the same @supports block,
 *      in the app-tokens layer — this is what makes `var(--ground-raised)`
 *      resolve to something opaque on a browser with no color-mix().
 *   2. Every OTHER stylesheet under src/ is scanned for declarations that
 *      write color-mix( literally (not through a --token, which pass 1
 *      already covers via the cascade). Each becomes its own fallback rule,
 *      in the file's own @layer and @media context, right next to it.
 *
 * A declaration that mixes currentColor can't be resolved at build time
 * (currentColor is only known at layout time) — those are skipped and
 * listed below. Everything else, including `transparent`, is a constant and
 * gets resolved: transparent has alpha 0, so it only ever scales the mixed
 * colour's alpha down (Section "Resolving a color-mix()" below), never its
 * hue.
 *
 * scripts/check-colors.ts regenerates this file to a string and fails the
 * build if it drifts from what's committed here.
 *
 * This file, and src/styles/tokens.css, are the only two places in the
 * project where a raw hex colour is allowed to appear.
 *
 * Cascade note — why pass-2 selectors get an `html ` prefix:
 *
 * A declaration containing var() is only invalid *at computed-value time*,
 * not at parse time — so on a browser without color-mix(), the original
 * `.btn--primary { background: color-mix(...) }` is still syntactically
 * valid and still wins the cascade over an equal-specificity fallback of
 * the same layer that merely comes earlier in source order. Source order
 * alone is not reliable here: module stylesheets (app-modules) are pulled
 * in by whichever component imports them, after index.css, so this
 * generator cannot promise its fallback block lands after every module's
 * own rule. And notfound.css's app-base/app-components rules are written
 * inline, after its own @import list — CSS requires @import to precede
 * every other rule (bar @charset and a bare `@layer name;` statement), so
 * that file's color-fallbacks.css import can never be moved past those
 * inline blocks to fix source order that way.
 *
 * The fix that works regardless of import position: every pass-2 fallback
 * selector (i.e. everything below except the :root token block, which
 * relies on src/index.css's color-fallbacks.css import sitting after
 * tokens.css and does not need this) is prefixed with an extra `html `
 * type selector — same class specificity plus one type selector, which
 * beats the unprefixed original regardless of source order, but still
 * loses to a *more specific* real rule such as `.btn--primary:hover` (an
 * extra pseudo-class) that does not itself use color-mix(), so hover/focus
 * states defined elsewhere keep working. `!important` and a dedicated
 * higher layer were both rejected: layer order beats specificity outright,
 * so a higher-layer base/module fallback would also override lower-layer
 * :hover rules it has no business touching.
 */

import { formatHex, formatHex8, interpolateWithPremultipliedAlpha, parse } from 'culori'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TOKENS_PATH = path.join(ROOT, 'src/styles/tokens.css')
const OUT_PATH = path.join(ROOT, 'src/styles/color-fallbacks.css')
const SRC_DIR = path.join(ROOT, 'src')

const SUPPORTS = '@supports not (color: color-mix(in oklab, red, blue))'

// ---------------------------------------------------------------------------
// Small CSS reader. This codebase never nests rules (no `&`) and every
// color-mix() sits inside a plain declaration, so a hand-rolled
// recursive-descent walk is enough — it doesn't need a full CSS AST library
// to track @layer / @media ancestry and declaration bodies.
// ---------------------------------------------------------------------------

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function normalizeWs(str) {
  return str.trim().replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
}

/** Splits on `sep` at paren-depth 0 only, so `color-mix(a, b)` inside a
 *  value doesn't get split on its internal comma. */
function splitTopLevel(str, sep) {
  const parts = []
  let depth = 0
  let cur = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === sep && depth === 0) {
      parts.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  parts.push(cur)
  return parts.map((s) => s.trim())
}

/** Index just past the paren that closes the `(` at `openIdx`. */
function findMatchingParen(str, openIdx) {
  let depth = 1
  let j = openIdx + 1
  while (j < str.length && depth > 0) {
    if (str[j] === '(') depth++
    else if (str[j] === ')') depth--
    j++
  }
  return j
}

function parseCss(css) {
  const src = stripComments(css)
  const n = src.length
  let i = 0
  const isWs = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r'
  const skipWs = () => {
    while (i < n && isWs(src[i])) i++
  }

  function parseNodes() {
    const nodes = []
    while (true) {
      skipWs()
      if (i >= n || src[i] === '}') break
      if (src[i] === '@') {
        const start = i
        let depth = 0
        let j = i
        while (j < n) {
          const c = src[j]
          if (c === '(') depth++
          else if (c === ')') depth--
          else if (depth === 0 && (c === '{' || c === ';')) break
          j++
        }
        const prelude = src.slice(start, j).trim()
        if (src[j] === ';') {
          nodes.push({ type: 'atrule', prelude, nodes: null })
          i = j + 1
        } else {
          i = j + 1
          const children = parseNodes()
          skipWs()
          if (src[i] === '}') i++
          nodes.push({ type: 'atrule', prelude, nodes: children })
        }
      } else {
        const start = i
        let j = i
        while (j < n && src[j] !== '{') j++
        // Selector lists and declaration values are free-format across
        // source lines; collapsing whitespace here (rather than in every
        // caller) keeps the generated output — which is never reformatted,
        // since Biome excludes this file — from reproducing the source's
        // line breaks verbatim.
        const selector = normalizeWs(src.slice(start, j))
        i = j + 1
        const bodyStart = i
        let depth = 0
        let k = i
        while (k < n) {
          const c = src[k]
          if (c === '(') depth++
          else if (c === ')') depth--
          else if (c === '}' && depth === 0) break
          k++
        }
        const body = src.slice(bodyStart, k)
        i = k + 1
        const decls = splitTopLevel(body, ';')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((d) => {
            const idx = d.indexOf(':')
            return { prop: normalizeWs(d.slice(0, idx)), value: normalizeWs(d.slice(idx + 1)) }
          })
          .filter((d) => d.prop && d.value)
        nodes.push({ type: 'rule', selector, decls })
      }
    }
    return nodes
  }

  return parseNodes()
}

// ---------------------------------------------------------------------------
// Resolving a color-mix()
//
// CSS Color 4 §color-mix(): normalise the two percentages so they sum to
// 100 (a single given percentage implies the other is 100 minus it); if
// they summed to LESS than 100 before normalising, that shortfall scales
// the result's alpha down afterwards. Interpolate premultiplied — each
// colour's channels are scaled by its own alpha before mixing — so mixing
// with `transparent` (alpha 0) only ever dilutes alpha, never hue, no
// matter what RGB `transparent` nominally carries. culori's
// interpolateWithPremultipliedAlpha implements exactly that per-channel
// premultiply/un-premultiply; this only adds the percentage normalisation
// CSS wraps around it.
// ---------------------------------------------------------------------------

function parseComponent(str) {
  const s = str.trim()
  let m = s.match(/^([\s\S]*?)\s+(-?\d+(?:\.\d+)?)%$/)
  if (m) return { colorExpr: m[1].trim(), percent: Number.parseFloat(m[2]) }
  m = s.match(/^(-?\d+(?:\.\d+)?)%\s+([\s\S]*)$/)
  if (m) return { colorExpr: m[2].trim(), percent: Number.parseFloat(m[1]) }
  return { colorExpr: s, percent: null }
}

/** Resolves one CSS value fragment — var(), color-mix(), or a literal
 *  colour — to a culori colour object, or null if it depends on something
 *  not known until layout (currentColor) or isn't defined. `stack` guards
 *  against a --token that (directly or indirectly) references itself. */
function resolveExpr(expr, defs, stack) {
  const e = expr.trim()
  if (/^currentcolor$/i.test(e)) return null

  const varMatch = e.match(/^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/i)
  if (varMatch) {
    const name = varMatch[1]
    const fallback = varMatch[2]
    if (defs.has(name) && !stack.has(name)) {
      stack.add(name)
      const resolved = resolveExpr(defs.get(name), defs, stack)
      stack.delete(name)
      if (resolved !== null) return resolved
    }
    return fallback !== undefined ? resolveExpr(fallback, defs, stack) : null
  }

  if (e.toLowerCase().startsWith('color-mix(')) {
    const openIdx = e.indexOf('(')
    const closeIdx = findMatchingParen(e, openIdx)
    if (closeIdx !== e.length) return null
    const inner = e.slice(openIdx + 1, closeIdx - 1)
    const parts = splitTopLevel(inner, ',')
    if (parts.length !== 3 || !/^in\s+oklab$/i.test(parts[0].trim())) return null

    const c1 = parseComponent(parts[1])
    const c2 = parseComponent(parts[2])
    const colorA = resolveExpr(c1.colorExpr, defs, stack)
    const colorB = resolveExpr(c2.colorExpr, defs, stack)
    if (colorA === null || colorB === null) return null

    let p1 = c1.percent
    let p2 = c2.percent
    if (p1 === null && p2 === null) {
      p1 = 50
      p2 = 50
    } else if (p1 === null) {
      p1 = 100 - p2
    } else if (p2 === null) {
      p2 = 100 - p1
    }
    const sum = p1 + p2
    if (sum <= 0) return null
    const alphaMultiplier = sum < 100 ? sum / 100 : 1
    if (sum !== 100) {
      p1 = (p1 / sum) * 100
      p2 = (p2 / sum) * 100
    }

    const interpolator = interpolateWithPremultipliedAlpha([colorA, colorB], 'oklab')
    let mixed = interpolator(p2 / 100)
    if (alphaMultiplier !== 1) {
      const baseAlpha = mixed.alpha === undefined ? 1 : mixed.alpha
      mixed = { ...mixed, alpha: baseAlpha * alphaMultiplier }
    }
    return mixed
  }

  return parse(e) ?? null
}

/** Bumps a fallback selector's specificity by exactly one type selector, so
 *  it beats the original color-mix() rule regardless of source/import
 *  order (see the cascade note atop this file) while still losing to a
 *  more specific real rule (e.g. `.x:hover`) that doesn't itself use
 *  color-mix(). Applied per comma-separated selector; a selector that
 *  already starts with `html` or `:root` is left alone (already anchored,
 *  or already as specific as this file's own :root token block). */
function prefixSelector(selector) {
  return splitTopLevel(selector, ',')
    .map((part) => {
      const p = part.trim()
      return /^(html\b|:root\b)/i.test(p) ? p : `html ${p}`
    })
    .join(', ')
}

function toCssHex(color) {
  const alpha = color.alpha === undefined ? 1 : color.alpha
  return alpha >= 1 - 1e-6 ? formatHex(color) : formatHex8(color)
}

/** Replaces every literal `color-mix(...)` call inside a value string with
 *  its resolved hex, leaving everything else (units, other function calls,
 *  gradient stops, additional shadow layers) untouched. Returns null if any
 *  color-mix() in the value can't be resolved — the caller drops the whole
 *  declaration rather than emit a half-resolved fallback. */
function transformValue(value, defs) {
  let result = ''
  let i = 0
  while (i < value.length) {
    const idx = value.indexOf('color-mix(', i)
    if (idx === -1) {
      result += value.slice(i)
      return result
    }
    result += value.slice(i, idx)
    const openParenIdx = idx + 'color-mix'.length
    const endIdx = findMatchingParen(value, openParenIdx)
    const mixExpr = value.slice(idx, endIdx)
    const resolved = resolveExpr(mixExpr, defs, new Set())
    if (resolved === null) return null
    result += toCssHex(resolved)
    i = endIdx
  }
  return result
}

// ---------------------------------------------------------------------------
// Pass 1 — tokens.css
// ---------------------------------------------------------------------------

function readRootDefs(tokensCss) {
  const stripped = stripComments(tokensCss)
  const rootStart = stripped.indexOf(':root')
  const braceStart = stripped.indexOf('{', rootStart)
  let depth = 1
  let i = braceStart + 1
  while (depth > 0) {
    if (stripped[i] === '{') depth++
    else if (stripped[i] === '}') depth--
    i++
  }
  const body = stripped.slice(braceStart + 1, i - 1)
  const defs = new Map()
  const order = []
  for (const raw of splitTopLevel(body, ';')) {
    const d = raw.trim()
    if (!d) continue
    const idx = d.indexOf(':')
    if (idx === -1) continue
    const name = d.slice(0, idx).trim()
    if (!name.startsWith('--')) continue
    defs.set(name, normalizeWs(d.slice(idx + 1)))
    order.push(name)
  }
  return { defs, order }
}

function resolveTokenFallbacks(defs, order) {
  const resolved = new Map()
  const unresolved = []
  let colorMixDeclCount = 0
  for (const name of order) {
    const raw = defs.get(name)
    if (!raw.includes('color-mix(')) continue
    colorMixDeclCount++
    const value = transformValue(raw, defs)
    if (value === null) unresolved.push({ name, raw })
    else resolved.set(name, value)
  }
  return { resolved, unresolved, colorMixDeclCount }
}

// ---------------------------------------------------------------------------
// Pass 2 — every other stylesheet under src/
// ---------------------------------------------------------------------------

function listCssFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listCssFiles(p))
    else if (entry.name.endsWith('.css')) out.push(p)
  }
  return out
}

/** True if `otherProp` is a longhand/logical sub-property that `shorthandProp`
 *  (a bare box-model shorthand) resets. Needed because a fallback rule only
 *  emitting the color-mix()-bearing declaration can otherwise regress a rule
 *  like `.lint__privacy { border: 1px solid color-mix(...); border-inline-start:
 *  3px solid var(--color-instrument); }`: once the fallback rule outranks the
 *  original (see the cascade note atop this file), its `border` shorthand — on
 *  its own, without the sibling override carried along — would reset the side
 *  `border-inline-start` had overridden, undoing it. `border` resets width/
 *  style/color for every physical and logical side, but not border-radius,
 *  border-image, border-collapse, or border-spacing — those aren't part of the
 *  reset, so they're excluded here too. */
function isCarryForShorthand(shorthandProp, otherProp) {
  if (shorthandProp === 'border') {
    return otherProp !== 'border' && /^border-(?!radius|image|collapse|spacing)/.test(otherProp)
  }
  if (shorthandProp === 'background') {
    return otherProp !== 'background' && /^background-/.test(otherProp)
  }
  return false
}

/** Walks the parsed tree collecting every rule that has at least one
 *  declaration with a literal color-mix( in its value, tagged with the
 *  nearest enclosing @layer name and @media prelude (a file can wrap
 *  different parts of itself in different layers — notfound.css does).
 *  Each returned rule's `decls` keeps every color-mix() declaration plus any
 *  sibling declaration that a color-mix() shorthand in the same rule would
 *  otherwise clobber (see isCarryForShorthand) — in the rule's original
 *  order, since a shorthand followed by a narrower override only works if
 *  the fallback reproduces that same order. */
function findColorMixRules(nodes, ctx, out) {
  for (const node of nodes) {
    if (node.type === 'atrule') {
      if (!node.nodes) continue // leaf at-rule, e.g. `@layer a, b;` or `@import`
      const layerMatch = node.prelude.match(/^@layer\s+([\w-]+)\s*$/)
      const isMedia = /^@media\b/.test(node.prelude)
      const nextCtx = layerMatch
        ? { ...ctx, layer: layerMatch[1] }
        : isMedia
          ? { ...ctx, media: node.prelude }
          : ctx
      findColorMixRules(node.nodes, nextCtx, out)
    } else {
      const colorDecls = node.decls.filter((d) => d.value.includes('color-mix('))
      if (colorDecls.length > 0) {
        const shorthands = colorDecls.map((d) => d.prop)
        const decls = node.decls
          .filter(
            (d) =>
              d.value.includes('color-mix(') ||
              shorthands.some((sh) => isCarryForShorthand(sh, d.prop)),
          )
          .map((d) => ({ ...d, isColorMix: d.value.includes('color-mix(') }))
        out.push({ selector: node.selector, decls, layer: ctx.layer, media: ctx.media })
      }
    }
  }
}

function collectModuleFallbacks(defs) {
  const files = listCssFiles(SRC_DIR)
    .filter((p) => path.resolve(p) !== path.resolve(TOKENS_PATH))
    .filter((p) => path.resolve(p) !== path.resolve(OUT_PATH))
    .sort()

  const resolved = []
  const unresolved = []

  for (const file of files) {
    const css = readFileSync(file, 'utf8')
    if (!css.includes('color-mix(')) continue
    const rel = path.relative(ROOT, file).split(path.sep).join('/')
    const found = []
    findColorMixRules(parseCss(css), { layer: null, media: null }, found)

    for (const item of found) {
      const okDecls = []
      for (const d of item.decls) {
        // A carried sibling (see isCarryForShorthand) has no color-mix() of
        // its own — transformValue is a no-op passthrough for it — and isn't
        // counted as a color-mix() resolution below; it rides along only so
        // the fallback rule doesn't undo the override it represents.
        const value = transformValue(d.value, defs)
        if (value === null) {
          unresolved.push({ file: rel, selector: item.selector, prop: d.prop, value: d.value })
        } else {
          okDecls.push({ prop: d.prop, value, isColorMix: d.isColorMix })
        }
      }
      if (okDecls.length === 0) continue
      if (!item.layer) {
        unresolved.push({
          file: rel,
          selector: item.selector,
          prop: okDecls.map((d) => d.prop).join(', '),
          value: '(no enclosing @layer found)',
        })
        continue
      }
      resolved.push({
        file: rel,
        layer: item.layer,
        media: item.media,
        selector: prefixSelector(item.selector),
        decls: okDecls,
      })
    }
  }

  return { resolved, unresolved }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderRule(selector, decls, level) {
  const pad = '  '.repeat(level)
  const inner = decls.map((d) => `${pad}  ${d.prop}: ${d.value};`).join('\n')
  return `${pad}${selector} {\n${inner}\n${pad}}`
}

function renderLayerBody(entries, level) {
  const byMedia = new Map()
  for (const e of entries) {
    const key = e.media ?? ''
    if (!byMedia.has(key)) byMedia.set(key, [])
    byMedia.get(key).push(e)
  }
  const parts = []
  for (const [media, list] of byMedia) {
    if (media) {
      const pad = '  '.repeat(level)
      const rules = list.map((e) => renderRule(e.selector, e.decls, level + 1)).join('\n\n')
      parts.push(`${pad}${media} {\n${rules}\n${pad}}`)
    } else {
      for (const e of list) parts.push(renderRule(e.selector, e.decls, level))
    }
  }
  return parts.join('\n\n')
}

function renderModuleFallbacks(resolvedEntries) {
  const byLayer = new Map()
  for (const e of resolvedEntries) {
    if (!byLayer.has(e.layer)) byLayer.set(e.layer, [])
    byLayer.get(e.layer).push(e)
  }
  const blocks = []
  for (const [layer, entries] of byLayer) {
    const body = renderLayerBody(entries, 2)
    blocks.push(`@layer ${layer} {\n  ${SUPPORTS} {\n${body}\n  }\n}`)
  }
  return blocks.join('\n\n')
}

function renderTokenFallbacks(resolvedMap, order) {
  const lines = order
    .filter((n) => resolvedMap.has(n))
    .map((n) => `      ${n}: ${resolvedMap.get(n)};`)
  return `@layer app-tokens {\n  ${SUPPORTS} {\n    :root {\n${lines.join('\n')}\n    }\n  }\n}`
}

function renderHeader({
  tokenResolved,
  tokenTotal,
  tokenUnresolved,
  moduleResolved,
  moduleUnresolved,
}) {
  const unresolvedLines = [...tokenUnresolved, ...moduleUnresolved].map((u) =>
    u.name
      ? `     - tokens.css --${u.name.replace(/^--/, '')}: ${u.raw}`
      : `     - ${u.file} ${u.selector} { ${u.prop} }`,
  )
  const unresolvedBlock =
    unresolvedLines.length > 0
      ? `\n   Left un-derived (depends on currentColor, which is only known at layout\n   time, not at build time):\n${unresolvedLines.join('\n')}\n`
      : ''
  const counts = `   ${tokenResolved} of ${tokenTotal} color-mix() token declarations in tokens.css resolved
   (app-tokens layer, below); ${moduleResolved} literal color-mix() declaration(s)
   elsewhere in src/ resolved into their own file's layer, right next to the
   rule that uses them — a --token reference doesn't need its own fallback
   here, since the app-tokens block above already redefines the custom
   property it reads. Every one of those selectors is prefixed with an
   extra \`html \` type selector (see the cascade note at the top of
   scripts/color-fallbacks.mjs) so it wins the cascade regardless of
   import/source order, without out-specificity-ing a real :hover/:focus
   rule that doesn't itself use color-mix(). A rule whose color-mix() sits in
   a bare shorthand (\`border\`, \`background\`) that a sibling declaration in
   the same original rule narrows (e.g. \`border-inline-start\`) carries that
   sibling along unresolved, in its original order, so the shorthand's reset
   doesn't undo the narrower override — see isCarryForShorthand.`
  return `/* ============================================================================
   COLOR-MIX() FALLBACKS — generated, do not hand-edit.
   Regenerate: pnpm colors:fallbacks

   Until Tailwind was removed, its compiler emitted static hex fallbacks for
   every color-mix() under @supports. Safari 15.4–16.1 has no color-mix():
   \`background: var(--ground-raised)\` is invalid at computed-value time
   there and falls back to transparent, so panels render see-through. Every
   color-mix() here resolves to a constant — the six source colours in
   tokens.css are static — so this file precomputes each one to a plain
   sRGB hex (culori: OKLCH parse, OKLab premultiplied-alpha interpolation
   per the CSS Color 4 color-mix() algorithm) and redefines it behind
   \`${SUPPORTS}\`. See scripts/color-fallbacks.mjs.

${counts}${unresolvedBlock}
   This file and tokens.css are the only two places in the project where a
   raw hex colour may appear.
   ========================================================================= */
`
}

export function render() {
  const tokensCss = readFileSync(TOKENS_PATH, 'utf8')
  const { defs, order } = readRootDefs(tokensCss)
  const tokens = resolveTokenFallbacks(defs, order)
  const modules = collectModuleFallbacks(defs)

  const header = renderHeader({
    tokenResolved: tokens.resolved.size,
    tokenTotal: tokens.colorMixDeclCount,
    tokenUnresolved: tokens.unresolved,
    moduleResolved: modules.resolved.reduce(
      (n, e) => n + e.decls.filter((d) => d.isColorMix).length,
      0,
    ),
    moduleUnresolved: modules.unresolved,
  })

  const sections = [renderTokenFallbacks(tokens.resolved, order)]
  if (modules.resolved.length > 0) sections.push(renderModuleFallbacks(modules.resolved))

  return `${header}\n${sections.join('\n\n')}\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = render()
  if (process.argv.includes('--stdout')) {
    process.stdout.write(css)
  } else {
    writeFileSync(OUT_PATH, css)
    console.log(`Wrote ${path.relative(ROOT, OUT_PATH)}`)
  }
}
