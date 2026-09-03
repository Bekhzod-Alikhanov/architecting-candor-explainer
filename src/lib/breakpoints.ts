/**
 * The breakpoint scale, for JS media-query callers.
 *
 * CSS can't read custom properties inside @media conditions, so the scale is
 * documented as a comment block in src/styles/tokens.css and mirrored here as
 * the one place JS constructs a `useMediaQuery` string — callers use `bp.*`
 * rather than hand-writing `'(min-width: 64rem)'`, so the two can't drift.
 * scripts/check-breakpoints.ts asserts every value below is on the scale.
 */
export const bp = {
  phoneLandscape: '(min-width: 40rem)',
  tablet: '(min-width: 48rem)',
  wide: '(min-width: 56rem)',
  twoTrack: '(min-width: 64rem)',
  rail: '(min-width: 82rem)',
} as const
