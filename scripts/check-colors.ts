/**
 * check-colors.ts — asserts src/styles/color-fallbacks.css is exactly what
 * scripts/color-fallbacks.mjs generates, that its token-layer block covers
 * every color-mix() declaration in tokens.css, and spot-checks three of its
 * values against an independently written computation.
 *
 *   pnpm check:colors
 *
 * The generated file is committed (so a reviewer can read the actual hex
 * fallbacks in a diff), which means nothing stops it drifting from its
 * generator by hand-edit or a stale regenerate — the first check below is
 * what would catch that. The second and third exist because the first only
 * proves the file matches its own generator, not that the generator's
 * colour maths is right; both recompute a couple of values a different way
 * (culori's oklab converter and a plain lerp, rather than the generator's
 * shared color-mix()-parsing pipeline) so a bug shared by every code path
 * in the generator still gets caught.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync as read } from 'node:fs'
import { converter, formatHex, parse } from 'culori'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

// --- 1. the committed file is exactly what the generator produces --------

const generated = execFileSync(process.execPath, ['scripts/color-fallbacks.mjs', '--stdout'], {
  encoding: 'utf8',
})
const committed = read('src/styles/color-fallbacks.css', 'utf8')

check(
  generated === committed,
  'src/styles/color-fallbacks.css does not match `node scripts/color-fallbacks.mjs --stdout`. ' +
    'Regenerate with `pnpm colors:fallbacks` and commit the result.',
)

// --- 2. the fallback count matches tokens.css -----------------------------

const tokensCss = read('src/styles/tokens.css', 'utf8')
const rootStart = tokensCss.indexOf(':root')
const rootBody = tokensCss.slice(rootStart, tokensCss.indexOf('\n}', rootStart))
// A declaration can wrap color-mix() across several lines (the box-shadow
// tokens do), so this counts `--name:` starts that are eventually followed
// by a color-mix( before the next `--name:` or the block's end, rather than
// matching line by line.
const declStarts = [...rootBody.matchAll(/\n\s*(--[\w-]+):/g)]
let tokenColorMixCount = 0
for (let i = 0; i < declStarts.length; i++) {
  const start = declStarts[i].index!
  const end = i + 1 < declStarts.length ? declStarts[i + 1].index! : rootBody.length
  if (rootBody.slice(start, end).includes('color-mix(')) tokenColorMixCount++
}

const fallbackFile = read('src/styles/color-fallbacks.css', 'utf8')
const rootFallbackMatch = fallbackFile.match(/:root\s*\{([\s\S]*?)\n\s*\}/)
const fallbackDeclCount = rootFallbackMatch
  ? [...rootFallbackMatch[1].matchAll(/\n\s*--[\w-]+:/g)].length
  : 0

check(
  fallbackDeclCount === tokenColorMixCount,
  `color-fallbacks.css redefines ${fallbackDeclCount} custom properties, but tokens.css has ` +
    `${tokenColorMixCount} --name: color-mix(...) declarations in :root. Every one needs a fallback.`,
)

// --- 3. spot-check three values against an independent computation -------

const oklab = converter('oklab')
const num = (v: unknown) => v as number
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t
/** Plain (non-premultiplied) OKLab lerp — valid whenever both inputs are
 *  fully opaque, which is true for every source token below. */
const mixOpaque = (
  colorA: string,
  weightA: number,
  colorB: string,
): { mode: 'oklab'; l: number; a: number; b: number } => {
  const A = oklab(parse(colorA)!)
  const B = oklab(parse(colorB)!)
  return {
    mode: 'oklab',
    l: lerp(num(B.l), num(A.l), weightA),
    a: lerp(num(B.a), num(A.a), weightA),
    b: lerp(num(B.b), num(A.b), weightA),
  }
}

const fallbackOf = (name: string): string | undefined => {
  const m = fallbackFile.match(new RegExp(`--${name}:\\s*([^;]+);`))
  return m?.[1].trim()
}

// --color-ground / --color-doc / --color-instrument, read straight from
// tokens.css rather than hardcoded, so this doesn't silently stop meaning
// anything if the source colours ever change.
const sourceOf = (name: string): string => {
  const m = tokensCss.match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  if (!m) throw new Error(`--color-${name} not found in tokens.css`)
  return m[1].trim()
}

// --ground-raised: color-mix(in oklab, var(--color-ground) 90%, var(--color-doc))
// Both inputs opaque, so a plain OKLab lerp is a legitimate independent
// check of the generator's premultiplied-alpha code path.
const groundRaised = formatHex(mixOpaque(sourceOf('ground'), 0.9, sourceOf('doc')))
check(
  fallbackOf('ground-raised') === groundRaised,
  `--ground-raised: expected ${groundRaised} from an independent OKLab lerp, ` +
    `got ${fallbackOf('ground-raised')}.`,
)

// --text-on-ground-muted: color-mix(in oklab, var(--color-doc) 72%, var(--color-ground))
const textOnGroundMuted = formatHex(mixOpaque(sourceOf('doc'), 0.72, sourceOf('ground')))
check(
  fallbackOf('text-on-ground-muted') === textOnGroundMuted,
  `--text-on-ground-muted: expected ${textOnGroundMuted} from an independent OKLab lerp, ` +
    `got ${fallbackOf('text-on-ground-muted')}.`,
)

// --tint-instrument: color-mix(in oklab, var(--color-instrument) 16%, transparent)
// transparent has alpha 0, so premultiplied interpolation can only scale the
// result's alpha — the RGB channels must come out identical to
// --color-instrument's own hex. This exercises the alpha-handling path the
// two opaque-only checks above don't touch.
const instrumentHex = formatHex(parse(sourceOf('instrument'))!).toLowerCase() // "#rrggbb"
const expectedAlphaHex = Math.round(0.16 * 255)
  .toString(16)
  .padStart(2, '0')
const expectedTint = `${instrumentHex}${expectedAlphaHex}`
const tint = (fallbackOf('tint-instrument') ?? '').toLowerCase()
check(
  tint === expectedTint,
  `--tint-instrument: expected ${expectedTint} (--color-instrument's own RGB, alpha scaled to ` +
    `16% independently), got ${tint}.`,
)

// --- 4. every non-:root fallback selector is bumped by `html ` -----------
//
// var() is only invalid at *computed-value time*, not parse time, so an
// equal-specificity fallback of the same layer still loses to the original
// color-mix() rule if it doesn't come later in source order — and source
// order isn't guaranteed for app-modules (pulled in after index.css by
// whichever component imports them) or reachable at all for notfound.css's
// inline app-base/app-components rules (@import must precede other rules).
// Every pass-2 selector below the :root token block gets an extra `html `
// type selector so it wins regardless of order; this re-derives that from
// the committed file rather than trusting the generator ran correctly.
const afterTokenBlock = fallbackFile.slice(fallbackFile.indexOf('@layer app-modules'))
const selectorLines = [...afterTokenBlock.matchAll(/^[ \t]*([^@\s][^\n{]*)\{[ \t]*$/gm)].map((m) =>
  m[1].trim(),
)
check(selectorLines.length > 0, 'Expected at least one non-:root fallback selector to check.')
for (const line of selectorLines) {
  for (const part of line.split(',')) {
    const p = part.trim()
    check(
      /^html\b/i.test(p),
      `color-fallbacks.css selector "${p}" is not prefixed with \`html \` — it can lose the ` +
        "cascade to the original color-mix() rule when import/source order isn't guaranteed.",
    )
  }
}

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(
  `color-fallbacks.css matches its generator, covers all ${tokenColorMixCount} token color-mix() ` +
    'declarations, three spot-checked values agree with an independent computation, and every ' +
    'non-:root fallback selector carries the `html ` specificity bump.\n',
)
