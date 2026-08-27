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
 * Mobile is SAMPLED and gated on the median. On this page LCP lands either side
 * of the 2.5s "good" boundary, an audit worth 25 points, so one run returns
 * anywhere from 93 to 99 for a page that has not changed.
 *
 * Each sample gets a FRESH browser. Sampling inside one long-lived Chrome gave
 * three identical 93s where a single run scored 96 on identical metrics —
 * sequential audits degrade each other, so that measured browser fatigue rather
 * than the page. Every sample is printed, so the spread stays visible instead
 * of hiding behind one number.
 *
 * Chrome is launched the way scripts/audit-a11y.mjs launches it, rather than
 * through chrome-launcher, so this project keeps one way of finding a browser
 * and one dependency fewer.
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
/** Mobile samples. Override with LH_RUNS for a quick single-run check. */
const MOBILE_RUNS = Number(process.env.LH_RUNS ?? 3)

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
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

/** A clean browser for one audit. */
async function withBrowser(fn) {
  const port = 9600 + Math.floor(Math.random() * 300)
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
  try {
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
    return await fn(port)
  } finally {
    chrome.kill()
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      /* Windows sometimes holds the profile briefly; it is a temp dir. */
    }
  }
}

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
      title: audit.title,
      value: audit.displayValue ?? '',
    }))
}

const failures = []

for (const [label, config, runs] of [
  ['mobile', undefined, MOBILE_RUNS],
  ['desktop', desktopConfig, 1],
]) {
  const samples = []
  for (let i = 0; i < runs; i++) {
    const lhr = await withBrowser(async (port) => {
      const run = await lighthouse(
        url,
        { port, output: 'json', logLevel: 'error', onlyCategories: [...GATED, ...REPORTED] },
        config,
      )
      if (!run?.lhr) throw new Error(`Lighthouse returned no result for ${label}`)
      return run.lhr
    })
    samples.push(lhr)
  }

  const lhr = samples[0]
  console.log(`\n${label}  ${lhr.finalDisplayedUrl}`)
  console.log('─'.repeat(78))

  for (const c of [...GATED, ...REPORTED]) {
    const cat = lhr.categories[c]
    if (!cat) continue
    const gated = GATED.includes(c)
    const score = median(samples.map((r) => r.categories[c]?.score ?? 0))
    const ok = !gated || score >= FLOOR
    const spread =
      samples.length > 1
        ? `   samples ${samples.map((r) => Math.round((r.categories[c]?.score ?? 0) * 100)).join(' ')}`
        : ''
    console.log(
      `  ${pct(score)}  ${cat.title.padEnd(16)} ${gated ? (ok ? 'pass' : 'FAIL') : '(not gated)'}${spread}`,
    )
    if (gated && !ok) {
      failures.push(`${label} ${c}: median ${Math.round(score * 100)} < ${FLOOR * 100}`)
    }
  }

  // The metrics behind the number, always. A passing score still tells you
  // where the headroom went.
  console.log('\n  metrics (first sample)')
  for (const id of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ]) {
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

if (failures.length) {
  console.error(`\nFAILED the ${FLOOR * 100} floor:`)
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(`\nPerformance and accessibility both clear ${FLOOR * 100} on mobile and desktop.\n`)
