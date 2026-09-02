/**
 * Where this module graph is running, and what it found when it got there.
 *
 * Both answers are settled before React renders anything and neither can change
 * afterwards, so both are module constants rather than hooks: the prerender runs
 * in Node with no DOM at all, and whether the document arrived carrying the
 * build's markup is decided by the HTML that was served.
 */

/** True inside the build's prerender pass (scripts/prerender.mjs). */
export const isServer = typeof document === 'undefined'

/**
 * True when this document was served with the prerendered markup already in it.
 *
 * Read from the DOM rather than from `import.meta.env.PROD`, because the
 * question is not "is this a production bundle" but "is there server markup in
 * #root to adopt". The dev server serves the same modules with an empty root,
 * and a prerender step that silently stopped emitting would otherwise have
 * every deferred section adopt nothing and show blank. src/main.tsx chooses
 * between hydrate and render from the same signal.
 */
export const prerendered = !isServer && document.getElementById('root')?.firstElementChild != null
