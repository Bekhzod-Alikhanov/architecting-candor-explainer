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
import * as ui from '../src/content/ui'

const MODULES: readonly [string, Record<string, unknown>][] = [
  ['00 · site metadata, disclaimer, about this page', site],
  ['00 · the memo', hero],
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

/** Machine strings that are not prose and would only add noise to a read. */
function isProse(key: string, value: string): boolean {
  if (value.length < 12) return false
  if (/^(id|n|seq|category|kind|home|to|from|pattern|unit|maps|side|hex)$/i.test(key)) return false
  if (/^(#|https?:|\/|[a-z-]+\.[a-z]{2,}$)/.test(value)) return false
  // Telemetry lines, field names and code-ish fragments.
  if (/^[a-z_]+=[^ ]/.test(value)) return false
  if (/^[\d-]+T[\d:.]+Z$/.test(value)) return false
  if (!/[a-z]{3}\s+[a-z]{3}/i.test(value)) return false
  return true
}

let words = 0
let strings = 0

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
  console.log('\n' + '='.repeat(78))
  console.log(label.toUpperCase())
  console.log('='.repeat(78) + '\n')
  console.log(out.join('\n\n'))
}

console.log('\n' + '─'.repeat(78))
console.log(`${strings} passages · roughly ${words} words · about ${Math.round(words / 150)} minutes aloud`)
