/**
 * check-fonts.ts — asserts src/styles/font-fallbacks.css is exactly what
 * scripts/font-fallbacks.mjs generates, and that every --font-* stack in
 * tokens.css lists its metric-matched "… Fallback" family right after the
 * webfont it stands in for.
 *
 *   pnpm check:fonts
 *
 * The generated file is committed (so a reviewer can read the actual
 * @font-face rules in a diff), which means nothing stops it drifting from
 * its generator by hand-edit or a stale regenerate. This is the check that
 * would catch that — and a --font-* entry missing its fallback is exactly
 * the reflow-on-swap bug the fallback file exists to prevent.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync as read } from 'node:fs'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

const generated = execFileSync(process.execPath, ['scripts/font-fallbacks.mjs', '--stdout'], {
  encoding: 'utf8',
})
const committed = read('src/styles/font-fallbacks.css', 'utf8')

check(
  generated === committed,
  'src/styles/font-fallbacks.css does not match `node scripts/font-fallbacks.mjs --stdout`. ' +
    'Regenerate with `pnpm fonts:fallbacks` and commit the result.',
)

// Each --font-* stack must read '<webfont>', '<webfont> Fallback', … — the
// fallback has to sit immediately after the webfont, or the browser tries
// every other family in the stack (system-ui, Georgia, …) before it ever
// reaches the metric-matched one, and the reflow-on-swap guard does nothing.
const tokens = read('src/styles/tokens.css', 'utf8')
const stacks: [string, string][] = [
  ['--font-mono', 'IBM Plex Mono'],
  ['--font-sans', 'IBM Plex Sans'],
  ['--font-doc', 'Spectral'],
]
for (const [token, family] of stacks) {
  const line = tokens.match(new RegExp(`${token}:\\s*([^;]+);`))
  check(line !== null, `${token} not found in tokens.css.`)
  const value = line?.[1] ?? ''
  const expected = `'${family}', '${family} Fallback'`
  check(
    value.includes(expected),
    `${token} must list '${family}', '${family} Fallback' back-to-back, got: ${value.trim()}`,
  )
}

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('font-fallbacks.css matches its generator, and every stack keeps its fallback.\n')
