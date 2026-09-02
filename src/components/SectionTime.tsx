import { readingTime } from '../content/ui'

/**
 * The "N min read" label in a section's head bar. SectionHead renders it for
 * the nine guided sections; §00 builds its own head bar directly in Hero.tsx
 * (memoSection isn't looked up through SectionHead), so this is the one place
 * the markup lives — both call sites render the same `.sect-time` span
 * against the same `readingTime` copy, rather than each keeping its own copy
 * that could drift from the other.
 */
export function SectionTime({ minutes }: { readonly minutes: number }) {
  return <span className="sect-time">{readingTime(minutes)}</span>
}
