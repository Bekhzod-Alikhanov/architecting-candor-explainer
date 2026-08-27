/**
 * audit-a11y.mjs — runs axe-core against the production build.
 *
 *   pnpm preview &   # or any served URL
 *   node scripts/audit-a11y.mjs http://localhost:4173
 *
 * Every deferred section is forced to mount before the scan, so the heavy
 * interactives are actually audited rather than skipped as placeholders. Each
 * heavy interactive is also driven into a used state, because an untouched
 * instrument hides most of its own markup.
 */

import { spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = resolve(import.meta.dirname, '..')
const url = process.argv[2] ?? 'http://localhost:4173'

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

const axe = readFileSync(join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const port = 9800 + Math.floor(Math.random() * 150)
const profile = mkdtempSync(join(tmpdir(), 'axe-'))
const chrome = spawn(
  CHROME,
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

try {
  let wsUrl = null
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      wsUrl = tabs.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? null
    } catch {
      /* not up */
    }
    if (!wsUrl) await sleep(100)
  }
  if (!wsUrl) throw new Error('Chrome DevTools endpoint did not come up')

  const ws = new WebSocket(wsUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    const p = pending.get(m.id)
    if (p) {
      pending.delete(m.id)
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result)
    }
  })
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = async (expression, awaitPromise = true) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    })
    if (exceptionDetails)
      throw new Error(`${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ''}`)
    return result.value
  }

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url })
  await sleep(2000)

  // Mount every deferred section by walking the page, then exercise the
  // instruments so their real markup is present for the scan.
  const mounted = await evaluate(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms))
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y); await wait(60)
    }
    window.scrollTo(0, document.body.scrollHeight); await wait(900)
    window.scrollTo(0, 0); await wait(300)

    // Route the Record: route the deck and run the request.
    for (let i = 0; i < 30; i++) {
      const card = document.querySelector('.rt__cards .acard'); if (!card) break
      card.click(); await wait(20)
      document.querySelector('.bin[data-bin="one"] .bin__head')?.click(); await wait(25)
    }
    document.querySelector('#route .rt__actions .btn--primary')?.click(); await wait(300)
    ;[...document.querySelectorAll('#route .rt__actions .btn')]
      .find(b => /Compare four/.test(b.textContent))?.click(); await wait(300)

    // The valve: produce a refusal so its response panel exists.
    ;[...document.querySelectorAll('.obj')].find(b => /causal conclusion/i.test(b.textContent))?.click()
    await wait(60)
    document.querySelector('.cbox[data-node="three"] .cbox__hit')?.click(); await wait(200)

    // The linter: load the example so flags render.
    ;[...document.querySelectorAll('#gc .btn')].find(b => /Load an example/.test(b.textContent))?.click()
    await wait(300)

    return {
      sections: document.querySelectorAll('main > section').length,
      busy: document.querySelectorAll('[aria-busy="true"]').length,
      flags: document.querySelectorAll('.flag').length,
      verdicts: document.querySelectorAll('.ledger__item').length,
    }
  })()`)

  console.log(
    `\nmounted: ${mounted.sections} sections, ${mounted.busy} still deferred, ` +
      `${mounted.verdicts} ledger entries, ${mounted.flags} linter flags`,
  )

  await evaluate(axe, false)
  const results = await evaluate(`(async () => {
    const r = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    })
    return JSON.stringify({
      violations: r.violations.map(v => ({
        id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
        nodes: v.nodes.slice(0, 4).map(n => ({ target: n.target.join(' '), summary: (n.failureSummary || '').split('\\n').slice(0,3).join(' ') })),
      })),
      passes: r.passes?.length ?? 0,
    })
  })()`)

  const { violations } = JSON.parse(results)

  if (violations.length === 0) {
    console.log('\naxe-core: no violations.\n')
  } else {
    console.log(`\naxe-core: ${violations.length} violation type(s)\n${'─'.repeat(88)}`)
    for (const v of violations) {
      console.log(`\n[${v.impact}] ${v.id} — ${v.help} (${v.n} node${v.n === 1 ? '' : 's'})`)
      for (const n of v.nodes) {
        console.log(`   ${n.target}`)
        if (n.summary) console.log(`     ${n.summary}`)
      }
    }
    console.log('')
  }

  ws.close()
  process.exit(violations.some((v) => v.impact === 'critical' || v.impact === 'serious') ? 2 : 0)
} finally {
  chrome.kill()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* profile lock */
  }
}
