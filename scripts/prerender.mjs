/**
 * prerender.mjs — writes the two documents this site actually serves.
 *
 *   pnpm build   (vite build → vite build --ssr → this → check-dist.mjs)
 *
 * `vite build` leaves an index.html whose body is `<div id="root"></div>`, which
 * is a page only to a browser that runs JavaScript. This renders both entry
 * points with src/entry-server.tsx and puts the result in that div, so the whole
 * argument is in the HTML: find-in-page reaches every section, reader modes and
 * unfurlers see prose, and /linter stops being served the homepage's head.
 *
 * There is still no server anywhere. This runs once, at build time, and what it
 * writes is static files.
 *
 * The content — titles, descriptions, canonicals, the noscript sentence — is
 * imported from the SSR bundle rather than restated here, so src/content stays
 * the only place any of this site's prose lives.
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const SSR = join(ROOT, 'dist-ssr', 'entry-server.js')

const { render, meta, noscript } = await import(pathToFileURL(SSR).href)

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const manifest = JSON.parse(readFileSync(join(DIST, '.vite', 'manifest.json'), 'utf8'))

/**
 * The routes, and where each one's document goes.
 *
 * /linter is a directory with its own index.html rather than linter.html, so
 * that both /linter and /linter/ resolve to it on every host and in
 * `vite preview` without a rewrite rule doing the work.
 */
const ROUTES = [
  { route: '/', out: 'index.html', lazyCss: true, note: noscript.home },
  { route: '/linter', out: join('linter', 'index.html'), lazyCss: false, note: noscript.linter },
]

/**
 * One stylesheet carrying the CSS the lazy chunks would each have brought with
 * them on mount.
 *
 * §02 to §07 are in the document from the first byte now, so the CSS that
 * styles them has to arrive with it — otherwise a reader without JavaScript
 * gets six sections of unstyled markup, and Lighthouse's target-size audit
 * fails on their unstyled controls, which is how that was noticed.
 *
 * Six separate links cost six round trips ahead of the fonts. They are
 * concatenated into one file instead: order is irrelevant, because every sheet
 * in src/styles and every module sheet is inside a cascade layer. The chunks
 * still carry their own copies, which is what styles a section mounted on a
 * page that was not prerendered (the dev server), and Vite's loader skips the
 * fetch when the href is already in the document.
 *
 * Walked from the client entry through the manifest's own import graph, so the
 * 404 page's stylesheet is not dragged in and a new lazy section needs no
 * change here.
 */
function sectionStylesheet() {
  const seen = new Set()
  const css = new Set()

  const walk = (key) => {
    if (!key || seen.has(key)) return
    seen.add(key)
    const chunk = manifest[key]
    if (!chunk) return
    for (const f of chunk.css ?? []) css.add(f)
    for (const next of [...(chunk.imports ?? []), ...(chunk.dynamicImports ?? [])]) walk(next)
  }
  walk('index.html')

  // The entry's own stylesheet is already linked in the template Vite wrote.
  const files = [...css].filter((f) => !template.includes(f))
  if (!files.length) return null

  const body = files.map((f) => readFileSync(join(DIST, f), 'utf8')).join('\n')
  // Hashed like everything else in assets/, so it inherits the immutable
  // cache header and changes name whenever any section's CSS changes.
  const hash = createHash('sha256').update(body).digest('base64url').slice(0, 8)
  const out = `assets/sections-${hash}.css`
  writeFileSync(join(DIST, out), body, 'utf8')
  return { file: out, from: files, bytes: body.length }
}

/** Head rewrites and additions for one route. */
function buildHead(route) {
  /** [what, pattern, replacement] — each one must match, or the build fails. */
  const swaps = []
  /** Extra tags, inserted before </head>. Task 1.2 puts JSON-LD here. */
  const tags = []

  if (route === '/linter') {
    // The route was being served the homepage's identity: its title, its
    // description, and a canonical pointing at /. The sitemap lists /linter as
    // its own URL, so the page was asking to be indexed and declaring itself a
    // duplicate at the same time.
    swaps.push(
      ['title', /<title>[\s\S]*?<\/title>/, `<title>${esc(meta.linterTitle)}</title>`],
      [
        'description',
        metaTag('name', 'description'),
        tag('name', 'description', meta.linterDescription),
      ],
      [
        'canonical',
        /<link rel="canonical"[^>]*>/,
        `<link rel="canonical" href="${esc(meta.linterCanonical)}" />`,
      ],
      ['og:url', metaTag('property', 'og:url'), tag('property', 'og:url', meta.linterCanonical)],
      ['og:title', metaTag('property', 'og:title'), tag('property', 'og:title', meta.linterTitle)],
      [
        'og:description',
        metaTag('property', 'og:description'),
        tag('property', 'og:description', meta.linterDescription),
      ],
      [
        'twitter:title',
        metaTag('name', 'twitter:title'),
        tag('name', 'twitter:title', meta.linterTitle),
      ],
      [
        'twitter:description',
        metaTag('name', 'twitter:description'),
        tag('name', 'twitter:description', meta.linterDescription),
      ],
    )
  }

  return { swaps, tags }
}

/** Matches one <meta> element by attribute, across the line breaks the source
 *  HTML uses for the long ones. */
function metaTag(attr, value) {
  return new RegExp(`<meta\\s+${attr}="${value}"[\\s\\S]*?/>`)
}

function tag(attr, value, content) {
  return `<meta ${attr}="${value}" content="${esc(content)}" />`
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** A replacement that refuses to no-op. A silent miss here ships a page with
 *  the wrong canonical, which is exactly the bug being fixed. */
function swap(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`prerender: nothing matched ${what} in the template`)
  return html.replace(pattern, () => replacement)
}

const sectionCss = sectionStylesheet()
console.log(`\nprerender`)
console.log(
  sectionCss
    ? `  ${sectionCss.file}  ${(sectionCss.bytes / 1024).toFixed(1)} kB from ${sectionCss.from.length} chunk stylesheets`
    : '  no lazy stylesheets',
)

for (const { route, out, lazyCss, note } of ROUTES) {
  const { prelude, errors } = await render(route)

  // Buffers, concatenated once: the stream splits on byte boundaries, and this
  // page is full of typographic punctuation that a per-chunk toString would
  // cut in half.
  const chunks = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))
  const body = Buffer.concat(chunks).toString('utf8')

  if (errors.length) {
    for (const e of errors) console.error(e)
    throw new Error(`prerender: ${route} rendered with ${errors.length} error(s)`)
  }

  let html = template
  const { swaps, tags } = buildHead(route)
  for (const [what, pattern, replacement] of swaps) {
    html = swap(html, pattern, replacement, `${route} ${what}`)
  }

  /*
   * The section stylesheet goes in the head, with everything else.
   *
   * Putting it in the body just before the first deferred section — where it
   * would have blocked the paint of those sections only, rather than of the
   * hero — cost a hydration mismatch: that position is inside the tree React
   * hydrates, so React found a <link> where it expected the section's wrapper,
   * discarded the prerendered subtree and rebuilt it on the client. React's own
   * #418, caught by the [hydration] assertion in check-keyboard.mjs. The head is
   * the only place a stylesheet can go without being inside somebody's render.
   */
  if (lazyCss && sectionCss) {
    tags.push(`<link rel="stylesheet" crossorigin href="/${sectionCss.file}" />`)
  }

  const extra = tags.map((t) => `    ${t}`).join('\n')
  if (extra) {
    html = swap(html, /\n?\s*<\/head>/, `\n${extra}\n  </head>`, `${route} </head>`)
  }

  /*
   * The hydration bundle, demoted.
   *
   * A module script is deferred but still fetched at high priority, which was
   * right while it was the only thing that could draw the page. It is not any
   * more: the document arrives complete, and 98 kB of JavaScript competing for
   * a phone's bandwidth now delays the paint of markup that needs none of it.
   * Measured on Lighthouse's throttled mobile profile: first paint 2.9s → 2.3s,
   * with total blocking time unchanged at single-digit milliseconds.
   */
  html = swap(
    html,
    /<script type="module" crossorigin/,
    '<script type="module" fetchpriority="low" crossorigin',
    `${route} module script`,
  )
  html = html.replaceAll(
    '<link rel="modulepreload" crossorigin',
    '<link rel="modulepreload" fetchpriority="low" crossorigin',
  )

  html = swap(
    html,
    /<body>/,
    `<body>\n    <noscript><p class="noscript">${esc(note)}</p></noscript>`,
    `${route} <body>`,
  )
  html = swap(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, `${route} #root`)

  const file = join(DIST, out)
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, html, 'utf8')
  console.log(`  ${out.padEnd(18)} ${(statSync(file).size / 1024).toFixed(1)} kB`)
}

/**
 * The sitemap, which used to sit in public/ and be maintained by hand — one
 * more place a URL could disagree with src/content/site.ts. lastmod is the
 * build date: the only date this build can honestly claim to know about the
 * documents it just produced.
 */
const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  { loc: meta.canonical, priority: '1.0' },
  { loc: meta.linterCanonical, priority: '0.6' },
]
  .map(
    ({ loc, priority }) => `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8')
console.log(`  sitemap.xml        2 urls, lastmod ${lastmod}`)

// The manifest exists for this script. Leaving it in dist publishes the build's
// internal shape for no reason.
rmSync(join(DIST, '.vite'), { recursive: true, force: true })
console.log('')
