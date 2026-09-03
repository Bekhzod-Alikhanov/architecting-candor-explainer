import { glossary, type GlossaryId } from '../content/glossary'

/**
 * Finds the first glossary term in `text`, so a definition wraps only its
 * own first occurrence and never fights with an earlier or later mention of
 * the same term for the reader's attention.
 *
 * Matching is case-insensitive and at word boundaries, so "privilege" never
 * fires inside "privileged". Forms are tried longest first: where two forms
 * of the same id start at the same position — "privileged" and "privileged
 * channel" both starting on "privileged" — the longer, more specific phrase
 * wins rather than the button wrapping just its first word.
 */

export interface TermMatch {
  readonly before: string
  readonly match: string
  readonly after: string
  readonly id: GlossaryId
}

/** Exported so scripts/check-glossary.ts can assert a metacharacter in a
 *  form (a literal ".", "(", etc.) is matched literally rather than as
 *  regex syntax. */
export function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findTerm(
  text: string,
  ids: readonly GlossaryId[],
  seen: ReadonlySet<GlossaryId>,
): TermMatch | null {
  const candidates = glossary
    .filter((entry) => ids.includes(entry.id) && !seen.has(entry.id))
    .flatMap((entry) => entry.forms.map((form) => ({ id: entry.id, form })))
    .sort((a, b) => b.form.length - a.form.length)

  let best: { index: number; length: number; id: GlossaryId } | null = null
  for (const { id, form } of candidates) {
    const re = new RegExp(`\\b${escapeForRegex(form)}\\b`, 'i')
    const m = re.exec(text)
    // Strictly less-than, so that among ties at the same start index the
    // longest form — tried first, since candidates are sorted longest-first
    // — is the one that sticks.
    if (m && (best === null || m.index < best.index)) {
      best = { index: m.index, length: m[0].length, id }
    }
  }
  if (!best) return null

  return {
    before: text.slice(0, best.index),
    match: text.slice(best.index, best.index + best.length),
    after: text.slice(best.index + best.length),
    id: best.id,
  }
}
