import { SectionHead } from '../../components/SectionHead'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Linter } from '../linter/Linter'
import { Checklist } from '../checklist/Checklist'
import { linterCopy as copy, linterArgues } from '../../content/linter-rules'

/**
 * 08 — Take it to your GC.
 *
 * Two things the reader leaves with: a tool that runs on their own text, and a
 * one-page artifact they can hand to their general counsel. The checklist is a
 * direct child of this section because the print stylesheet targets it that way.
 */
export function TakeItToYourGC() {
  return (
    <section className="sect page" id="gc" aria-labelledby="gc-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={9}
        titleId="gc-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />
      <Linter />
      <ArguesBlock label={linterArgues.label} body={linterArgues.body} />
      <Checklist />
    </section>
  )
}
