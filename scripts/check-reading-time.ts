/**
 * check-reading-time.ts — recomputes each section's reading time from its
 * content modules and asserts the `readingMinutes` figure in site.ts's
 * `sections` register has not drifted from it by more than a minute.
 *
 *   pnpm check:reading-time
 *
 * A copy edit that materially lengthens or shortens a section is not
 * something a lint pass, a type check or the other content-integrity checks
 * would ever catch — the label would just quietly go on claiming the section
 * takes as long as it used to. This is the check that would.
 *
 * The word count uses the same prose walker and the same exclusions as
 * scripts/read-aloud.ts (scripts/lib/prose.ts): ids, hrefs, telemetry lines
 * and other machine strings are excluded, so a section's interactive
 * instrument does not inflate its reading time just because it carries a lot
 * of generated or tabular values.
 */

import * as artifacts from '../src/content/artifacts'
import * as channels from '../src/content/channels'
import * as checklist from '../src/content/checklist'
import * as grading from '../src/content/grading'
import * as hero from '../src/content/hero'
import * as linterRules from '../src/content/linter-rules'
import * as orientation from '../src/content/orientation'
import * as pincer from '../src/content/pincer'
import * as regimes from '../src/content/regimes'
import {
  about,
  colophonCopy,
  contribution,
  disclaimer,
  explainer,
  paper,
  sections,
} from '../src/content/site'
import * as signal from '../src/content/signal'
import * as statute from '../src/content/statute'
import * as thresholds from '../src/content/thresholds'
import * as timeline from '../src/content/timeline'
import { collectProse, wordCount } from './lib/prose'

const WORDS_PER_MINUTE = 220
/** How far a stated figure may drift from the recomputation before the
 *  check fails. One minute, per the brief: small rounding differences
 *  between a wpm estimate and the stated figure are expected; a whole
 *  section's worth of added or removed copy is not. */
const TOLERANCE_MINUTES = 1

/**
 * Section id → the content modules a reader actually reads in that section.
 *
 * §00 carries the memo (hero.ts), the orientation block (orientation.ts),
 * and the explainer figure's caption/note/fallback copy — Hero.tsx renders
 * `explainer.label`, `.fallback`, `.downloadLabel` and `.note` directly, even
 * though the object itself lives in site.ts alongside chrome that isn't
 * rendered as prose anywhere (`.src`, `.type`, `.poster`, `.title`, and
 * `.duration`, which is too short to pass `isProse` regardless). §09's
 * reading is the colophon/about furniture in site.ts plus `explainer.backLabel`
 * — the one-line "Watch the explainer ↑" back-link Colophon.tsx renders —
 * not the whole of site.ts, most of which (nav labels, meta, the citation
 * machinery) is chrome rather than something a reader reads as prose in any
 * one section.
 */
const SECTION_MODULES: Readonly<Record<string, readonly Record<string, unknown>[]>> = {
  memo: [
    hero,
    orientation,
    {
      explainerLabel: explainer.label,
      explainerFallback: explainer.fallback,
      explainerDownloadLabel: explainer.downloadLabel,
      explainerNote: explainer.note,
    },
  ],
  pincer: [pincer, timeline],
  signal: [signal],
  route: [artifacts, grading],
  architecture: [channels],
  calibrate: [thresholds],
  regimes: [regimes],
  ask: [statute],
  gc: [linterRules, checklist],
  paper: [
    {
      about,
      contribution,
      colophonCopy,
      paperCitation: paper.citation,
      disclaimer,
      explainerBackLabel: explainer.backLabel,
    },
  ],
}

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

console.log(`\nRecomputed reading time (at ${WORDS_PER_MINUTE} wpm)`)
console.log('─'.repeat(78))

for (const s of sections) {
  const mods = SECTION_MODULES[s.id]
  check(mods !== undefined, `Section "${s.id}" has no entry in SECTION_MODULES.`)
  if (!mods) continue

  const words = mods.reduce((n, mod) => n + wordCount(collectProse(mod)), 0)
  const recomputed = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  const diff = Math.abs(recomputed - s.readingMinutes)

  console.log(
    `  ${s.n} ${s.title.padEnd(28)} ${String(words).padStart(5)} words → ` +
      `${recomputed} min (stated ${s.readingMinutes} min)${diff > TOLERANCE_MINUTES ? '  MISMATCH' : ''}`,
  )

  check(
    diff <= TOLERANCE_MINUTES,
    `§${s.n} "${s.title}" recomputes to ${recomputed} min from ${words} words, ` +
      `but site.ts states ${s.readingMinutes} min — a difference of ${diff} minutes, ` +
      `more than the ${TOLERANCE_MINUTES}-minute tolerance.`,
  )
}

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('\nEvery section’s stated reading time is within a minute of the recomputation.\n')
