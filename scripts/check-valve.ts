/**
 * check-valve.ts — asserts the one-way valve actually enforces what the paper
 * says it enforces.
 *
 *   pnpm check:valve
 *
 * The acceptance requirement is that the valve visibly refuses at least four
 * distinct illegal flows, each with a stated doctrinal reason, and that every
 * permitted flow the paper names actually works.
 */

import { objects, nodes } from '../src/content/channels'
import { resolveFlow, nodeName, allRefusals } from '../src/lib/valve'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

// --- named refusals: the ones a reader is meant to meet ---------------------
const named = objects.flatMap((o) => o.refuse.map((r) => ({ object: o, rule: r })))

console.log('\nNamed refusals')
console.log('─'.repeat(96))
for (const { object, rule } of named) {
  console.log(
    `  ${object.label.padEnd(36)} → ${nodeName(rule.to).padEnd(28)} ${rule.authority ?? ''}`,
  )
  check(rule.reason.length > 40, `Refusal ${object.id}→${rule.to} has no substantive reason.`)
  check(rule.title.length > 0, `Refusal ${object.id}→${rule.to} has no title.`)
}
check(
  named.length >= 4,
  `The valve must refuse at least four distinct flows. It names ${named.length}.`,
)

// The four the specification calls out by name must all be present and refused.
const required: [string, string][] = [
  ['causal', 'three'],
  ['fault', 'dashboard'],
  ['exposure', 'public'],
  ['verification', 'one-overwrite'],
]
for (const [objectId, to] of required) {
  const r = resolveFlow(objectId, to as never)
  check(!r.allowed, `${objectId} → ${to} must be refused, but the valve allowed it.`)
  check(r.reason.length > 40, `${objectId} → ${to} refused without a stated reason.`)
}

// --- permitted flows the paper names ---------------------------------------
const permitted: [string, string, string][] = [
  ['fact', 'two', 'Channel One facts into Channel Two for analysis'],
  ['instruction', 'three', 'Channel Two returning a bounded operational instruction'],
  ['preserve', 'three', 'preserve evidence and suspend a deployment'],
  ['preserve', 'regulator', 'prepare a regulator-facing factual report'],
  ['verification', 'one', 'Channel Three enriching Channel One with a completed change'],
  ['regression', 'one', 'the incident-to-regression-test loop closing'],
]
console.log('\nPermitted flows')
console.log('─'.repeat(96))
for (const [objectId, to, label] of permitted) {
  const r = resolveFlow(objectId, to as never)
  console.log(
    `  ${(`${objectId} → ${to}`).padEnd(36)} ${r.allowed ? 'permitted' : 'REFUSED'}   ${label}`,
  )
  check(r.allowed, `"${label}" must be permitted, but the valve refused it (${objectId} → ${to}).`)
}

// The loop must be detectable, so the interface can say the loop closed.
check(resolveFlow('regression', 'one').closesLoop, 'The regression test flow must close the loop.')

// --- nothing overwrites the pre-remediation state --------------------------
for (const o of objects) {
  const r = resolveFlow(o.id, 'one-overwrite')
  check(!r.allowed, `"${o.label}" was allowed to overwrite the pre-remediation state.`)
}

// --- no conclusion escapes the privileged channel, by any route ------------
for (const o of objects.filter((x) => x.kind === 'conclusion')) {
  for (const n of nodes) {
    if (n.id === o.home) continue
    const r = resolveFlow(o.id, n.id)
    check(
      !r.allowed,
      `"${o.label}" escaped to ${n.name}. Causal and fault work must not cross outward.`,
    )
  }
}

const refusals = allRefusals()
console.log(
  `\n${objects.length} objects · ${nodes.length} destinations · ${refusals.length} refusing combinations · ${named.length} named`,
)

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('The valve holds.\n')
