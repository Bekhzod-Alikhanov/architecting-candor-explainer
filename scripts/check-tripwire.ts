/**
 * check-tripwire.ts — asserts the calibrator reproduces the paper's claims.
 *
 *   pnpm check:tripwire
 *
 * Two claims are load-bearing. Collapsing the logging tier must visibly destroy
 * near-miss capture, because that is the move a regime designed under legal
 * fear makes first. And bands set high enough to keep counsel rare must
 * visibly miss real signals, because that is normalization of deviance
 * expressed as a number.
 */

import { evaluate, generateStream, type Settings } from '../src/lib/tripwire'
import { dimensions, recommended, stream } from '../src/content/thresholds'
import { encodeSettings, decodeSettings, settingsFromLocation } from '../src/lib/calibration-url'
import type { DimensionId } from '../src/content/thresholds'

const levelsAt = (v: number) =>
  Object.fromEntries(dimensions.map((d) => [d.id, v])) as Record<DimensionId, number>

const settings = (over: Partial<Settings>): Settings => ({
  levels: recommended.levels,
  loggingTier: recommended.loggingTier,
  loggingOffset: recommended.loggingOffset,
  ...over,
})

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

const row = (name: string, s: Settings) => {
  const r = evaluate(s)
  console.log(
    name.padEnd(34),
    `escalations=${String(r.escalations).padStart(3)}`,
    'nearMiss=' +
      String(r.nearMissCaptured).padStart(3) +
      '/' +
      String(r.nearMissTotal).padStart(3),
    `missed=${String(r.signalsMissed).padStart(2)}/${String(r.signalTotal).padStart(2)}`,
    `band=${r.band}`,
  )
  return r
}

const events = generateStream()
console.log(
  `\n${events.length} simulated events · ${events.filter((e) => e.klass === 'signal').length} signals · ${events.filter((e) => e.klass === 'nearMiss').length} near misses\n`,
)
console.log('Configuration'.padEnd(34), 'readouts')
console.log('─'.repeat(96))

const rec = row('paper’s recommended shape', settings({}))
const noTier = row('same, logging tier collapsed', settings({ loggingTier: false }))
const timid = row('every band at maximum', settings({ levels: levelsAt(100), loggingTier: false }))
const loose = row('every band at minimum', settings({ levels: levelsAt(8) }))

// --- the logging tier ------------------------------------------------------
check(
  rec.nearMissCaptured > 0,
  'The recommended configuration should capture near misses. It captured none.',
)
check(
  noTier.nearMissCaptured < rec.nearMissCaptured / 2,
  `Collapsing the logging tier must visibly destroy near-miss capture. It went from ${rec.nearMissCaptured} to ${noTier.nearMissCaptured}.`,
)
check(
  noTier.escalations === rec.escalations,
  'Collapsing the logging tier must not change how often counsel is engaged. That separation is the point of tiering.',
)

// --- normalization of deviance, as a number --------------------------------
check(
  timid.signalsMissed > rec.signalsMissed,
  'Bands at maximum must miss more real signals than the recommended shape does.',
)
check(timid.escalations === 0, 'Bands at maximum should engage counsel never.')
check(
  timid.band === 'none',
  `Bands at maximum should read as nothing to defend, got "${timid.band}".`,
)

// --- a channel that opens constantly ---------------------------------------
check(
  loose.escalations > 35,
  `Bands at minimum should open the channel constantly, got ${loose.escalations}.`,
)
check(
  loose.band === 'weak',
  `Bands at minimum should read as routine business activity, got "${loose.band}".`,
)
check(
  loose.bandCopy.authority.includes('Capital One'),
  'The weak band must cite In re Capital One by name.',
)

// --- the recommended shape is the defensible one ---------------------------
check(
  rec.band === 'strong',
  `The paper's recommended shape should read as pre-committed and quantified, got "${rec.band}".`,
)
check(rec.bandCopy.authority.includes('Target'), 'The strong band must cite In re Target by name.')

// --- determinism ------------------------------------------------------------
const a = evaluate(settings({}))
const b = evaluate(settings({}))
check(
  a.escalations === b.escalations && a.signalsMissed === b.signalsMissed,
  'The stream must be deterministic: two evaluations of the same settings disagreed.',
)
check(
  events.length === stream.count,
  `Expected ${stream.count} events, generated ${events.length}.`,
)

// --- a configuration has to survive the address bar ------------------------
const shared = settings({})
const encoded = encodeSettings(shared)
const decoded = decodeSettings(encoded)
check(decoded !== null, `A configuration must survive encoding. "${encoded}" did not decode.`)
if (decoded) {
  check(
    JSON.stringify(evaluate(decoded)) === JSON.stringify(evaluate(shared)),
    'A shared link must reproduce the readouts exactly. The decoded configuration gave different numbers.',
  )
}
check(
  settingsFromLocation(`?cal=${encoded}`) !== null,
  'A configuration must be readable back out of a query string.',
)
// Malformed input must fall back rather than throw or half-apply.
for (const bad of [
  '',
  'nonsense',
  '1-2-3.1.22',
  '62-58-48-58-54-62-46',
  '62-58-48-58-54-62-999.1.22',
]) {
  check(decodeSettings(bad) === null, `Malformed configuration "${bad}" should decode to null.`)
}
console.log(`shareable configuration: ${encoded}`)

console.log('')
if (failures.length) {
  console.error('FAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('The tripwire behaves as the paper describes.\n')
