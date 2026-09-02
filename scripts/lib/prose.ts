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

/**
 * Recursively visits every string reachable from `node`, depth-first, in
 * declaration order — arrays are walked in order, objects in `Object.entries`
 * order, and exported functions (accessible-name builders, not static prose)
 * are skipped. `visit` is called with the string, the key it was found under,
 * and its nesting depth.
 *
 * This is the one traversal read-aloud.ts and check-reading-time.ts both
 * need: one prints every string it visits (after filtering with `isProse`),
 * the other counts words in the ones that pass the same filter. Two copies of
 * this recursion previously existed — one here, one inlined in
 * read-aloud.ts — so a change to what "walking a content module" means (a
 * new container shape, a new skip rule) could update one and silently leave
 * the other walking something different.
 */
export function walkStrings(
  node: unknown,
  key: string,
  depth: number,
  visit: (key: string, value: string, depth: number) => void,
): void {
  if (typeof node === 'string') {
    visit(key, node, depth)
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) walkStrings(item, key, depth, visit)
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'function') continue
      walkStrings(v, k, depth + 1, visit)
    }
  }
}

/** Recursively collects prose strings from a content value into `out`. */
export function walkProse(node: unknown, key: string, depth: number, out: string[]): void {
  walkStrings(node, key, depth, (k, v) => {
    if (isProse(k, v)) out.push(v)
  })
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
