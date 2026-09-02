import type { ComponentType } from 'react'

/** A deferred section's dynamic import. Same shape Deferred takes. */
type Load = () => Promise<{ default: ComponentType }>

/**
 * The deferred sections' modules, resolved before the build's render begins.
 *
 * The prerender cannot go through Suspense. React flushes a shell the moment
 * it has one, so a boundary that resolves even a microtask later comes back as
 * the placeholder in document order *plus* the real section appended at the end
 * of the stream, joined by an inline `<script>$RC(…)</script>`. Measured on
 * this page: six duplicate sections, six `aria-busy="true"` placeholders in the
 * static HTML, and seven inline scripts — and the site's CSP allows no inline
 * script at all, so the sections would arrive stranded in `<template>`s with
 * nothing permitted to move them.
 *
 * So src/entry-server.tsx awaits every deferred module up front, leaves it
 * here, and Deferred renders it directly on the server: one flush, complete
 * markup, no scripts. `lazy()` and Suspense are the client's business, where a
 * chunk really can arrive late or fail.
 *
 * Keyed by the import function itself, so a section can only be missing if it
 * was never handed to resolveForPrerender — which Deferred turns into a build
 * failure rather than a quietly shipped placeholder.
 */
const resolved = new Map<Load, ComponentType>()

export async function resolveForPrerender(loads: readonly Load[]): Promise<void> {
  await Promise.all(
    loads.map(async (load) => {
      resolved.set(load, (await load()).default)
    }),
  )
}

export function prerenderedComponent(load: Load): ComponentType | undefined {
  return resolved.get(load)
}
