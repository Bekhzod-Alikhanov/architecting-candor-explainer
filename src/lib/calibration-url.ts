import { dimensions, type DimensionId } from '../content/thresholds'
import type { Settings } from './tripwire'

/**
 * Serialising a calibration into the address bar.
 *
 * The event stream is generated from a fixed seed, so a configuration plus that
 * seed fully determines all four readouts. Putting the configuration in the URL
 * is therefore enough to make a result shareable: whoever opens the link sees
 * the same quarter of events judged against the same bands.
 *
 * Format is deliberately terse and positional — seven levels, the tier flag,
 * then the offset — so the link stays short enough to paste into a message.
 *
 *   ?cal=62-58-48-58-54-62-46.1.22
 */

const KEY = 'cal'

export function encodeSettings(s: Settings): string {
  const levels = dimensions.map((d) => clamp(s.levels[d.id], 0, 100)).join('-')
  return `${levels}.${s.loggingTier ? 1 : 0}.${clamp(s.loggingOffset, 0, 99)}`
}

export function decodeSettings(raw: string | null): Settings | null {
  if (!raw) return null
  const [levelPart, tierPart, offsetPart] = raw.split('.')
  if (!levelPart || tierPart === undefined || offsetPart === undefined) return null

  const parts = levelPart.split('-')
  if (parts.length !== dimensions.length) return null

  const levels = {} as Record<DimensionId, number>
  for (const [i, d] of dimensions.entries()) {
    const n = Number(parts[i])
    if (!Number.isFinite(n) || n < 0 || n > 100) return null
    levels[d.id] = Math.round(n)
  }

  const offset = Number(offsetPart)
  if (!Number.isFinite(offset) || offset < 0 || offset > 99) return null

  return { levels, loggingTier: tierPart === '1', loggingOffset: Math.round(offset) }
}

/** Read a shared configuration out of the current address, if there is one. */
export function settingsFromLocation(search: string): Settings | null {
  try {
    return decodeSettings(new URLSearchParams(search).get(KEY))
  } catch {
    return null
  }
}

/**
 * Reflect the configuration in the address bar without adding history entries,
 * so the back button still leaves the page rather than stepping through every
 * slider movement.
 */
export function writeSettingsToLocation(s: Settings): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set(KEY, encodeSettings(s))
  window.history.replaceState(null, '', url)
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}
