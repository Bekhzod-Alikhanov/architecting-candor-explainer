import { Linter } from './modules/linter/Linter'
import { linterCopy as copy } from './content/linter-rules'
import { paper } from './content/site'

/**
 * The standalone /linter route.
 *
 * The same component as the section, on its own page, so the tool can be shared
 * without the rest of the argument attached.
 */
export function LinterPage() {
  return (
    <main className="solo page">
      <div className="solo__rubric">
        <span>Architecting Candor · the incident ticket linter</span>
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
