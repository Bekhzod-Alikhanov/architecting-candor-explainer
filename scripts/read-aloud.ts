/**
 * read-aloud.ts — prints every user-facing string in reading order.
 *
 *   pnpm read:aloud
 *
 * The brief's last instruction is to read the whole site aloud as though
 * presenting it to the paper's corresponding author and a frontier-lab general
 * counsel sitting in the same room. All prose lives in src/content/, so this
 * assembles it into one continuous document to be read in a single pass.
 *
 * Anything that is not prose — ids, class names, hex values, selectors, dates
 * in machine format — is skipped, so what prints is what a reader actually
 * hears.
 */

import * as site from '../src/content/site'
import * as hero from '../src/content/hero'
import * as pincer from '../src/content/pincer'
import * as timeline from '../src/content/timeline'
import * as signal from '../src/content/signal'
import * as artifacts from '../src/content/artifacts'
import * as grading from '../src/content/grading'
import * as channels from '../src/content/channels'
import * as thresholds from '../src/content/thresholds'
import * as regimes from '../src/content/regimes'
import * as statute from '../src/content/statute'
import * as linter from '../src/content/linter-rules'
import * as checklist from '../src/content/checklist'
import * as orientation from '../src/content/orientation'
import * as ui from '../src/content/ui'
import { isProse } from './lib/prose'

const MODULES: readonly [string, Record<string, unknown>][] = [
  ['00 · site metadata, disclaimer, about this page', site],
  ['00 · the memo', hero],
  ['00 · the five-minute version', orientation],
  ['01 · the pincer', pincer],
  ['01 · the reclassification timeline', timeline],
  ['02 · where the signal dies', signal],
  ['03 · the artifact deck', artifacts],
  ['03 · grading and the four strategies', grading],
  ['04 · the architecture, operable', channels],
  ['05 · calibrate the tripwire', thresholds],
  ['06 · four regimes, one logic', regimes],
  ['07 · the ask', statute],
  ['08 · the linter', linter],
  ['08 · the implementation checklist', checklist],
  ['—  · shared interface copy', ui],
]

let words = 0
let strings = 0

/** Indented print of a module's prose, in declaration order. Wraps the shared
 *  walker so this script keeps its own running word/string totals for the
 *  closing tally, and its own indentation-by-depth for readability. */
function walk(node: unknown, key: string, depth: number, out: string[]): void {
  if (typeof node === 'string') {
    if (isProse(key, node)) {
      strings += 1
      words += node.split(/\s+/).length
      out.push(`${'  '.repeat(Math.max(0, depth - 1))}${node}`)
    }
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) walk(item, key, depth, out)
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'function') continue
      walk(v, k, depth + 1, out)
    }
  }
}

for (const [label, mod] of MODULES) {
  const out: string[] = []
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'function') continue
    walk(v, k, 0, out)
  }
  if (out.length === 0) continue
  console.log(`\n${'='.repeat(78)}`)
  console.log(label.toUpperCase())
  console.log(`${'='.repeat(78)}\n`)
  console.log(out.join('\n\n'))
}

/*
 * The accessible names, rendered.
 *
 * These are functions, so the walker above skips them — and for a long time
 * that meant the strings a screen-reader user actually hears were the only
 * prose on the site nobody had ever read aloud. Each is called here with
 * representative arguments. The interpolated values are examples; the sentence
 * around them is the thing to judge.
 */
const spoken: readonly [string, string][] = [
  ['scaffold · step dot', ui.a11y.stepDot(2, 'Start with what you did not choose to write')],
  ['scaffold · position', ui.a11y.stepOf(2, 3)],
  ['seam · value', ui.a11y.seamValue(62)],
  ['03 · route to a channel', ui.a11y.routeToBin('Channel Two — counsel-directed', 2)],
  [
    '03 · select a routed card',
    ui.a11y.selectCard('red-team finding', 'Channel One — discoverable'),
  ],
  ['03 · return a card', ui.a11y.returnToQueue('red-team finding')],
  ['03 · return announced', ui.a11y.returnedAnnouncement('Red-team finding')],
  [
    '01 · the boundary chart',
    ui.a11y.boundarySummary(1989, 2027, '21 May 2025: Garcia v. Character Technologies'),
  ],
  [
    '05 · a threshold slider',
    ui.a11y.bandValue(thresholds.calibrateCopy.levelLabel, 58, 'severity 3 and above'),
  ],
  [
    '05 · the stream chart',
    ui.a11y.streamSummary({
      events: new Array(thresholds.stream.count),
      escalations: 31,
      nearMissCaptured: 47,
      nearMissTotal: 55,
      signalsMissed: 0,
      signalTotal: 27,
    }),
  ],
  ['— · a section head "Copy link" button', ui.a11y.copySectionLink('The paper')],
  ['— · a section head’s reading time', ui.readingTime(7)],
]

console.log(`\n${'='.repeat(78)}`)
console.log('—  · ACCESSIBLE NAMES, AS A SCREEN READER SPEAKS THEM')
console.log(`${'='.repeat(78)}\n`)
for (const [where, text] of spoken) {
  strings += 1
  words += text.split(/\s+/).length
  console.log(`${where}\n  ${text}\n`)
}

console.log(`\n${'─'.repeat(78)}`)
console.log(
  `${strings} passages · roughly ${words} words · about ${Math.round(words / 150)} minutes aloud`,
)
