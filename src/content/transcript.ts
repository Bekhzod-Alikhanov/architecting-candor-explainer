/**
 * The explainer video's caption/transcript source of truth.
 *
 * `cues` is the one place captions come from: scripts/build-vtt.ts renders it
 * to public/video/architecting-candor-explainer.en.vtt (`pnpm vtt`), and
 * Hero.tsx reads it directly for the on-page transcript. Nothing renders
 * from either place until this array is non-empty — no `<track>`, no
 * `<details>` transcript — because a fabricated or empty caption track would
 * claim captions exist when they don't, which is worse than the honestly
 * documented gap this site currently ships (see the biome-ignore comment on
 * the `<video>` in Hero.tsx and the video section of README.md).
 *
 * To fill this in:
 *   1. Draft cues from public/video/architecting-candor-explainer.mp4 with
 *      Whisper (or comparable ASR) run locally.
 *   2. Have an author pass over the draft: fix mis-transcriptions, convert
 *      to British English spelling (candour, penalises, characterisation —
 *      see .superpowers/sdd/briefs/constraints.md), and split or merge cues
 *      so each one is a single sentence, at most 84 characters, spanning at
 *      least 1 second.
 *   3. Keep cues sorted by `start` and non-overlapping, and inside the
 *      video's stated duration (`explainer.duration` in site.ts) —
 *      scripts/check-vtt.ts enforces all three.
 *   4. Run `pnpm vtt` to render the .vtt file, then `pnpm check` to verify.
 */

export interface Cue {
  readonly start: number
  readonly end: number
  readonly text: string
}

export const cues: readonly Cue[] = []
