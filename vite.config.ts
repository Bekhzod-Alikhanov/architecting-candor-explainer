import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
