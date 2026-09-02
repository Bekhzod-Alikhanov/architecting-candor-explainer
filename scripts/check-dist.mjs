/**
 * check-dist.mjs — asserts the built site is the site.
 *
 *   pnpm build   (… → prerender.mjs → this)
 *
 * `vite build` exits 0 when it silently drops an HTML entry (it has), and
 * prerender.mjs writes documents whose whole point is what is inside them, so
 * neither can be trusted by exit code alone. Everything asserted here is
 * something that has broken, or would break silently: a missing page, an empty
 * root, a canonical pointing at the wrong route, a placeholder shipped as
 * static markup, an inline script the CSP would refuse to run.
 *
 * The expected values come from the SSR bundle, which re-exports src/content,
 * so this checks the built pages against the site's own copy rather than
 * against a second copy kept here.
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chunkStylesheets, esc } from './build-shared.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')

const { deferredLoads, meta, noscript, sections } = await import(
  pathToFileURL(join(ROOT, 'dist-ssr', 'entry-server.js')).href
)

/** Moved here by prerender.mjs rather than deleted — see the note there. */
const manifest = JSON.parse(readFileSync(join(ROOT, 'dist-ssr', 'client-manifest.json'), 'utf8'))

/** A document over this is a document nobody should be sent on a phone. */
const MAX_KB = 500

const failures = []
const fail = (m) => failures.push(m)

const read = (rel) => {
  const file = join(DIST, rel)
  if (!existsSync(file)) {
    fail(`${rel} is missing`)
    return null
  }
  const kb = statSync(file).size / 1024
  if (kb > MAX_KB) fail(`${rel} is ${kb.toFixed(0)} kB, over the ${MAX_KB} kB ceiling`)
  return { html: readFileSync(file, 'utf8'), kb }
}

const has = (html, needle, what, rel) => {
  if (!html.includes(needle)) fail(`${rel}: ${what}`)
}

/**
 * Hoisted out of the `/` block below: with `cssCodeSplit: false` this is the
 * one stylesheet for the whole build, and 404.html links the same file, not
 * a second copy — see the check on it further down.
 */
const { linked, lazy } = chunkStylesheets(manifest)

// --- / -----------------------------------------------------------------------

const home = read('index.html')
if (home) {
  const { html } = home

  if (!/<h1[\s>]/.test(html)) fail('index.html: no <h1> in the served markup')

  for (const s of sections) {
    has(html, `id="${s.id}"`, `§${s.n} (#${s.id}) is not in the prerendered markup`, 'index.html')
  }

  // A placeholder in the static HTML means a section did not render at build
  // time and shipped as "Loading this section." instead.
  if (html.includes('aria-busy="true"')) fail('index.html: a deferred placeholder was prerendered')

  has(
    html,
    `<noscript><p class="noscript">${esc(noscript.home)}</p></noscript>`,
    'no <noscript> block, or not the homepage sentence',
    'index.html',
  )
  has(
    html,
    `<link rel="canonical" href="${meta.canonical}" />`,
    `canonical is not ${meta.canonical}`,
    'index.html',
  )
  has(html, `<title>${meta.title}`, 'title is not the homepage title', 'index.html')

  // Derived from the list the prerender itself renders from, so adding a
  // seventh deferred section does not need this number changed by hand.
  const wrappers = (html.match(/data-deferred="static"/g) ?? []).length
  if (wrappers !== deferredLoads.length) {
    fail(`index.html: ${wrappers} adopted section wrappers, expected ${deferredLoads.length}`)
  }

  /*
   * Every stylesheet the homepage needs, in the homepage's head.
   *
   * §02 to §07 are drawn from the first byte, so their CSS has to be there from
   * the first byte too. Without this the failure is silent in both directions:
   * a stylesheet reachable only through a dynamic import arrives after the
   * markup it styles (six sections of unstyled controls for a reader without
   * JavaScript, and Lighthouse's target-size audit failing on them), and a
   * manifest shape this walk stops recognising returns nothing at all, which is
   * why an empty walk is a failure here rather than a log line.
   */
  if (!linked.length) {
    fail('the manifest walk found no stylesheets at all — it no longer reads the manifest')
  }
  if (lazy.length) {
    fail(
      `${lazy.join(', ')} would be fetched by the chunk that mounts a section the build already drew — see cssCodeSplit in vite.config.ts`,
    )
  }
  for (const file of linked) {
    has(html, `href="/${file}"`, `${file} is not linked in the head`, 'index.html')
  }
  const links = (html.match(/rel="stylesheet"/g) ?? []).length
  if (links !== linked.length) {
    fail(`index.html: ${links} stylesheet links, expected ${linked.length}`)
  }
}

// --- /linter -----------------------------------------------------------------

const linter = read(join('linter', 'index.html'))
if (linter) {
  const { html } = linter
  const rel = 'linter/index.html'

  if (!/<h1[\s>]/.test(html)) fail(`${rel}: no <h1> in the served markup`)
  has(html, `<title>${meta.linterTitle}</title>`, 'title is not the linter title', rel)
  has(
    html,
    `<link rel="canonical" href="${meta.linterCanonical}" />`,
    `canonical is not ${meta.linterCanonical}`,
    rel,
  )
  for (const [attr, key, value] of [
    ['name', 'description', meta.linterDescription],
    ['property', 'og:url', meta.linterCanonical],
    ['property', 'og:title', meta.linterTitle],
    ['property', 'og:description', meta.linterDescription],
    ['name', 'twitter:title', meta.linterTitle],
    ['name', 'twitter:description', meta.linterDescription],
  ]) {
    // esc() is prerender.mjs's own, imported rather than restated: a second
    // escaping rule here would assert the built page against the wrong string.
    has(
      html,
      `<meta ${attr}="${key}" content="${esc(value)}" />`,
      `${key} is not the linter's`,
      rel,
    )
  }
  has(
    html,
    `<noscript><p class="noscript">${esc(noscript.linter)}</p></noscript>`,
    'no <noscript> block, or not the linter sentence',
    rel,
  )
  if (html.includes(meta.canonical.replace(/\/$/, '/"'))) {
    fail(`${rel}: still carries a homepage URL`)
  }
}

// --- the error page ----------------------------------------------------------

// Dropped once already by a config change that exited 0. It is built rather
// than dropped in public/, which is exactly why it can go missing.
const notFound = read('404.html')
if (notFound) {
  const { html } = notFound
  const rel = '404.html'

  // With cssCodeSplit off, `linked` (computed above for index.html) is the
  // one stylesheet for the entire build, and 404.html has to link that exact
  // file too — not a second copy, and not none. A scoping regression in
  // notfound.css (see the header of that file) is invisible to a byte check
  // like this one; this only proves the page still loads the shared sheet.
  for (const file of linked) {
    has(html, `href="/${file}"`, `${file} is not linked in the head`, rel)
  }
  const links = (html.match(/rel="stylesheet"/g) ?? []).length
  if (links !== linked.length) {
    fail(`${rel}: ${links} stylesheet links, expected ${linked.length}`)
  }
}

// --- every document ----------------------------------------------------------

for (const rel of ['index.html', join('linter', 'index.html'), '404.html']) {
  const file = join(DIST, rel)
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')

  // The CSP has no 'unsafe-inline' for scripts and no nonce, so an inline
  // script would be dropped by the browser without a word. The only inline
  // element allowed here is JSON-LD, which is data and never executes.
  for (const [, attrs] of html.matchAll(/<script([^>]*)>/g)) {
    const ok = /type="module"/.test(attrs) || /type="application\/ld\+json"/.test(attrs)
    if (!ok) fail(`${rel}: <script${attrs}> is neither a module nor ld+json`)
  }

  for (const [, json] of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(json)
    } catch (e) {
      fail(`${rel}: JSON-LD does not parse — ${e.message}`)
    }
  }
}

// --- the sitemap -------------------------------------------------------------

const sitemapFile = join(DIST, 'sitemap.xml')
if (!existsSync(sitemapFile)) {
  fail('sitemap.xml is missing')
} else {
  const xml = readFileSync(sitemapFile, 'utf8')
  for (const loc of [meta.canonical, meta.linterCanonical]) {
    if (!xml.includes(`<loc>${loc}</loc>`)) fail(`sitemap.xml does not list ${loc}`)
  }
  if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(xml)) fail('sitemap.xml has no lastmod')
}

// -----------------------------------------------------------------------------

const sizes = ['index.html', join('linter', 'index.html'), '404.html']
  .filter((rel) => existsSync(join(DIST, rel)))
  .map(
    (rel) => `${rel.replace('\\', '/')} ${(statSync(join(DIST, rel)).size / 1024).toFixed(1)} kB`,
  )
console.log(`\ncheck-dist  ${sizes.join('  ·  ')}`)

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('Both pages carry their own markup, head and canonical.\n')
