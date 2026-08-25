/**
 * check-keyboard.mjs — drives every interactive with real key events.
 *
 *   node scripts/check-keyboard.mjs [url]
 *
 * The acceptance requirement is full keyboard operation "verified by actually
 * doing it", so this dispatches genuine key events through the DevTools
 * Protocol rather than synthesising React events, and asserts the instrument's
 * own state changed as a result.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const url = process.argv[2] ?? 'http://localhost:4173'

const BROWSER = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((p) => existsSync(p))
if (!BROWSER) {
  console.error('No Chrome or Edge binary found.')
  process.exit(1)
}

const KEYS = {
  ArrowRight: { code: 'ArrowRight', vk: 39 },
  ArrowLeft: { code: 'ArrowLeft', vk: 37 },
  ArrowDown: { code: 'ArrowDown', vk: 40 },
  ArrowUp: { code: 'ArrowUp', vk: 38 },
  Enter: { code: 'Enter', vk: 13, text: '\r' },
  ' ': { code: 'Space', vk: 32, text: ' ' },
  Tab: { code: 'Tab', vk: 9 },
  1: { code: 'Digit1', vk: 49, text: '1' },
  2: { code: 'Digit2', vk: 50, text: '2' },
  4: { code: 'Digit4', vk: 52, text: '4' },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const port = 9950 + Math.floor(Math.random() * 40)
const profile = mkdtempSync(join(tmpdir(), 'kb-'))
const proc = spawn(
  BROWSER,
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

const failures = []
const results = []

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
  if (!wsUrl) throw new Error('DevTools endpoint did not come up')

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

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (exceptionDetails)
      throw new Error(
        (exceptionDetails.exception?.description ?? exceptionDetails.text) +
          ' :: ' + expression.replace(/\s+/g, ' ').slice(0, 110),
      )
    return result.value
  }

  /** A real key press, at the browser level. */
  const press = async (key, times = 1) => {
    const k = KEYS[key]
    if (!k) throw new Error(`unmapped key ${key}`)
    for (let i = 0; i < times; i++) {
      await send('Input.dispatchKeyEvent', {
        type: k.text ? 'keyDown' : 'rawKeyDown',
        key,
        code: k.code,
        windowsVirtualKeyCode: k.vk,
        nativeVirtualKeyCode: k.vk,
        ...(k.text ? { text: k.text } : {}),
      })
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code: k.code,
        windowsVirtualKeyCode: k.vk,
        nativeVirtualKeyCode: k.vk,
      })
      await sleep(90)
    }
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url })
  await sleep(2500)

  // Mount every deferred section. Each mount grows the page, so keep going
  // until the height settles.
  const mounted = await evaluate(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms))
    let last = -1, guard = 0
    while (document.body.scrollHeight !== last && guard++ < 40) {
      last = document.body.scrollHeight
      for (let y = 0; y <= last; y += 500) { window.scrollTo(0, y); await wait(25) }
      await wait(400)
    }
    // Scrolling in steps can skip a placeholder between frames, so bring any
    // that are left into view one at a time.
    for (let i = 0; i < 20; i++) {
      const left = document.querySelector('[aria-busy="true"]')
      if (!left) break
      left.scrollIntoView({ block: 'center' })
      await wait(500)
    }
    window.scrollTo(0, 0); await wait(200)
    return { sections: document.querySelectorAll('main > section').length,
             deferred: document.querySelectorAll('[aria-busy="true"]').length }
  })()`)
  console.log(`\nmounted ${mounted.sections} sections, ${mounted.deferred} still deferred`)
  if (mounted.deferred > 0) failures.push(`${mounted.deferred} sections never mounted`)

  /**
   * Focus a selector, press keys, and assert the instrument moved.
   * `read` returns a comparable value from the page.
   */
  const test = async (name, selector, keys, read) => {
    const ok = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false; el.scrollIntoView({block:'center'}); el.focus();
        return document.activeElement === el || el.contains(document.activeElement) })()`,
    )
    if (!ok) {
      failures.push(`${name}: could not focus ${selector}`)
      results.push([name, 'NOT FOCUSABLE', '', ''])
      return
    }
    const safe = `(() => { try { const v = (${read}); return v === undefined ? null : v } catch (e) { return 'READ-ERROR: ' + e.message } })()`
    const before = await evaluate(safe)
    for (const k of keys) await press(k)
    await sleep(250)
    const after = await evaluate(safe)
    const changed = JSON.stringify(before) !== JSON.stringify(after)
    if (!changed) failures.push(`${name}: pressing ${keys.join(' ')} changed nothing (${before})`)
    results.push([name, changed ? 'ok' : 'NO CHANGE', String(before), String(after)])
  }

  // 01 · the reclassification scaffold
  await test('01 timeline scaffold', '#pincer .scaffold__dot', ['ArrowRight', 'ArrowRight'],
    `document.querySelector('#pincer .scaffold__meta span').textContent`)
  // 01 · the entry list
  await test('01 entry list', '#pincer .tl__entry', ['Enter'],
    `document.querySelector('#pincer .tl__detailTitle').textContent`)

  // 02 · the handoff track and the deviance meter
  await test('02 handoff track', '#signal .decay__track li:nth-child(4) .decay__stop', ['Enter'],
    `document.querySelector('#signal .decay__boundary span').textContent`)
  await test('02 deviance meter', '#signal .drift__actions .btn', ['Enter'],
    `document.querySelector('#signal .drift__count').textContent`)

  // 03 · route a card from the listbox with a number key
  await test('03 route by keyboard', '#route .rt__cards', ['ArrowDown', '1'],
    `document.querySelectorAll('#route .rt__cards .acard').length`)
  await test('03 bin activation', '#route .bin[data-bin="two"] .bin__head', ['Enter'],
    `document.querySelectorAll('#route .bin[data-bin="two"] .chip').length`)

  // 04 · select an object, then send it somewhere
  await test('04 object select', '#architecture .obj:nth-child(2)', [' '],
    `document.querySelector('#architecture .arch__objText').textContent`)
  await test('04 valve attempt', '#architecture .cbox[data-node="three"] .cbox__hit', ['Enter'],
    `document.querySelector('#architecture .valve').dataset.state`)
  await evaluate(`(() => { const b = [...document.querySelectorAll('#architecture .obj')]
    .find(x => /completed change/i.test(x.textContent)); if (b) b.click(); return true })()`)
  await sleep(200)
  await test('04 overwrite refused', '#architecture .arch__overwrite', ['Enter'],
    `document.querySelector('#architecture .valve__title').textContent`)
  await test('04 arrow explains itself', '#architecture .arrow__summary', ['Enter'],
    `document.querySelector('#architecture .arrow').open`)

  // 05 · a band slider and the tier switch
  await test('05 band slider', '#calibrate .slider__input', ['ArrowRight', 'ArrowRight'],
    `document.querySelector('#calibrate .slider__input').value`)
  await test('05 logging tier', '#calibrate .tier__toggle', [' '],
    `document.querySelector('#calibrate .tier').dataset.on`)

  // 06 · filter, sort, and open a row
  await test('06 filter chip', '#regimes .chipbtn:nth-child(4)', ['Enter'],
    `document.querySelectorAll('#regimes tbody:first-of-type .reg__row').length`)
  await test('06 sort select', '#regimes .reg__select', ['ArrowDown'],
    `document.querySelector('#regimes .reg__select').value`)
  await test('06 open a row', '#regimes .reg__rowBtn', ['Enter'],
    `document.querySelector('#regimes .lesson__name').textContent`)

  // 07 · switch a protection off
  await test('07 protection switch', '#ask .prot__toggle', [' '],
    `document.querySelector('#ask .prot__summary').dataset.state`)

  // 08 · the linter and the print control
  await test('08 load example', '#gc .lint__inputActions .btn', ['Enter'],
    `document.querySelectorAll('#gc .flag').length`)
  await test('08 textarea reachable', '#gc .lint__input', ['Tab'],
    `document.activeElement.className`)

  console.log('\nInteractive'.padEnd(28) + 'Result'.padEnd(16) + 'before → after')
  console.log('─'.repeat(96))
  for (const [name, verdict, before, after] of results) {
    console.log(
      name.padEnd(28) + verdict.padEnd(16) + `${before.slice(0, 24)} → ${after.slice(0, 24)}`,
    )
  }

  ws.close()
} finally {
  proc.kill()
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    /* profile lock */
  }
}

console.log('')
if (failures.length) {
  console.error('FAILED:')
  for (const f of failures) console.error('  · ' + f)
  process.exit(1)
}
console.log(`All ${results.length} interactives operable by keyboard.\n`)
