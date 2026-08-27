import type { ReactNode } from 'react'
import { bates } from '../content/site'

/**
 * The stamped section head. The numbering is chain of custody: an append-only
 * production in which nothing has been removed.
 *
 * The head bar spans the section. Below it, the intro is a two-track grid on
 * wide viewports, and which arrangement it uses depends on whether the section
 * supplied a companion:
 *
 *   with a companion    headline and deck stack in the left track, and the
 *                       companion — for the guided sections, the scaffold —
 *                       takes the right track beside them.
 *   without a companion the deck sits BESIDE the headline rather than under
 *                       it. That is what a masthead does, and it is what stops
 *                       a three-line deck from floating in 700px of nothing.
 *
 * Below the breakpoint both collapse to the original single column, in the
 * original reading order, so nothing about narrow screens changes.
 */
export interface SectionHeadProps {
  readonly n: string
  readonly eyebrow: string
  /** Production number for this section, 1-indexed. */
  readonly seq: number
  readonly titleId?: string
  readonly headline?: string
  readonly standfirst?: string
  /**
   * Companion content for the right track. The guided sections pass their
   * Scaffold here so the steps sit beside the intro instead of below it, which
   * fills the width and takes a screenful out of the page's height.
   */
  readonly aside?: ReactNode
  /**
   * More content for the LEFT track, below the deck. §03 puts the incident
   * briefing here: it has to be read before step 01 talks about the artifacts,
   * and putting it in the left track keeps that order while balancing the two
   * tracks' heights. Without it a short lead beside a tall companion leaves a
   * band of nothing under the deck.
   */
  readonly leadBelow?: ReactNode
}

export function SectionHead({
  n,
  eyebrow,
  seq,
  titleId,
  headline,
  standfirst,
  aside,
  leadBelow,
}: SectionHeadProps) {
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

      <div className="sect-intro" data-aside={aside ? 'true' : 'false'}>
        {/* The lead is wrapped rather than left as two bare grid children. As
            siblings of a companion that spans both rows, the row heights were
            driven by the companion's height and the deck was pushed halfway
            down the section. */}
        <div className="sect-intro__lead">
          {headline ? (
            <h2 className="sect-headline" {...(titleId ? { id: titleId } : {})}>
              {headline}
            </h2>
          ) : null}
          {standfirst ? <p className="sect-standfirst">{standfirst}</p> : null}
          {leadBelow ? <div className="sect-intro__leadBelow">{leadBelow}</div> : null}
        </div>
        {aside ? <div className="sect-intro__aside">{aside}</div> : null}
      </div>
    </>
  )
}
