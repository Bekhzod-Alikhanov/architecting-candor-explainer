/**
 * diff-computed.mjs — proves two builds render identically.
 *
 * Written to verify the Tailwind removal: the preflight was vendored into
 * src/styles/reset.css and the `@theme` block became plain custom properties,
 * which should change the stylesheet's text and nothing a reader can see. A
 * screenshot pair cannot prove that — a one-pixel border colour survives PNG
 * comparison at the wrong threshold, and the pages are too tall to photograph
 * honestly. So this walks both documents element by element and compares what
 * the engine actually computed.
 *
 *   node scripts/diff-computed.mjs [beforeOrigin] [afterOrigin]
 *
 * Serve the two builds first, e.g.
 *   pnpm exec vite preview --outDir /tmp/dist-before --port 4174
 *   pnpm exec vite preview --port 4173
 *
 * Every element is keyed by `tag#id.class` and its index in document order, so
 * a diff names the element rather than a number. Sections 02 to 07 mount as the
 * reader approaches, so each page is scrolled to the bottom first and the run
 * waits for every [data-deferred] to reach `mounted` before reading anything.
 *
 * Exit code 0 when both documents agree on every property of every element.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

const [, , beforeOrigin = 'http://localhost:4174', afterOrigin = 'http://localhost:4173'] =
  process.argv

const PATHS = ['/', '/linter', '/404.html']
const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844, mobile: true },
  { label: 'desktop', width: 1440, height: 900, mobile: false },
]

// Everything the vendored preflight touches, plus the box and type properties a
// lost reset would show up in first. Shorthands are avoided: `border` serialises
// as the empty string whenever the four sides disagree, which is exactly the
// case where a difference would matter.
const PROPS = [
  'display',
  'position',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'color',
  'background-color',
  'box-sizing',
  'list-style-type',
  'text-decoration-line',
  'vertical-align',
  'resize',
  'outline-style',
  'width',
  'height',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function cdp(ws) {
  let id = 0
  const pending = new Map()
  const events = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined) {
      const p = pending.get(msg.id)
      if (p) {
        pending.delete(msg.id)
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result)
      }
    } else if (events.has(msg.method)) {
      for (const fn of events.get(msg.method)) fn(msg.params)
      events.delete(msg.method)
    }
  })
  return {
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const n = ++id
        pending.set(n, { resolve, reject })
        ws.send(JSON.stringify({ id: n, method, params }))
      }),
    once: (method) =>
      new Promise((resolve) => {
        if (!events.has(method)) events.set(method, [])
        events.get(method).push(resolve)
      }),
  }
}

async function endpoint(port) {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const page = (await res.json()).find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(100)
  }
  throw new Error('Chrome DevTools endpoint did not come up')
}

/**
 * Runs in the page. Returns one entry per element, in document order.
 *
 * Custom properties are deliberately not read: they are the thing that moved,
 * and what matters is whether the values they feed came out the same.
 */
const COLLECT = (props) => `(() => {
  const props = ${JSON.stringify(props)}
  const out = []
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    const key = el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (el.getAttribute('class') ? '.' + el.getAttribute('class').trim().split(/\\s+/).join('.') : '')
    out.push([key, props.map((p) => cs.getPropertyValue(p))])
  }
  return JSON.stringify(out)
})()`

// Sections 02 to 07 arrive as the reader does. Walk the page a viewport at a
// time so every observer fires, then wait for the last chunk to commit.
const SETTLE = `(async () => {
  const step = Math.round(innerHeight * 0.8)
  for (let y = 0; y < document.documentElement.scrollHeight + step; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 90))
  }
  for (let i = 0; i < 100; i++) {
    const pending = document.querySelectorAll('[data-deferred]:not([data-deferred="mounted"])')
    if (pending.length === 0) break
    await new Promise((r) => setTimeout(r, 150))
  }
  window.scrollTo({ top: 0, behavior: 'instant' })
  await new Promise((r) => setTimeout(r, 500))
  return document.querySelectorAll('[data-deferred]:not([data-deferred="mounted"])').length
})()`

// Font stacks differ only in how the engine echoes the list back; a name that
// needs quoting is quoted either way, so this only guards against the two
// builds disagreeing about spacing.
const normalise = (prop, value) =>
  prop === 'font-family' ? value.replace(/\s*,\s*/g, ', ') : value

async function capture(c, origin, path, view) {
  await c.send('Emulation.setDeviceMetricsOverride', {
    width: view.width,
    height: view.height,
    deviceScaleFactor: 1,
    mobile: view.mobile,
    screenWidth: view.width,
    screenHeight: view.height,
  })
  const loaded = c.once('Page.loadEventFired')
  await c.send('Page.navigate', { url: origin + path })
  await Promise.race([loaded, sleep(20000)])
  await sleep(1200)

  const settled = await c.send('Runtime.evaluate', {
    expression: SETTLE,
    awaitPromise: true,
    returnByValue: true,
  })
  if (settled.exceptionDetails) throw new Error(`settle threw: ${settled.exceptionDetails.text}`)
  if (settled.result.value !== 0) {
    throw new Error(`${origin}${path}: ${settled.result.value} section(s) never mounted`)
  }

  const { result, exceptionDetails } = await c.send('Runtime.evaluate', {
    expression: COLLECT(PROPS),
    returnByValue: true,
  })
  if (exceptionDetails) throw new Error(`collect threw: ${exceptionDetails.text}`)
  return JSON.parse(result.value)
}

const bin = CANDIDATES.find((p) => existsSync(p))
if (!bin) {
  console.error('No Chrome or Edge binary found. Add one to CANDIDATES in scripts/shot.mjs.')
  process.exit(1)
}

const port = 9500 + Math.floor(Math.random() * 300)
const profile = mkdtempSync(join(tmpdir(), 'diff-computed-'))
const chrome = spawn(
  bin,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let differences = 0
let compared = 0

try {
  const ws = new WebSocket(await endpoint(port))
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  const c = cdp(ws)
  await c.send('Page.enable')

  console.log(`before ${beforeOrigin}   after ${afterOrigin}`)
  console.log('─'.repeat(78))

  for (const view of VIEWPORTS) {
    for (const path of PATHS) {
      const before = await capture(c, beforeOrigin, path, view)
      const after = await capture(c, afterOrigin, path, view)
      const label = `${path.padEnd(11)} ${view.label.padEnd(8)} ${String(before.length).padStart(5)} elements`

      if (before.length !== after.length) {
        differences++
        console.log(`${label}  ELEMENT COUNT DIFFERS: after has ${after.length}`)
        continue
      }

      const found = []
      for (let i = 0; i < before.length; i++) {
        if (before[i][0] !== after[i][0]) {
          found.push(`  #${i} selector: ${before[i][0]}  →  ${after[i][0]}`)
          continue
        }
        for (let p = 0; p < PROPS.length; p++) {
          const a = normalise(PROPS[p], before[i][1][p])
          const b = normalise(PROPS[p], after[i][1][p])
          if (a !== b) found.push(`  #${i} ${before[i][0]}  ${PROPS[p]}: ${a}  →  ${b}`)
        }
      }
      compared += before.length
      differences += found.length
      console.log(`${label}  ${found.length === 0 ? 'identical' : `${found.length} DIFFERENCES`}`)
      for (const line of found.slice(0, 40)) console.log(line)
      if (found.length > 40) console.log(`  … ${found.length - 40} more`)
    }
  }

  console.log('─'.repeat(78))
  console.log(
    `${compared} elements × ${PROPS.length} properties compared · ${differences} differences`,
  )
  ws.close()
} finally {
  chrome.kill()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* profile dir sometimes holds a lock briefly on Windows */
  }
}

process.exit(differences === 0 ? 0 : 1)
