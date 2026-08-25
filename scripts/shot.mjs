/**
 * shot.mjs — exact-width screenshots for visual QA.
 *
 * Chrome's `--headless --window-size` clamps the layout viewport to a minimum
 * width (500px on Windows), which silently renders narrow breakpoints at the
 * wrong width and then crops. This drives Chrome over the DevTools Protocol
 * and uses Emulation.setDeviceMetricsOverride instead, so 360 means 360.
 *
 *   node scripts/shot.mjs <url> <out.png> [width] [height] [--mobile] [--full]
 *
 * Example:
 *   node scripts/shot.mjs http://localhost:5180 /tmp/m.png 360 900 --mobile --full
 */

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
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

const [, , url, out, w = '1440', h = '1000', ...flags] = process.argv
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [w] [h] [--mobile] [--full]')
  process.exit(1)
}
const width = Number(w)
const height = Number(h)
const mobile = flags.includes('--mobile')
const full = flags.includes('--full')

const bin = CANDIDATES.find((p) => existsSync(p))
if (!bin) {
  console.error('No Chrome or Edge binary found. Add one to CANDIDATES in scripts/shot.mjs.')
  process.exit(1)
}

const port = 9200 + Math.floor(Math.random() * 300)
const profile = mkdtempSync(join(tmpdir(), 'shot-'))
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const tabs = await res.json()
      const page = tabs.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(100)
  }
  throw new Error('Chrome DevTools endpoint did not come up')
}

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
      events.get(msg.method).forEach((fn) => fn(msg.params))
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

try {
  const wsUrl = await targetUrl()
  const ws = new WebSocket(wsUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  const c = cdp(ws)

  await c.send('Page.enable')

  // --rm emulates prefers-reduced-motion: reduce, so the setting can be
  // verified rather than assumed.
  if (flags.includes('--rm')) {
    await c.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
  }

  await c.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })

  const loaded = c.once('Page.loadEventFired')
  await c.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(15000)])
  // Let fonts settle and any layout effects run.
  await sleep(1200)

  // --eval=<js> runs arbitrary script in the page before capture, for driving
  // an interactive into a particular state.
  for (const f of flags.filter((x) => x.startsWith('--eval='))) {
    const { result, exceptionDetails } = await c.send('Runtime.evaluate', {
      expression: f.slice(7),
      returnByValue: true,
      awaitPromise: true,
    })
    if (exceptionDetails) throw new Error('--eval threw: ' + exceptionDetails.text)
    if (result?.value !== undefined) console.log('  eval →', JSON.stringify(result.value))
    await sleep(400)
  }

  // --click=<css selector> clicks an element before capturing, so interactive
  // states can be photographed. Repeatable, applied in order.
  for (const f of flags.filter((x) => x.startsWith('--click='))) {
    const sel = f.slice(8)
    await c.send('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('no match: ' + ${JSON.stringify(sel)}); el.click(); return true })()`,
      returnByValue: true,
    })
    await sleep(350)
  }

  // --at=<css selector> scrolls a section into view before capturing, so a
  // section deep in the page can be photographed at readable scale. Scrolling
  // then capturing the viewport is more reliable than clipping beyond it,
  // which returns an unpainted frame.
  const at = flags.find((f) => f.startsWith('--at='))
  if (at) {
    const sel = at.slice(5)
    await c.send('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el) window.scrollTo({top: Math.max(0, el.getBoundingClientRect().top + scrollY - 8), behavior: 'instant'}); return scrollY })()`,
      returnByValue: true,
    })
    await sleep(500)
  }

  const { data } = await c.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: full,
    ...(full || at ? {} : { clip: { x: 0, y: 0, width, height, scale: 1 } }),
  })
  writeFileSync(out, Buffer.from(data, 'base64'))

  const { result } = await c.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      vw: innerWidth,
      scrollW: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      durBase: getComputedStyle(document.documentElement).getPropertyValue('--dur-base').trim(),
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
    })`,
    returnByValue: true,
  })
  console.log(`${out}  ${width}x${height}  ${result.value}`)
  ws.close()
} finally {
  chrome.kill()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* profile dir sometimes holds a lock briefly on Windows */
  }
}
