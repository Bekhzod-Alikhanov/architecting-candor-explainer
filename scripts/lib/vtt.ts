/**
 * vtt.ts — WebVTT rendering shared by build-vtt.ts (which writes the file)
 * and check-vtt.ts (which regenerates it to a string and compares).
 *
 * Kept separate from both callers for the same reason scripts/lib/prose.ts
 * is: one copy of "what a caption cue becomes on disk" that can't drift
 * between the script that writes it and the script that checks it.
 */

import type { Cue } from '../../src/content/transcript'

/** `HH:MM:SS.mmm`, as the WebVTT cue-timing spec requires. */
export function formatTimestamp(totalSeconds: number): string {
  const ms = Math.round(totalSeconds * 1000)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  const millis = ms % 1_000
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(millis, 3)}`
}

/**
 * The rendered VTT file body for a set of cues, or `null` for an empty list.
 *
 * `null` rather than a `WEBVTT` header with no cues under it: an absent
 * caption track is more honest than an empty one, so build-vtt.ts removes
 * the file for this case instead of writing it — see transcript.ts.
 */
export function renderVtt(list: readonly Cue[]): string | null {
  if (list.length === 0) return null
  const body = list
    .map((c) => `${formatTimestamp(c.start)} --> ${formatTimestamp(c.end)}\n${c.text}`)
    .join('\n\n')
  return `WEBVTT\n\n${body}\n`
}
