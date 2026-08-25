import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { LinterPage } from './LinterPage'

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

/**
 * Routing without a router.
 *
 * There are two entry points and a strict initial-JS budget, so a pathname
 * switch does the job a routing library would. SPA rewrites in netlify.toml and
 * vercel.json make /linter resolve to index.html in production.
 */
const path = window.location.pathname.replace(/\/+$/, '')
const isLinter = path === '/linter'

createRoot(root).render(<StrictMode>{isLinter ? <LinterPage /> : <App />}</StrictMode>)
