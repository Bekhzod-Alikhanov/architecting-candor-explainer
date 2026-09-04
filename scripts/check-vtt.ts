/**
 * check-vtt.ts — regenerates the caption track from src/content/transcript.ts
 * and asserts it matches (or matches the absence of) the committed file,
 * that cues are sorted, non-overlapping, each at most 84 characters and at
 * least 1 second, and inside the video's stated duration.
 *
 *   pnpm check:vtt
 *
 * Unlike the font/colour fallbacks, cues are hand-authored prose rather than
 * generated from a token source — so what this guards against is an author
 * editing transcript.ts and forgetting to run `pnpm vtt`, or a cue that
 * overlaps, overruns the line-length budget, or lands outside the video.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { explainer } from '../src/content/site'
import { cues } from '../src/content/transcript'
import { renderVtt } from './lib/vtt'

const OUTPUT_PATH = join(__dirname, '..', 'public', 'video', 'architecting-candor-explainer.en.vtt')
const MAX_CHARS = 84
const MIN_SECONDS = 1

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

/** "9 min 28 s" -> 568. Only the units the copy actually uses. */
function parseDurationSeconds(label: string): number {
  const minutes = label.match(/(\d+)\s*min/)
  const seconds = label.match(/(\d+)\s*s\b/)
  return (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0)
}

const durationSeconds = parseDurationSeconds(explainer.duration)
check(
  durationSeconds > 0,
  `Could not parse a duration in seconds out of explainer.duration: "${explainer.duration}".`,
)

const rendered = renderVtt(cues)
const fileExists = existsSync(OUTPUT_PATH)

if (cues.length === 0) {
  check(
    !fileExists,
    `transcript.ts has no cues, but ${OUTPUT_PATH} exists. Run \`pnpm vtt\` to remove it.`,
  )
} else {
  check(fileExists, `${OUTPUT_PATH} does not exist. Run \`pnpm vtt\` to generate it.`)
  if (fileExists) {
    const committed = readFileSync(OUTPUT_PATH, 'utf8')
    check(
      committed === rendered,
      `${OUTPUT_PATH} does not match the render of transcript.ts's cues. Run \`pnpm vtt\` and commit the result.`,
    )
  }

  const sorted = [...cues].sort((a, b) => a.start - b.start)
  check(
    cues.every(
      (c, i) =>
        c.start === sorted[i]?.start && c.end === sorted[i]?.end && c.text === sorted[i]?.text,
    ),
    'transcript.ts cues are not sorted by start time.',
  )

  sorted.forEach((c, i) => {
    check(c.end > c.start, `Cue ${i} ("${c.text}") has an end at or before its start.`)
    check(
      c.end - c.start >= MIN_SECONDS,
      `Cue ${i} ("${c.text}") spans less than ${MIN_SECONDS} second.`,
    )
    check(
      c.text.length <= MAX_CHARS,
      `Cue ${i} ("${c.text}") is ${c.text.length} characters, over the ${MAX_CHARS}-character limit.`,
    )
    check(
      c.end <= durationSeconds,
      `Cue ${i} ("${c.text}") ends at ${c.end}s, after the video's stated ${durationSeconds}s duration.`,
    )
    const next = sorted[i + 1]
    if (next) {
      check(c.end <= next.start, `Cue ${i} ("${c.text}") overlaps the next cue ("${next.text}").`)
    }
  })
}

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(
  cues.length === 0
    ? '\ntranscript.ts has no cues yet — correctly, no caption track is emitted.\n'
    : `\nAll ${cues.length} caption cues are sorted, non-overlapping, in budget, and match the committed .vtt.\n`,
)
