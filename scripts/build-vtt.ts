/**
 * build-vtt.ts — renders public/video/architecting-candor-explainer.en.vtt
 * from src/content/transcript.ts's cues.
 *
 *   pnpm vtt
 *
 * transcript.ts is the one source of truth for both the caption track this
 * writes and the on-page transcript Hero.tsx renders. When `cues` is empty,
 * this removes the .vtt file rather than writing an empty one — see
 * transcript.ts for why. scripts/check-vtt.ts re-runs the same render and
 * fails `pnpm check` if the committed file (or its absence) disagrees.
 */

import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cues } from '../src/content/transcript'
import { renderVtt } from './lib/vtt'

const OUTPUT_PATH = join(__dirname, '..', 'public', 'video', 'architecting-candor-explainer.en.vtt')

const vtt = renderVtt(cues)

if (vtt === null) {
  if (existsSync(OUTPUT_PATH)) {
    rmSync(OUTPUT_PATH)
    console.log(
      'transcript.ts has no cues — removed the stale .vtt file; no caption track is emitted.',
    )
  } else {
    console.log('transcript.ts has no cues — no caption track emitted.')
  }
} else {
  writeFileSync(OUTPUT_PATH, vtt)
  console.log(`Wrote public/video/architecting-candor-explainer.en.vtt (${cues.length} cues).`)
}
