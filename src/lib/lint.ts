import { rules, categories, type Category } from '../content/linter-rules'

/**
 * The linter.
 *
 * Pure, synchronous, and entirely local. Phrases are matched case-insensitively
 * at word boundaries, longest first, and overlapping matches are dropped so a
 * hit on "harmful advice" does not also report "harmful".
 */

export interface Flag {
  readonly start: number
  readonly end: number
  readonly text: string
  readonly category: Category
  readonly categoryLabel: string
  readonly hazard: string
  readonly substitute: string
  readonly note: string | null
}

export interface Segment {
  /** Offset in the source text, so a React key need not be an array index. */
  readonly start: number
  readonly text: string
  readonly flag: Flag | null
}

export interface LintResult {
  readonly flags: readonly Flag[]
  readonly segments: readonly Segment[]
  readonly byCategory: readonly { category: Category; label: string; count: number }[]
  readonly total: number
}

interface Compiled {
  readonly phrase: string
  readonly re: RegExp
  readonly category: Category
  readonly substitute: string
  readonly note: string | null
}

/**
 * Compiled once. Longest phrases first so that a specific match wins over the
 * generic one it contains.
 */
const compiled: readonly Compiled[] = rules
  .flatMap((rule) =>
    rule.phrases.map((phrase) => ({
      phrase,
      // Word boundaries on both ends, with the phrase's own spacing preserved.
      re: new RegExp(`\\b${escapeForRegex(phrase)}\\b`, 'gi'),
      category: rule.category,
      substitute: rule.substitute,
      note: rule.note ?? null,
    })),
  )
  .sort((a, b) => b.phrase.length - a.phrase.length)

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const meta = new Map(categories.map((c) => [c.id, c]))

export function lint(text: string): LintResult {
  const claimed: Flag[] = []

  for (const c of compiled) {
    c.re.lastIndex = 0
    for (const m of text.matchAll(c.re)) {
      const start = m.index
      const end = start + m[0].length
      // Drop anything overlapping a phrase already claimed by a longer rule.
      const overlaps = claimed.some((f) => start < f.end && end > f.start)
      if (!overlaps) {
        const cm = meta.get(c.category)!
        claimed.push({
          start,
          end,
          text: m[0],
          category: c.category,
          categoryLabel: cm.label,
          hazard: cm.hazard,
          substitute: c.substitute,
          note: c.note,
        })
      }
    }
  }

  const flags = [...claimed].sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0
  for (const f of flags) {
    if (f.start > cursor)
      segments.push({ start: cursor, text: text.slice(cursor, f.start), flag: null })
    segments.push({ start: f.start, text: text.slice(f.start, f.end), flag: f })
    cursor = f.end
  }
  if (cursor < text.length) segments.push({ start: cursor, text: text.slice(cursor), flag: null })

  const byCategory = categories
    .map((c) => ({
      category: c.id,
      label: c.label,
      count: flags.filter((f) => f.category === c.id).length,
    }))
    .filter((c) => c.count > 0)

  return { flags, segments, byCategory, total: flags.length }
}
