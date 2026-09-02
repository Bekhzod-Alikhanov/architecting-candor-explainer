import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { App, deferredLoads } from './App'
import { LinterPage } from './LinterPage'
import { resolveForPrerender } from './lib/prerender-cache'

/**
 * The build-time render.
 *
 * `prerenderToNodeStream` rather than `renderToString`: it does not resolve
 * until every Suspense boundary in the tree has settled, which is what makes
 * §02 to §07 come out as complete HTML instead of six placeholders. Nothing
 * here runs at request time — there is no server. scripts/prerender.mjs calls
 * this twice during `pnpm build`, injects the result into the built HTML, and
 * the site is static again by the time it is deployed.
 *
 * The content modules are re-exported because prerender.mjs and check-dist.mjs
 * need the site's own title, description and canonicals to write and then
 * assert the two documents' heads. Re-exporting them here keeps the copy in
 * src/content as the single source for that too, rather than restating any of
 * it in a build script.
 */
export { explainer, meta, paper, sections } from './content/site'
export { noscript } from './content/ui'

export async function render(route: string) {
  const errors: unknown[] = []

  // Before rendering, not during it: the render itself must not suspend.
  await resolveForPrerender(deferredLoads)

  const result = await prerenderToNodeStream(
    <StrictMode>{route === '/linter' ? <LinterPage /> : <App />}</StrictMode>,
    {
      // Collected rather than logged: a section that threw would otherwise be
      // silently replaced by its Suspense fallback and shipped that way.
      onError(error) {
        errors.push(error)
      },
    },
  )

  return { ...result, errors }
}
