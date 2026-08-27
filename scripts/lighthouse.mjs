/**
 * lighthouse.mjs — the performance and accessibility gate.
 *
 *   pnpm preview &
 *   node scripts/lighthouse.mjs http://localhost:4173
 *
 * Runs against the PRODUCTION build, never the dev server: the dev server ships
 * unminified modules and no long-lived caching, so its numbers mean nothing.
 *
 * Both form factors are audited. Mobile is Lighthouse's default and the strict
 * one — simulated slow 4G on a throttled CPU — and it is the number that
 * matters for a page a reader is likely to open from a link on a phone.
 *
 * Chrome is launched the same way scripts/audit-a11y.mjs launches it, rather
 * than through chrome-launcher, so this project keeps one way of finding a
 * browser and one dependency fewer.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const url = process.argv[2] ?? 'http://localhost:4173'

/** Both must clear this, on both form factors. Set by the build plan. */
const FLOOR = 0.95
const GATED = ['performance', 'accessibility']
/** Reported but not gated: useful signal, not acceptance criteria. */
const REPORTED = ['best-practices', 'seo']

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]
  .filter((p) => !process.env.BROWSER_PATH || p === process.env.BROWSER_PATH)
  .concat(process.env.BROWSER_PATH ? [process.env.BROWSER_PATH] : [])
  .find((p) => existsSync(p))
if (!CHROME) {
  console.error('No Chrome or Edge binary found.')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pct = (s) => (s === null ? ' n/a' : `${Math.round(s * 100)}`.padStart(4))

const port = 9600 + Math.floor(Math.random() * 150)
const profile = mkdtempSync(join(tmpdir(), 'lh-'))
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

/** Audits that failed outright, so a regression names itself. */
function failing(lhr, category) {
  const refs = lhr.categories[category]?.auditRefs ?? []
  return refs
    .map((ref) => ({ ref, audit: lhr.audits[ref.id] }))
    .filter(
      ({ ref, audit }) =>
        ref.weight > 0 &&
        audit &&
        audit.score !== null &&
        audit.score < 0.9 &&
        audit.scoreDisplayMode !== 'informative',
    )
    .sort((a, b) => b.ref.weight - a.ref.weight)
    .map(({ ref, audit }) => ({
      id: ref.id,
      weight: ref.weight,
      score: audit.score,
      title: audit.title,
      value: audit.displayValue ?? '',
    }))
}

const failures = []

try {
  // Wait for the DevTools endpoint the same way the a11y audit does.
  let up = false
  for (let i = 0; i < 80 && !up; i++) {
    try {
      await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      up = true
    } catch {
      /* not up yet */
    }
    if (!up) await sleep(100)
  }
  if (!up) throw new Error('Chrome DevTools endpoint did not come up')

  for (const [label, config] of [
    ['mobile', undefined],
    ['desktop', desktopConfig],
  ]) {
    const run = await lighthouse(
      url,
      { port, output: 'json', logLevel: 'error', onlyCategories: [...GATED, ...REPORTED] },
      config,
    )
    if (!run?.lhr) throw new Error(`Lighthouse returned no result for ${label}`)
    const { lhr } = run

    console.log(`\n${label}  ${lhr.finalDisplayedUrl}`)
    console.log('─'.repeat(78))
    for (const c of [...GATED, ...REPORTED]) {
      const cat = lhr.categories[c]
      if (!cat) continue
      const gated = GATED.includes(c)
      const ok = !gated || (cat.score ?? 0) >= FLOOR
      console.log(
        `  ${pct(cat.score)}  ${cat.title.padEnd(16)} ${gated ? (ok ? 'pass' : 'FAIL') : '(not gated)'}`,
      )
      if (gated && !ok) {
        failures.push(`${label} ${c}: ${Math.round((cat.score ?? 0) * 100)} < ${FLOOR * 100}`)
      }
    }

    // Print the metrics behind the performance number, always. A passing score
    // still tells you where the headroom went.
    const m = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
    ]
    console.log('\n  metrics')
    for (const id of m) {
      const a = lhr.audits[id]
      if (a) console.log(`    ${a.title.padEnd(30)} ${String(a.displayValue ?? '').padStart(10)}`)
    }

    for (const c of GATED) {
      const bad = failing(lhr, c)
      if (bad.length) {
        console.log(`\n  ${c}: audits scoring below 0.9`)
        for (const b of bad.slice(0, 8)) {
          console.log(`    [w${b.weight}] ${b.id}  ${b.title}${b.value ? `  — ${b.value}` : ''}`)
        }
      }
    }
  }
} finally {
  chrome.kill()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* Windows sometimes holds the profile briefly; it is a temp dir. */
  }
}

if (failures.length) {
  console.error(`\nFAILED the ${FLOOR * 100} floor:`)
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(`\nPerformance and accessibility both clear ${FLOOR * 100} on mobile and desktop.\n`)
