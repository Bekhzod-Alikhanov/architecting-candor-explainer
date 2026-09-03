import { useId, type ReactNode } from 'react'
import { glossary, type GlossaryId } from '../content/glossary'

const byId = new Map(glossary.map((entry) => [entry.id, entry]))

export interface TermProps {
  readonly id: GlossaryId
  /** The exact substring matched in the running text — not the glossary's
   *  own `term` spelling — so the reader sees their own page's wording
   *  underlined, never a silently substituted one. */
  readonly children: ReactNode
}

/**
 * A first mention of a glossary term, wrapped in a native popover.
 *
 * Same reasoning as Provenance.tsx's `<Prov>`: a `title` attribute reaches a
 * mouse and nothing else, so the definition is a real button with
 * `popoverTarget`/`aria-describedby`, which gives Escape-to-close and light
 * dismiss for free and describes the term to a screen reader whether or not
 * the popover is ever opened.
 */
export function Term({ id, children }: TermProps) {
  const uid = useId()
  const popId = `term-${uid}`
  const entry = byId.get(id)
  if (!entry) throw new Error(`Unknown glossary id: ${id}`)

  return (
    <>
      <button
        type="button"
        className="term"
        data-term={id}
        popoverTarget={popId}
        aria-describedby={popId}
      >
        {children}
      </button>
      <span popover="auto" id={popId} className="term__pop" role="note">
        <strong>{entry.term}</strong> {entry.definition}{' '}
        <span className="term__ref">{entry.ref}</span>
      </span>
    </>
  )
}
