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
        <span className="sect-eyebrow">{eyebrow}</span>
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
