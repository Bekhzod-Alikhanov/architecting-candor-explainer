import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Read the security headers straight from vercel.json rather than duplicating
// the policy, so `pnpm preview` (and check:keyboard/audit:a11y against it)
// exercises the exact CSP that ships on both hosts.
const vercelConfig = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'))
const catchAllHeaders = vercelConfig.headers.find((h: { source: string }) => h.source === '/(.*)')
  .headers as { key: string; value: string }[]
const previewHeaders = Object.fromEntries(catchAllHeaders.map((h) => [h.key, h.value]))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    headers: previewHeaders,
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rolldownOptions: {
      // Two HTML entries. 404.html is built rather than dropped in public/ so
      // that the error page is styled from the token layer instead of from hex
      // values inlined into a standalone file.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
      output: {
        // String `test` values are substring matches, so this sidesteps the
        // path-separator regex pitfall Rolldown's own docs warn about on
        // Windows. Order matters only as a priority tiebreaker: d3 comes
        // first, so d3- packages are pulled out before the react group's
        // untargeted `node_modules` test claims everything else.
        codeSplitting: {
          groups: [
            { name: 'd3', test: 'd3-' },
            { name: 'react', test: 'node_modules' },
          ],
        },
      },
    },
  },
})
