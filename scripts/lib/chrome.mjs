/**
 * chrome.mjs — one way of finding and launching a headless browser.
 *
 * The three browser-driven checks (check-keyboard, audit-a11y, lighthouse)
 * each used to carry their own copy of this, which meant a launch flag that
 * only matters on one machine had to be discovered three times. It was: CI
 * runners restrict unprivileged user namespaces, so Chrome's own sandbox
 * cannot start and the DevTools endpoint never comes up — with `stdio:
 * 'ignore'` the only symptom was a timeout eighty polls later.
 *
 * So: the flags live here, `--no-sandbox` is added when CI is set (never on a
 * developer's machine, where the sandbox works and is worth having), and
 * Chrome's stderr is kept so a failure to launch says why.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

/** The browser to drive, or null. BROWSER_PATH overrides the search. */
export function findBrowser() {
  if (process.env.BROWSER_PATH) {
    return existsSync(process.env.BROWSER_PATH) ? process.env.BROWSER_PATH : null
  }
  return CANDIDATES.find((p) => existsSync(p)) ?? null
}

/**
 * Launch headless Chrome with a debugging port. Returns the child process,
 * with `.stderrText()` for whatever it said on the way down.
 */
export function launchChrome(browser, { port, profile, extra = [] } = {}) {
  const proc = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      // CI runners block the user-namespace sandbox Chrome needs, and their
      // /dev/shm is too small for its default shared memory.
      ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
      ...extra,
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  proc.stderr?.on('data', (chunk) => {
    stderr += chunk
  })
  proc.on('error', (err) => {
    stderr += `${err.message}\n`
  })
  proc.stderrText = () => stderr.trim()
  return proc
}

/** The message to throw when the endpoint never answered. */
export function launchFailure(proc, browser) {
  const said = proc.stderrText?.() ?? ''
  return new Error(
    `Chrome DevTools endpoint did not come up (${browser})${said ? `\n${said}` : ''}`,
  )
}
