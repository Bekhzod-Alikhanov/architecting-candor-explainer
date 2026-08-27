import { useEffect } from 'react'
import { Linter } from './modules/linter/Linter'
import { linterCopy as copy } from './content/linter-rules'
import { meta, paper } from './content/site'

/**
 * Claim this route's own identity in the document head.
 *
 * Both entry points are served from the same index.html, so /linter arrived
 * carrying the homepage's title, description, canonical and og:url. The sitemap
 * lists /linter as its own URL, so the page was simultaneously asking to be
 * indexed and declaring itself a duplicate of /. Lighthouse scored the route 92
 * on SEO for exactly that.
 */
function useLinterHead() {
  useEffect(() => {
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
    <main className="solo page">
      <div className="solo__rubric">
        <span>{copy.masthead}</span>
        <a href="/">{copy.backToSite} →</a>
      </div>

      <div className="solo__head">
        <h1 className="sect-headline">{copy.headline}</h1>
        <p className="sect-standfirst">{copy.standfirst}</p>
      </div>

      <Linter standalone />

      <p className="solo__rubric" style={{ marginBlockStart: '2.5rem' }}>
        <span>{paper.citation}</span>
      </p>
    </main>
  )
}
