/**
 * font-fallbacks.mjs — generates src/styles/font-fallbacks.css.
 *
 *   pnpm fonts:fallbacks
 *   node scripts/font-fallbacks.mjs --stdout   (print instead of writing)
 *
 * A system font substituted for a webfont that hasn't loaded yet must draw
 * at the same advance width and vertical metrics as that webfont, or the
 * swap reflows the page (a CLS hit, visible as a jump once the woff2
 * arrives). @capsizecss/core computes the ascent/descent/line-gap/
 * size-adjust overrides that make each fallback below occupy the same box
 * as its webfont, from the real local-font metrics in @capsizecss/metrics.
 * scripts/check-fonts.ts regenerates this file to a string and fails the
 * build if it drifts from what's committed here.
 */

import { createFontStack } from '@capsizecss/core'
import iBMPlexSans from '@capsizecss/metrics/iBMPlexSans'
import iBMPlexMono from '@capsizecss/metrics/iBMPlexMono'
import spectral from '@capsizecss/metrics/spectral'
import arial from '@capsizecss/metrics/arial'
import courierNew from '@capsizecss/metrics/courierNew'
import georgia from '@capsizecss/metrics/georgia'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const HEADER = `/* ============================================================================
   METRIC-MATCHED FONT FALLBACKS — generated, do not hand-edit.
   Regenerate: pnpm fonts:fallbacks

   A system font swapped in for a webfont that hasn't finished loading must
   have the same advance width and vertical metrics as that webfont, or the
   page visibly reflows the moment the swap happens. These @font-face rules
   give each "… Fallback" family the ascent/descent/line-gap/size-adjust
   overrides that make it occupy exactly the box its webfont will occupy,
   computed by @capsizecss/core from the real local-font metrics in
   @capsizecss/metrics. See scripts/font-fallbacks.mjs.
   ========================================================================= */
`

// styleObject keeps the computed overrides as data instead of a pre-rendered
// string, so the Spectral italic twin below can reuse the same numbers with
// a different src and font-style rather than re-deriving them.
const faceOf = (metrics, fallback) => {
  const { fontFaces } = createFontStack([metrics, fallback], { fontFaceFormat: 'styleObject' })
  return fontFaces[0]['@font-face']
}

const overridesOf = (face) => ({
  ascentOverride: face.ascentOverride,
  descentOverride: face.descentOverride,
  ...(face.lineGapOverride !== undefined ? { lineGapOverride: face.lineGapOverride } : {}),
  sizeAdjust: face.sizeAdjust,
})

const PROP_ORDER = [
  ['fontFamily', 'font-family'],
  ['fontStyle', 'font-style'],
  ['src', 'src'],
  ['ascentOverride', 'ascent-override'],
  ['descentOverride', 'descent-override'],
  ['lineGapOverride', 'line-gap-override'],
  ['sizeAdjust', 'size-adjust'],
]

const renderFace = (face) => {
  const lines = PROP_ORDER.filter(([key]) => face[key] !== undefined).map(
    ([key, prop]) => `  ${prop}: ${face[key]};`,
  )
  return `@font-face {\n${lines.join('\n')}\n}`
}

export function render() {
  const sans = faceOf(iBMPlexSans, arial)
  const mono = faceOf(iBMPlexMono, courierNew)
  const doc = faceOf(spectral, georgia)
  const docItalic = {
    fontFamily: doc.fontFamily,
    fontStyle: 'italic',
    src: "local('Georgia Italic'), local('Georgia-Italic')",
    ...overridesOf(doc),
  }

  const faces = [sans, mono, doc, docItalic]
  return `${HEADER}\n${faces.map(renderFace).join('\n\n')}\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = render()
  if (process.argv.includes('--stdout')) {
    process.stdout.write(css)
  } else {
    writeFileSync(new URL('../src/styles/font-fallbacks.css', import.meta.url), css)
    console.log('Wrote src/styles/font-fallbacks.css')
  }
}
