/**
 * render-og.mjs — generates public/og.png at 2400x1260.
 *
 *   pnpm og
 *
 * The card is rendered in Chrome rather than by an SVG rasteriser, because it
 * has to use the site's own self-hosted woff2 faces and no SVG library will
 * load those reliably. The palette is lifted out of src/styles/tokens.css at
 * render time, so the card cannot drift from the site's token layer and no hex
 * value is duplicated here.
 */

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = resolve(import.meta.dirname, '..')
const WIDTH = 2400
const HEIGHT = 1260
const OUT = join(ROOT, 'public', 'og.png')

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => existsSync(p))

if (!CHROME) {
  console.error('No Chrome or Edge binary found.')
  process.exit(1)
}

/** Read one source colour out of the token layer, so no hex is duplicated. */
function colour(name) {
  const css = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8')
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`))
  if (!m) throw new Error(`--color-${name} not found in tokens.css`)
  return m[1]
}

/**
 * The favicon is the site's conceit at 16 pixels: one square split by the seam,
 * console on one side and document on the other. Written from the token layer
 * for the same reason everything else is.
 */
function writeFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="${colour('ground')}"/>
  <path d="M17 3h11a1 1 0 0 1 1 1v24a1 1 0 0 1-1 1H17z" fill="${colour('doc')}"/>
  <rect x="6" y="9" width="7" height="2.5" rx="1" fill="${colour('instrument')}"/>
  <rect x="6" y="14.75" width="5" height="2.5" rx="1" fill="${colour('instrument')}"/>
  <rect x="6" y="20.5" width="7" height="2.5" rx="1" fill="${colour('instrument')}"/>
  <rect x="20" y="9" width="6" height="2.5" rx="1" fill="${colour('stamp')}"/>
  <rect x="20" y="14.75" width="6" height="2.5" rx="1" fill="${colour('stamp')}"/>
  <rect x="20" y="20.5" width="4" height="2.5" rx="1" fill="${colour('stamp')}"/>
  <rect x="15.25" y="2" width="1.5" height="28" fill="${colour('doc')}" opacity="0.62"/>
</svg>
`
  writeFileSync(join(ROOT, 'public', 'favicon.svg'), svg)
  console.log('favicon.svg  32x32')
}

/** Lift every custom property out of the token layer. */
function tokens() {
  const css = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8')
  const decls = css.match(/--[\w-]+:\s*[^;]+;/g) ?? []
  if (decls.length === 0) throw new Error('No custom properties found in tokens.css')
  return `:root {\n  ${decls.join('\n  ')}\n}`
}

const html = readFileSync(join(ROOT, 'scripts', 'og.html'), 'utf8').replace(
  '/* TOKENS_INJECTED_HERE',
  `${tokens()}\n      /*`,
)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.woff2': 'font/woff2',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
}

// Serve the OG document at / and everything else from public/, so /fonts/*
// resolves to the same faces the site ships.
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (path === '/' || path === '/og.html') {
    res.writeHead(200, { 'Content-Type': MIME['.html'] })
    res.end(html)
    return
  }
  const file = join(ROOT, 'public', path)
  if (file.startsWith(join(ROOT, 'public')) && existsSync(file)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
    return
  }
  res.writeHead(404)
  res.end()
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const port = await new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)))
const cdpPort = 9600 + Math.floor(Math.random() * 200)
const profile = mkdtempSync(join(tmpdir(), 'og-'))

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${cdpPort}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

try {
  let wsUrl = null
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()
      wsUrl = tabs.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? null
    } catch {
      /* not up yet */
    }
    if (!wsUrl) await sleep(100)
  }
  if (!wsUrl) throw new Error('Chrome DevTools endpoint did not come up')

  const ws = new WebSocket(wsUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    const p = pending.get(msg.id)
    if (p) {
      pending.delete(msg.id)
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` })
  await sleep(1500)

  // Fail loudly rather than shipping a card rendered in a fallback face.
  const { result } = await send('Runtime.evaluate', {
    expression: `(async () => {
      await document.fonts.ready
      const loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family)
      return JSON.stringify({
        families: [...new Set(loaded)],
        h1: getComputedStyle(document.querySelector('h1')).fontFamily,
        w: document.documentElement.scrollWidth,
        h: document.documentElement.scrollHeight,
      })
    })()`,
    awaitPromise: true,
    returnByValue: true,
  })
  const info = JSON.parse(result.value)
  for (const face of ['Spectral', 'IBM Plex Mono', 'IBM Plex Sans']) {
    if (!info.families.includes(face)) {
      throw new Error(`${face} did not load; the card would render in a fallback face.`)
    }
  }

  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
  })
  writeFileSync(OUT, Buffer.from(data, 'base64'))
  console.log(`og.png  ${WIDTH}x${HEIGHT}  fonts=${info.families.join(', ')}`)

  writeFavicon()
  ws.close()
} finally {
  chrome.kill()
  server.close()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* Windows sometimes holds the profile lock briefly */
  }
}
