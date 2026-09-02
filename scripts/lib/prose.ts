/**
 * prose.ts — the recursive string walker shared by read-aloud.ts and
 * check-reading-time.ts.
 *
 * Both scripts need the same answer to "which strings on this site does a
 * reader actually read": read-aloud.ts prints them, check-reading-time.ts
 * counts them. Keeping one walker means a change to what counts as prose
 * — a new machine-string pattern, a new exclusion — cannot update one
 * script and silently leave the other counting something different.
 */

/** Machine strings that are not prose and would only add noise to a read. */
export function isProse(key: string, value: string): boolean {
  if (value.length < 12) return false
  if (/^(id|n|seq|category|kind|home|to|from|pattern|unit|maps|side|hex)$/i.test(key)) return false
  if (/^(#|https?:|\/|[a-z-]+\.[a-z]{2,}$)/.test(value)) return false
  // Telemetry lines, field names and code-ish fragments.
  if (/^[a-z_]+=[^ ]/.test(value)) return false
  if (/^[\d-]+T[\d:.]+Z$/.test(value)) return false
  if (!/[a-z]{3}\s+[a-z]{3}/i.test(value)) return false
  return true
}

/** Recursively collects prose strings from a content value into `out`. */
export function walkProse(node: unknown, key: string, depth: number, out: string[]): void {
  if (typeof node === 'string') {
    if (isProse(key, node)) out.push(node)
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) walkProse(item, key, depth, out)
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'function') continue
      walkProse(v, k, depth + 1, out)
    }
  }
}

/** Every prose string in a content module, in declaration order — the same
 *  order read-aloud.ts prints a module in. Skips exported functions, which
 *  are accessible-name builders rather than static prose. */
export function collectProse(mod: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'function') continue
    walkProse(v, k, 0, out)
  }
  return out
}

/** Word count of a set of prose strings, at the granularity a reader hears
 *  or reads them — whitespace-separated tokens, same as read-aloud.ts's
 *  running total. */
export function wordCount(strings: readonly string[]): number {
  return strings.reduce((n, s) => n + s.split(/\s+/).filter(Boolean).length, 0)
}
