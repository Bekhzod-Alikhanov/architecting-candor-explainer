import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { LinterPage } from './LinterPage'
import { prerendered } from './lib/env'

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

/**
 * Routing without a router.
 *
 * There are two entry points and a strict initial-JS budget, so a pathname
 * switch does the job a routing library would. The rewrites in netlify.toml and
 * vercel.json point /linter at its own prerendered /linter/index.html.
 */
const path = window.location.pathname.replace(/\/+$/, '')
const isLinter = path === '/linter'

/**
 * A stale tab: the reader has this page open from before a deploy, so their
 * copy of index.html points at chunk hashes that no longer exist on the
 * server. Vite dispatches `vite:preloadError` on the window when a dynamic
 * import (or one of its own preloaded dependencies) 404s.
 *
 * A fresh reload picks up the new index.html and its correct hashes, so try
 * that once. `sessionStorage` — keyed to the main script this tab was built
 * from, so a genuinely new deploy gets its own attempt — stops a repeat
 * failure (a real network fault, not a stale build) from reload-looping the
 * tab; that case falls through to Deferred's own notice instead.
 */
window.addEventListener('vite:preloadError', (event) => {
  /*
   * Not while offline. The reader is holding a complete, readable document —
   * every section's prose is in it — and reloading would navigate them off it
   * onto the browser's own error page, losing the whole article to fetch one
   * chunk that cannot arrive. A stale build is the case this reload is for, and
   * a stale build is reachable. Falling through without preventDefault leaves
   * the failure to Deferred, which keeps the prerendered section and says the
   * instrument did not load.
   */
  if (navigator.onLine === false) return

  const mainSrc = document.querySelector<HTMLScriptElement>(
    'script[type="module"][src*="/assets/main-"]',
  )?.src
  const key = mainSrc ? `ac:reloaded:${mainSrc}` : null

  try {
    if (key && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      event.preventDefault()
      window.location.reload()
    }
  } catch {
    // Some private-browsing modes throw on sessionStorage access. Falling
    // through lets the error propagate to ChunkBoundary rather than reloading
    // blind on every failure.
  }
})

const tree = <StrictMode>{isLinter ? <LinterPage /> : <App />}</StrictMode>

if (prerendered) {
  /**
   * Adopt the build's markup rather than replacing it.
   *
   * onRecoverableError is not decoration. A hydration mismatch is repaired
   * silently — React throws the server's markup away for that subtree and
   * re-renders it on the client, which looks like nothing happened and costs
   * exactly what the prerender was meant to save. Logging it under a fixed
   * prefix is what lets scripts/check-keyboard.mjs and scripts/audit-a11y.mjs
   * fail the build on one instead of leaving it to be noticed by eye.
   */
  hydrateRoot(root, tree, {
    onRecoverableError(error, errorInfo) {
      console.error('[hydration]', error, errorInfo.componentStack ?? '')
    },
  })
} else {
  createRoot(root).render(tree)
}
