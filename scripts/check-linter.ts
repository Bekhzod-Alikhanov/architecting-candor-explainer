/**
 * check-linter.ts — asserts the linter catches what §2.2.3 describes and does
 * not mangle the text it was given.
 *
 *   pnpm check:linter
 */

import { lint } from '../src/lib/lint'
import { sample, categories, rules } from '../src/content/linter-rules'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

const r = lint(sample)

console.log(`\nThe example ticket: ${r.total} flags`)
console.log('─'.repeat(88))
for (const c of r.byCategory) {
  const hits = r.flags.filter((f) => f.category === c.category).map((f) => `“${f.text}”`)
  console.log(`  ${c.label.padEnd(26)} ${String(c.count).padStart(2)}  ${hits.join(', ')}`)
}

// Every category the paper names must be reachable, and the example should
// exercise all five so a first-time reader sees the full range.
for (const c of categories) {
  check(
    rules.some((rule) => rule.category === c.id),
    `Category "${c.id}" has no rules.`,
  )
  check(
    r.byCategory.some((b) => b.category === c.id),
    `The example ticket does not exercise "${c.label}". A reader loading it would not see that category.`,
  )
}

// Segments must reconstruct the input exactly, or the annotated view lies.
check(
  r.segments.map((s) => s.text).join('') === sample,
  'Segments do not reconstruct the original text. The annotated view would be wrong.',
)

// No overlaps, so a phrase is never double-counted.
for (let i = 1; i < r.flags.length; i++) {
  const prev = r.flags[i - 1]!
  const cur = r.flags[i]!
  check(
    cur.start >= prev.end,
    `Overlapping flags: “${prev.text}” and “${cur.text}” both claim the same span.`,
  )
}

// Longest match wins: "harmful advice" must not also report a bare "harmful".
const specific = lint('The model gave harmful advice to a user.')
check(specific.total === 1, `"harmful advice" should produce one flag, produced ${specific.total}.`)
check(
  specific.flags[0]?.text.toLowerCase() === 'harmful advice',
  `Expected the longer phrase to win, got “${specific.flags[0]?.text}”.`,
)

// Word boundaries: a phrase inside a longer word must not match.
const boundary = lint('The harmfulness metric and the classifier are unrelated.')
check(
  boundary.total === 0,
  `"harmfulness" should not match the phrase "harmful", got ${boundary.total} flags.`,
)

// Measurement language must come back clean, or the tool cries wolf.
const clean = lint(
  'clf_confidence 0.31 against deploy_threshold 0.60 on slice health_advice_longform. ' +
    'Guardrail rule SR-114 activated at +1842ms relative to output_served. ' +
    'Lower deploy_threshold on this slice to 0.75. Owner platform-safety. Blocks release 2026.08.0.',
)
check(
  clean.total === 0,
  `A measurement-language ticket should produce no flags, got ${clean.total}: ${clean.flags.map((f) => f.text).join(', ')}.`,
)

check(lint('').total === 0, 'Empty input should produce no flags.')

// Every flag must carry a hazard and a substitute, or the tool is just underlining.
for (const f of r.flags) {
  check(f.hazard.length > 40, `Flag “${f.text}” has no substantive hazard text.`)
  check(f.substitute.length > 30, `Flag “${f.text}” offers no substitute.`)
}

console.log(
  `\n${rules.reduce((n, x) => n + x.phrases.length, 0)} phrases across ${categories.length} categories`,
)

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('The linter reads tickets the way §2.2.3 describes.\n')
