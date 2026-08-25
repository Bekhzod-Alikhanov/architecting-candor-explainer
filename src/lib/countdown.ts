import { useEffect, useState } from 'react'

/**
 * The countdown to 9 December 2026.
 *
 * Computed client-side against the reader's own clock, and it degrades to a
 * "now in force" state once the date passes rather than going negative or
 * disappearing. Counted in UTC so the figure is the same for every reader.
 */

export interface Remaining {
  readonly passed: boolean
  readonly days: number
  readonly hours: number
  readonly minutes: number
  readonly seconds: number
  readonly totalMs: number
}

export function remainingUntil(iso: string, now: number = Date.now()): Remaining {
  const target = Date.parse(iso)
  const totalMs = target - now
  if (totalMs <= 0) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  }
  const s = Math.floor(totalMs / 1000)
  return {
    passed: false,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  }
}

/**
 * Ticks once a second. This is information rather than decoration, so it keeps
 * running under prefers-reduced-motion; what that setting removes elsewhere is
 * movement, not facts.
 */
export function useCountdown(iso: string): Remaining {
  const [value, setValue] = useState(() => remainingUntil(iso))

  useEffect(() => {
    if (value.passed) return
    const id = window.setInterval(() => setValue(remainingUntil(iso)), 1000)
    return () => window.clearInterval(id)
  }, [iso, value.passed])

  return value
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
