/**
 * mulberry32 — a small, fast, seeded PRNG.
 *
 * The calibrator's event stream is generated deterministically so that two
 * readers with the same settings see the same numbers, and so a screenshot of a
 * configuration means something. Nothing here is random at runtime.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
