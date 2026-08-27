/**
 * check-grading.ts — runs the four strategies through the grader and asserts
 * that the section's central claim actually holds in the data.
 *
 *   pnpm check:grading
 *
 * The claim: writing nothing barely reduces discovery exposure, because the
 * telemetry is auto-captured and produced regardless, while it destroys the
 * ability to reconstruct the failure. If a content edit ever breaks that, the
 * routing game stops making its argument and this fails loudly.
 */

import { gradeStrategy, grade } from '../src/lib/grade'
import { strategies } from '../src/content/grading'
import { deck, privilegeRulings } from '../src/content/artifacts'

const pad = (s: string | number, n: number) => String(s).padStart(n)

const rows = strategies.map((s) => {
  const g = gradeStrategy(s.id)
  return { id: s.id, name: s.name, g }
})

console.log(
  '\nStrategy            prod  with pierce  407 spol  n/c | adverse | remediation | flags',
)
console.log('─'.repeat(92))
for (const r of rows) {
  const c = r.g.counts
  console.log(
    r.id.padEnd(18),
    pad(c.produced, 4),
    pad(c.withheld, 5),
    pad(c.pierced, 6),
    pad(c.excluded407, 4),
    pad(c.spoliation, 4),
    pad(c.notCreated, 4),
    '|',
    pad(r.g.adverseCount, 7),
    '|',
    pad(`${r.g.remediationScore}/${r.g.remediationTotal}`, 11),
    '|',
    pad(r.g.flagCount, 5),
  )
}

const by = (id: string) => {
  const r = rows.find((x) => x.id === id)
  if (!r) throw new Error(`missing strategy ${id}`)
  return r.g
}

const nothing = by('nothing')
const counsel = by('counsel')
const oneSystem = by('one-system')
const three = by('three-channel')

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

// Every artifact must have a privilege ruling, or the grader throws at runtime.
for (const a of deck) {
  check(
    privilegeRulings[a.id] !== undefined,
    `artifact "${a.id}" has no privilege ruling in artifacts.ts`,
  )
}

// The central claim, in two halves.
check(
  nothing.counts.produced > 0,
  'Writing nothing should still produce the auto-captured telemetry. It produced none.',
)
check(
  nothing.remediationScore < three.remediationScore,
  `Writing nothing should destroy remediation capability. Got ${nothing.remediationScore} against three-channel ${three.remediationScore}.`,
)
check(
  nothing.counts.spoliation > 0,
  'Suppressing records that already exist should raise a spoliation risk. None was raised.',
)

// Routing everything through counsel should be pierced across the board.
check(
  counsel.counts.pierced > counsel.counts.withheld,
  `Routing everything through counsel should be pierced more often than it is withheld. Got pierced=${counsel.counts.pierced}, withheld=${counsel.counts.withheld}.`,
)

// One system: maximum remediation, maximum exposure.
check(
  oneSystem.remediationScore === oneSystem.remediationTotal,
  `Writing everything into one system should reconstruct the whole record. Got ${oneSystem.remediationScore}/${oneSystem.remediationTotal}.`,
)
check(
  oneSystem.flagCount > three.flagCount,
  `One system should carry more warnings than the three-channel routing. Got ${oneSystem.flagCount} against ${three.flagCount}.`,
)

// The three-channel routing: remediation preserved, and privilege claims survive.
check(
  three.remediationScore === three.remediationTotal,
  `The three-channel routing should preserve the whole reconstructable record. Got ${three.remediationScore}/${three.remediationTotal}.`,
)
check(
  three.counts.pierced === 0,
  `The three-channel routing should assert no privilege claim that fails. ${three.counts.pierced} were pierced.`,
)
check(
  three.counts.spoliation === 0,
  `The three-channel routing should raise no spoliation risk. Got ${three.counts.spoliation}.`,
)
check(
  three.adverseCount < counsel.adverseCount,
  'The three-channel routing should carry fewer adverse outcomes than routing everything through counsel.',
)

// An unrouted deck must grade to nothing rather than crash.
const empty = grade({})
check(empty.verdicts.length === 0, 'An empty assignment should produce no verdicts.')
check(empty.remediationScore === 0, 'An empty assignment should reconstruct nothing.')

console.log('')
if (failures.length) {
  console.error('FAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(`All ${13 + deck.length} checks passed. The routing game still makes its argument.\n`)
