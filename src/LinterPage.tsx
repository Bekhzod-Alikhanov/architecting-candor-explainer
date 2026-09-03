import { useEffect } from 'react'
import { Linter } from './modules/linter/Linter'
import { linterCopy as copy } from './content/linter-rules'
import { prerendered } from './lib/env'
import { meta, paper } from './content/site'
import { skipLink } from './content/ui'

/**
 * Claim this route's own identity in the document head — on the dev server only.
 *
 * /linter is served its own prerendered document now, written by
 * scripts/prerender.mjs with this route's title, description, canonical and
 * social card already in the head, which is the only version a crawler or an
 * unfurler ever sees. Patching the head from an effect could never fix that,
 * because none of them run one.
 *
 * The dev server has no prerender step and answers /linter with index.html, so
 * this stays as the fallback that keeps `pnpm dev` honest about which page it
 * is showing. It does nothing in production.
 */
function useLinterHead() {
  useEffect(() => {
    if (prerendered) return
    document.title = meta.linterTitle
    const set = (selector: string, attr: string, value: string) => {
      document.querySelector(selector)?.setAttribute(attr, value)
    }
    set('link[rel="canonical"]', 'href', meta.linterCanonical)
    set('meta[name="description"]', 'content', meta.linterDescription)
    set('meta[property="og:url"]', 'content', meta.linterCanonical)
    set('meta[property="og:title"]', 'content', meta.linterTitle)
    set('meta[property="og:description"]', 'content', meta.linterDescription)
    set('meta[name="twitter:title"]', 'content', meta.linterTitle)
    set('meta[name="twitter:description"]', 'content', meta.linterDescription)
  }, [])
}

/**
 * The standalone /linter route.
 *
 * The same component as the section, on its own page, so the tool can be shared
 * without the rest of the argument attached.
 */
export function LinterPage() {
  useLinterHead()

  return (
    <>
      {/* The page is one tool with a header, but a keyboard reader still
          arrives at the rubric's two links before reaching it. */}
      <a className="skip-link" href="#linter">
        {skipLink}
      </a>

      {/* A real <header>, outside <main> — the "banner" landmark role does
          not apply to a header nested inside main, same as the site's own
          masthead in App.tsx. */}
      <header className="solo__rubric solo__mast">
        <span>{copy.masthead}</span>
        <a href="/">{copy.backToSite} →</a>
      </header>

      <main className="solo page">
        <div className="solo__head" id="linter">
          <h1 className="sect-headline">{copy.headline}</h1>
          <p className="sect-standfirst">{copy.standfirst}</p>
        </div>

        <Linter standalone />

        <p className="solo__rubric" style={{ marginBlockStart: '2.5rem' }}>
          <span>{paper.citation}</span>
        </p>
      </main>
    </>
  )
}
