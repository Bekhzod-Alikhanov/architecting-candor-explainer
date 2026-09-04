import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

// Read the security headers straight from vercel.json rather than duplicating
// the policy, so `pnpm preview` (and check:keyboard/audit:a11y against it)
// exercises the exact CSP that ships on both hosts.
const vercelConfig = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'))
const catchAllHeaders = vercelConfig.headers.find((h: { source: string }) => h.source === '/(.*)')
  .headers as { key: string; value: string }[]
const previewHeaders = Object.fromEntries(catchAllHeaders.map((h) => [h.key, h.value]))

/**
 * The /linter rewrite, for the two servers that are not Vercel or Netlify.
 *
 * `appType: 'mpa'` switches off the SPA fallback that used to answer every path
 * with index.html. That is the point — a dead URL must 404 here the way it does
 * in production — but the fallback was also what served /linter, so the one
 * rewrite the hosts perform has to be performed here too, and nothing else.
 *
 * The targets differ because the servers do: `vite preview` serves the built
 * dist, where /linter has its own prerendered document, while the dev server
 * has no prerender step and only has index.html to give it.
 */
type Middleware = (
  req: { url?: string | undefined },
  res: unknown,
  next: (err?: unknown) => void,
) => void

type MiddlewareServer = { middlewares: { use: (fn: Middleware) => void } }

function rewriteLinter(server: MiddlewareServer, to: string) {
  server.middlewares.use((req, _res, next) => {
    const [path, query] = (req.url ?? '').split(/(?=[?#])/, 2)
    if (path === '/linter' || path === '/linter/') req.url = `${to}${query ?? ''}`
    next()
  })
}

const linterRoute = {
  name: 'linter-route',
  configureServer(server: MiddlewareServer) {
    rewriteLinter(server, '/index.html')
  },
  configurePreviewServer(server: MiddlewareServer) {
    rewriteLinter(server, '/linter/index.html')
  },
} as const

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), linterRoute],
  // Both entry points are real files in dist, so nothing needs a fallback.
  // Without this `vite preview` answers every dead URL with index.html and a
  // 200, which is neither what Vercel and Netlify do nor what /linter needs:
  // it has its own prerendered document now, not a copy of the homepage's.
  appType: 'mpa',
  preview: {
    headers: previewHeaders,
  },
  build: {
    target: 'es2022',
    /*
     * One stylesheet for the whole site, not one per lazy chunk.
     *
     * §02 to §07 are prerendered: their markup is on screen from the first
     * byte, so their CSS cannot be allowed to arrive with the chunk that mounts
     * them — a reader without JavaScript would get six sections of unstyled
     * markup, and Lighthouse's target-size audit fails on their unstyled
     * controls. Splitting it and then linking all of it in the head is the
     * worst of both: measured on the throttled mobile profile, six extra
     * render-blocking sheets cost 0.3s of first paint and three points of
     * performance (median 90 against 93 for one concatenated file). Not
     * splitting it costs one request and beats both (median 96, and the whole
     * class of "the chunk fetches its stylesheet again on mount" goes away,
     * because there is no chunk stylesheet to fetch).
     *
     * scripts/check-dist.mjs asserts that nothing has drifted back: no CSS may
     * be reachable only through a dynamic import, and everything the manifest
     * does list must be linked in the built document.
     */
    cssCodeSplit: false,
    // The client build's manifest is what check-dist.mjs walks to make that
    // assertion. prerender.mjs moves it out of dist/ once it has run.
    manifest: !isSsrBuild,
    // Nothing reads the SSR bundle but Node, and public/ holds an 87MB video.
    copyPublicDir: !isSsrBuild,
    // The SSR build has one entry — src/entry-server.tsx, passed on the
    // command line — and one consumer, a Node script. Both the HTML inputs and
    // the browser chunk groups belong to the client build only.
    rolldownOptions: isSsrBuild
      ? {}
      : {
          // Two HTML entries. 404.html is built rather than dropped in public/
          // so that the error page is styled from the token layer instead of
          // from hex values inlined into a standalone file.
          input: {
            main: resolve(import.meta.dirname, 'index.html'),
            notFound: resolve(import.meta.dirname, '404.html'),
          },
          output: {
            // String `test` values are substring matches, so this sidesteps
            // the path-separator regex pitfall Rolldown's own docs warn about
            // on Windows. Order matters only as a priority tiebreaker: d3
            // comes first, so d3- packages are pulled out before the react
            // group's untargeted `node_modules` test claims everything else.
            codeSplitting: {
              groups: [
                { name: 'd3', test: 'd3-' },
                { name: 'react', test: 'node_modules' },
              ],
            },
          },
        },
  },
}))
