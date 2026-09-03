import type { ReactNode } from 'react'
import { Term } from '../components/Term'
import type { GlossaryId } from '../content/glossary'
import { findTerm } from './termMatch'

/**
 * Wraps the first occurrence of each glossary term in `text` with `<Term>`,
 * reconstructing the rest of the text exactly around it.
 *
 * `seen` is threaded across calls — one per paragraph, typically — within a
 * single section, so a term already opened once in that section is not
 * opened again on its second mention. It is mutated in place: the caller
 * passes the same set into every call it makes for that section.
 */
export function defineTerms(
  text: string,
  ids: readonly GlossaryId[],
  seen: Set<GlossaryId>,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let remaining = text
  let key = 0

  for (;;) {
    const found = findTerm(remaining, ids, seen)
    if (!found) {
      nodes.push(remaining)
      break
    }
    if (found.before) nodes.push(found.before)
    seen.add(found.id)
    nodes.push(
      <Term id={found.id} key={`${found.id}-${key++}`}>
        {found.match}
      </Term>,
    )
    remaining = found.after
  }

  return nodes
}
