import type { ReactNode } from 'react'
import { bates, meta, section, sectionLinkCopy, type SectionId } from '../content/site'
import { a11y } from '../content/ui'
import type { GlossaryId } from '../content/glossary'
import { defineTerms } from '../lib/defineTerms'
import { useCopy } from '../lib/useCopy'
import { SectionTime } from './SectionTime'

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
  /** The register in site.ts is the single source for a section's number,
   *  title and Bates sequence — this is the only thing a caller supplies. */
  readonly id: SectionId
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
  /**
   * Glossary ids the standfirst may define inline. Absent, the standfirst
   * renders as plain text exactly as before — this is additive.
   */
  readonly terms?: readonly GlossaryId[]
  /**
   * The section's shared "already defined" set, for a caller that also runs
   * `defineTerms` on body content below the head and needs the same term not
   * opened twice. Omitted, a fresh set is used — scoped to the standfirst
   * alone, same as passing one used nowhere else.
   */
  readonly seen?: Set<GlossaryId>
}

export function SectionHead({
  id,
  titleId,
  headline,
  standfirst,
  aside,
  leadBelow,
  terms,
  seen,
}: SectionHeadProps) {
  const { n, title: eyebrow, seq, readingMinutes } = section(id)
  const { copied, copy: copyLink } = useCopy()
  const effectiveSeen = seen ?? new Set<GlossaryId>()

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
        {/* Grouped so the row can wrap as a unit below 48rem — see .sect-meta
            in components.css — without disturbing reading order: `display:
            contents` at wider widths keeps these three exactly where they'd
            sit as direct children of .sect-head. */}
        <span className="sect-meta">
          <SectionTime minutes={readingMinutes} />
          <span className="sect-copyWrap">
            <button
              type="button"
              className="sect-copy"
              aria-label={a11y.copySectionLink(eyebrow)}
              onClick={() => copyLink(`${meta.canonical}#${id}`)}
            >
              {/* A link glyph, not an emoji — this codebase draws its own marks. */}
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M6.5 9.5a2.5 2.5 0 0 1 0-3.54l2-2a2.5 2.5 0 0 1 3.54 3.54l-1 1M9.5 6.5a2.5 2.5 0 0 1 0 3.54l-2 2a2.5 2.5 0 0 1-3.54-3.54l1-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {/* Absolutely positioned, so a sighted reader sees confirmation
                without the stamp bar reflowing. One persistent role="status"
                node whose text changes — rather than mounting/unmounting a
                status element — because some screen readers only announce a
                live region's own text mutating, not a fresh node appearing. */}
            <span className="sect-copy__status" role="status">
              {copied ? sectionLinkCopy.copied : ''}
            </span>
          </span>
          <span className="bates sect-bates">{bates(seq)}</span>
        </span>
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
          {standfirst ? (
            <p className="sect-standfirst">
              {terms ? defineTerms(standfirst, terms, effectiveSeen) : standfirst}
            </p>
          ) : null}
          {leadBelow ? <div className="sect-intro__leadBelow">{leadBelow}</div> : null}
        </div>
        {aside ? <div className="sect-intro__aside">{aside}</div> : null}
      </div>
    </>
  )
}
