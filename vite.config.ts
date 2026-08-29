import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/**
 * The explainer video is deliberately not in git — 87MB that never changes, and
 * committing it would sit in every clone's history permanently. It ships with
 * the deployment upload instead; see .gitignore and .vercelignore.
 *
 * So the build asks whether the file is actually there. A fresh clone builds
 * without the player rather than with one pointing at a 404.
 */
const EXPLAINER = 'video/architecting-candor-explainer.mp4'

/*
 * Resolve against BOTH the config's directory and the build's working
 * directory. Checking only import.meta.dirname worked locally and silently
 * returned false on Vercel — the video uploaded and was served, but the player
 * was dead-code-eliminated out of the bundle, so the site shipped a video
 * nobody could reach. Vite may evaluate this config from a bundled temp file,
 * in which case import.meta.dirname is not the project root.
 */
const hasExplainer = [
  resolve(process.cwd(), 'public', EXPLAINER),
  resolve(import.meta.dirname, 'public', EXPLAINER),
].some(existsSync)

// Say so in the build log. A silent false is what made this hard to see.
console.log(
  hasExplainer
    ? `[explainer] found ${EXPLAINER} — the player will be built in`
    : `[explainer] ${EXPLAINER} NOT found — building without the player`,
)
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __HAS_EXPLAINER__: JSON.stringify(hasExplainer),
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      // Two HTML entries. 404.html is built rather than dropped in public/ so
      // that the error page is styled from the token layer instead of from hex
      // values inlined into a standalone file.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion') || id.includes('motion-')) return 'motion'
            if (id.includes('d3-')) return 'd3'
            return 'react'
          }
        },
      },
    },
  },
})
