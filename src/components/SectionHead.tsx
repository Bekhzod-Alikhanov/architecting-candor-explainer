import { bates } from '../content/site'

/**
 * The stamped section head. The numbering is chain of custody: an append-only
 * production in which nothing has been removed.
 */
export interface SectionHeadProps {
  readonly n: string
  readonly eyebrow: string
  /** Production number for this section, 1-indexed. */
  readonly seq: number
  readonly titleId?: string
  readonly headline?: string
  readonly standfirst?: string
}

export function SectionHead({ n, eyebrow, seq, titleId, headline, standfirst }: SectionHeadProps) {
  return (
    <>
      <div className="sect-head">
        <span className="sect-num" aria-hidden="true">
          {n}
        </span>
        {/* Where a section has no headline — §09 opens straight into the
            citation card — the eyebrow carries the id instead, so a section's
            aria-labelledby always resolves to an element that exists. Without
            this, §09 had no accessible name at all. */}
        <span className="sect-eyebrow" {...(titleId && !headline ? { id: titleId } : {})}>
          {eyebrow}
        </span>
        <span className="bates sect-bates">{bates(seq)}</span>
      </div>
      {headline ? (
        <h2 className="sect-headline" {...(titleId ? { id: titleId } : {})}>
          {headline}
        </h2>
      ) : null}
      {standfirst ? <p className="sect-standfirst">{standfirst}</p> : null}
    </>
  )
}
