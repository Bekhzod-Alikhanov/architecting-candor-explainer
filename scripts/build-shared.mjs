/**
 * The two build scripts' common ground.
 *
 * prerender.mjs writes the documents and check-dist.mjs asserts them, so any
 * value they disagree about is a check that passes against the wrong thing —
 * hence one definition of the HTML escaping, imported twice.
 */

export function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * The stylesheets Vite links itself, and the ones it would leave to a chunk.
 *
 * Vite writes a `<link>` into the HTML for the entry chunk's CSS and for the
 * CSS of everything the entry imports statically. A dynamically imported
 * chunk's CSS is not linked — the preload helper fetches it when the chunk is
 * imported, which is the right trade while the section is a placeholder and the
 * wrong one now that the section's markup is in the document from the first
 * byte. `cssCodeSplit: false` is what stops that from arising at all (see
 * vite.config.ts), and this walk is how check-dist.mjs proves it: it should
 * find stylesheets under `linked` and nothing under `lazy`.
 *
 * So: walk the static import graph for what Vite linked, walk it again
 * including dynamic imports for everything reachable, and the difference is
 * what would arrive too late. Derived from the manifest rather than from the
 * HTML, so a config change shows up here as a changed list rather than as a
 * silently unstyled page.
 */
export function chunkStylesheets(manifest, entry = 'index.html') {
  const collect = (followDynamic) => {
    const seen = new Set()
    const css = new Set()
    const walk = (key) => {
      if (!key || seen.has(key)) return
      seen.add(key)
      const chunk = manifest[key]
      if (!chunk) return
      for (const f of chunk.css ?? []) css.add(f)
      for (const next of chunk.imports ?? []) walk(next)
      if (followDynamic) for (const next of chunk.dynamicImports ?? []) walk(next)
    }
    walk(entry)
    return css
  }

  const linked = collect(false)
  const all = collect(true)
  // With cssCodeSplit off there is one stylesheet for the whole build and no
  // chunk claims it: Vite records it under the manifest's `style.css` key and
  // links it into every HTML entry itself. With cssCodeSplit on the key is
  // absent and the walks above are the whole answer.
  const single = manifest['style.css']?.file
  if (single) linked.add(single)
  return { linked: [...linked], lazy: [...all].filter((f) => !linked.has(f)) }
}
