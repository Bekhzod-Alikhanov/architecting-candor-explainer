/**
 * check-breakpoints.ts — asserts every @media width in the CSS, and every
 * `bp` entry JS media-query callers read, sits on the breakpoint scale
 * documented in src/styles/tokens.css (mirrored in src/lib/breakpoints.ts).
 *
 *   pnpm check:breakpoints
 *
 * CSS can't read a custom property inside an @media condition, so the scale
 * only exists as a comment and as this check — nothing stops a new @media
 * rule from picking an off-scale width by hand. This is that stop.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { bp } from '../src/lib/breakpoints'

const SCALE = [40, 48, 56, 64, 82]
/** Each max-width query pairs with the next step up's min-width. */
const MAX_TWINS = [47.99, 55.99, 63.99, 81.99]
const onScale = (n: number) => SCALE.includes(n) || MAX_TWINS.includes(n)

function cssFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...cssFiles(p))
    else if (name.endsWith('.css')) out.push(p)
  }
  return out
}

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

for (const file of cssFiles(join(__dirname, '..', 'src'))) {
  const text = readFileSync(file, 'utf8')
  const re = /@media[^{]*\((min|max)-width:\s*([0-9.]+)rem\)/g
  for (const m of text.matchAll(re)) {
    const value = Number(m[2])
    check(onScale(value), `${file}: (${m[1]}-width: ${m[2]}rem) is not on the breakpoint scale.`)
  }
}

for (const [name, query] of Object.entries(bp)) {
  const m = /\(min-width:\s*([0-9.]+)rem\)/.exec(query)
  check(!!m, `bp.${name} = '${query}' is not a min-width rem query.`)
  if (m) check(onScale(Number(m[1])), `bp.${name} = '${query}' is not on the breakpoint scale.`)
}

if (failures.length) {
  console.error('FAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(
  `Every @media width and bp.* entry is on the breakpoint scale (${SCALE.join(', ')}rem).`,
)
