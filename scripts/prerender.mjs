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

import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { esc } from './build-shared.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const SSR = join(ROOT, 'dist-ssr', 'entry-server.js')
/** Where the client manifest is kept for check-dist.mjs, which walks it to
 *  assert that every stylesheet the homepage needs is linked in the document.
 *  Out of dist/, because publishing the build's internal shape has no reader;
 *  moved rather than deleted, because that assertion needs it. */
const MANIFEST_KEEP = join(ROOT, 'dist-ssr', 'client-manifest.json')

const { render, meta, noscript, paper } = await import(pathToFileURL(SSR).href)

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

/**
 * The routes, and where each one's document goes.
 *
 * /linter is a directory with its own index.html rather than linter.html, so
 * that both /linter and /linter/ resolve to it on every host and in
 * `vite preview` without a rewrite rule doing the work.
 */
const ROUTES = [
  { route: '/', out: 'index.html', note: noscript.home },
  { route: '/linter', out: join('linter', 'index.html'), note: noscript.linter },
]

/**
 * The DOI record, shared by the WebSite's #website id and every reference to
 * the article from a WebPage or WebApplication node in the graph.
 */
const WEBSITE_ID = `${meta.canonical}#website`
const ARTICLE_ID = paper.doiUrl

/** schema.org Organization for the publisher — one object, reused by both
 *  the WebSite and the ScholarlyArticle so a validator sees one publisher,
 *  not two independently-typed copies that happen to match. */
function organization() {
  return { '@type': 'Organization', name: paper.publisher }
}

function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: paper.title,
    url: meta.canonical,
    publisher: organization(),
    inLanguage: paper.language,
  }
}

/** The one ScholarlyArticle node, identical on both routes: this is a
 *  companion site to a single paper, not two papers. */
function scholarlyArticle() {
  return {
    '@type': 'ScholarlyArticle',
    '@id': ARTICLE_ID,
    name: paper.title,
    headline: paper.title,
    alternativeHeadline: paper.subtitle,
    author: paper.authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      givenName: a.given,
      familyName: a.family,
    })),
    publisher: organization(),
    datePublished: paper.datePublished,
    inLanguage: paper.language,
    url: paper.paperUrl,
    sameAs: [paper.doiUrl, paper.paperUrl],
    identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: paper.doi },
  }
}

/** The OG card's own absolute URL, derived rather than duplicated — it is
 *  already a literal in index.html, and a canonical-only site move (see the
 *  README's deployment note) should not also require finding this one. */
function ogImageUrl() {
  return new URL('og.png', meta.canonical).toString()
}

/** `<script type="application/ld+json">`, escaped so a `</script` in any
 *  interpolated string (there isn't one today) cannot end the element early —
 *  see check-dist.mjs's inline-script check, which this tag has to survive. */
function jsonLdScript(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  )
  return `<script type="application/ld+json">${json}</script>`
}

/** Highwire/Google Scholar tags, identical in shape on both routes — the
 *  citable object is the paper, not the page. Powers Zotero/Mendeley
 *  one-click capture on this companion page; Google Scholar indexes the
 *  paper's own record via citation_abstract_html_url. */
function citationTags() {
  const tags = [tag('name', 'citation_title', paper.title)]
  for (const a of paper.authors) {
    tags.push(tag('name', 'citation_author', `${a.family}, ${a.given}`))
  }
  tags.push(
    tag('name', 'citation_publication_date', paper.datePublished.replace('-', '/')),
    tag('name', 'citation_publisher', paper.publisher),
    tag('name', 'citation_doi', paper.doi),
    tag('name', 'citation_abstract_html_url', paper.paperUrl),
    tag('name', 'citation_language', paper.language),
  )
  return tags
}

/** Head rewrites and additions for one route. */
function buildHead(route) {
  /** [what, pattern, replacement] — each one must match, or the build fails. */
  const swaps = []
  /** Extra tags, inserted before </head>. */
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

  const graph =
    route === '/linter'
      ? [
          website(),
          scholarlyArticle(),
          {
            '@type': 'WebPage',
            '@id': meta.linterCanonical,
            isPartOf: { '@id': WEBSITE_ID },
            about: { '@id': ARTICLE_ID },
            description: meta.linterDescription,
          },
          {
            '@type': 'WebApplication',
            '@id': `${meta.linterCanonical}#app`,
            name: meta.linterTitle,
            url: meta.linterCanonical,
            applicationCategory: 'UtilitiesApplication',
            browserRequirements: 'Requires JavaScript',
            isAccessibleForFree: true,
            about: { '@id': ARTICLE_ID },
          },
        ]
      : [
          website(),
          scholarlyArticle(),
          {
            '@type': 'WebPage',
            '@id': meta.canonical,
            isPartOf: { '@id': WEBSITE_ID },
            about: { '@id': ARTICLE_ID },
            mainEntity: { '@id': ARTICLE_ID },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImageUrl(),
              width: 2400,
              height: 1260,
            },
            description: meta.description,
          },
        ]

  tags.push(jsonLdScript(graph), ...citationTags())

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

/** A replacement that refuses to no-op — and refuses to guess. A silent miss
 *  ships a page with the wrong canonical, which is exactly the bug being fixed;
 *  a second match means the pattern has stopped identifying one thing and
 *  `String.replace` is quietly picking the first of them. */
function swap(html, pattern, replacement, what) {
  const all = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  )
  const hits = [...html.matchAll(all)].length
  if (hits !== 1) {
    throw new Error(`prerender: ${hits} matches for ${what} in the template, expected exactly 1`)
  }
  return html.replace(pattern, () => replacement)
}

console.log(`\nprerender`)

for (const { route, out, note } of ROUTES) {
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
  const beforePreloads = html
  html = html.replaceAll(
    '<link rel="modulepreload" crossorigin',
    '<link rel="modulepreload" fetchpriority="low" crossorigin',
  )
  // Same reasoning as swap(): a rewrite that quietly matched nothing would
  // leave the preloads competing with the paint again, and nothing would say so.
  if (html === beforePreloads) {
    throw new Error(`prerender: ${route} has no modulepreload links to demote`)
  }

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

// The manifest exists for the build scripts. Leaving it in dist publishes the
// build's internal shape for no reason, so it moves next to the SSR bundle
// check-dist.mjs already reads — which also keeps that script re-runnable
// against a finished dist.
renameSync(join(DIST, '.vite', 'manifest.json'), MANIFEST_KEEP)
rmSync(join(DIST, '.vite'), { recursive: true, force: true })
console.log('')
