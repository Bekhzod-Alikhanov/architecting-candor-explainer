/**
 * culori.d.ts — culori ships no TypeScript declarations (its package.json
 * has no `types` field), so this covers the handful of exports
 * check-colors.ts and color-fallbacks.mjs actually call. Colour objects are
 * typed loosely (culori represents every colour space as a differently
 * shaped object) — that's fine here, since every caller only reads back
 * the fields it itself put in, or hands the object straight to a formatter.
 */
declare module 'culori' {
  export type Color = { mode: string; alpha?: number; [channel: string]: unknown }

  export function parse(input: string): Color | undefined
  export function formatHex(color: Color): string
  export function formatHex8(color: Color): string
  export function converter(mode: string): (color: Color) => Color
  export function interpolateWithPremultipliedAlpha(
    colors: Color[],
    mode: string,
  ): (t: number) => Color
}
