import {
  Suspense,
  lazy,
  startTransition,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { bates } from '../content/site'
import { deferred } from '../content/ui'
import { isServer, prerendered } from '../lib/env'
import { ChunkBoundary } from './ChunkBoundary'

/**
 * Renders a below-fold section as static markup, and mounts the live
 * interactive only once the reader is approaching it.
 *
 * The build prerenders every one of these sections in full, so the text of the
 * argument is in the document from the first byte: find-in-page reaches it, a
 * reader mode sees it, a crawler that does not run JavaScript gets all ten
 * sections, and a hidden background tab is not left holding placeholders. What
 * is deferred is no longer the *content* — it is the instrument. The heavy
 * chunks stay off the critical path and arrive as the reader gets there.
 *
 * Three states, and `data-deferred` always says which:
 *
 *   static      the prerendered markup, adopted from the server HTML and not
 *               yet interactive. React never looks inside it.
 *   placeholder no prerendered markup to adopt (the dev server), so the
 *               section's number, title and stamp stand in for it.
 *   mounted     the real component, running.
 *
 * The swap out of `static` is the delicate part. The module is awaited BEFORE
 * the state changes, and the resolved component is rendered directly, so the
 * commit that removes the static markup is the same commit that installs the
 * live section: there is no frame in between showing a placeholder, and the
 * section's height does not change across it. `lazy()` and the Suspense
 * boundary stay for the retry path — a rejected import has to reach
 * ChunkBoundary as a render error, which is the only way an error boundary can
 * see it.
 */
export interface DeferredProps {
  readonly id: string
  readonly n: string
  readonly title: string
  readonly seq: number
  /**
   * The dynamic import itself, not an already-`lazy()`-wrapped component.
   * `lazy()` caches a rejected import forever, so a retry after a chunk
   * failure has to build a fresh lazy component from this — see
   * ChunkBoundary's retry note.
   */
  readonly load: () => Promise<{ default: ComponentType }>
}

type State = 'static' | 'placeholder' | 'mounted'

/** Everything a reader could Tab to. Used to put focus back after the swap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Deferred({ id, n, title, seq, load }: DeferredProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<State>(() =>
    isServer || prerendered ? 'static' : 'placeholder',
  )
  // `attempt` both keys the ChunkBoundary (forcing it to remount, which is
  // what clears its caught-error state) and forces a fresh lazy component
  // below, since the stale one's rejected promise never resolves.
  const [attempt, setAttempt] = useState(0)
  const [Lazy, setLazy] = useState<ComponentType>(() => lazy(load))
  /** The already-resolved component, on the path where nothing went wrong. */
  const [Ready, setReady] = useState<ComponentType | null>(null)
  /** Where focus was inside the static markup, if it was inside it at all. */
  const restoreTo = useRef<number | null>(null)

  useEffect(() => {
    if (state === 'mounted') return
    const el = ref.current
    if (!el) return

    let claimed = false

    const mount = () => {
      if (claimed) return
      claimed = true

      load().then(
        (mod) => {
          // Read focus now rather than when the mount was triggered: the
          // reader may have moved since, and the static markup is still the
          // thing on screen until the state below changes.
          restoreTo.current = focusedIndex(el)
          startTransition(() => {
            setReady(() => mod.default)
            setState('mounted')
          })
        },
        () => {
          // Let the lazy component re-throw the same rejection during render,
          // where ChunkBoundary can catch it and offer the retry.
          restoreTo.current = focusedIndex(el)
          startTransition(() => setState('mounted'))
        },
      )
    }

    // No IntersectionObserver means an older engine; mount rather than withhold.
    if (typeof IntersectionObserver === 'undefined') {
      mount()
      return
    }

    // Arriving at this section's anchor should not wait for a scroll event.
    if (window.location.hash === `#${id}`) mount()

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) mount()
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)

    const onHash = () => {
      if (window.location.hash === `#${id}`) mount()
    }
    window.addEventListener('hashchange', onHash)

    // A keyboard reader Tabbing through the prerendered markup reaches controls
    // that are drawn but not yet wired up, so the first focus landing anywhere
    // inside this section mounts it. The swap then puts focus back on the same
    // control — see the effect below.
    el.addEventListener('focusin', mount)

    // No print handling here. Mounting a lazy section on `beforeprint` cannot
    // work — the event is synchronous and the import is not — so the only
    // printable section, §08, is rendered eagerly in App.tsx instead. Every
    // section this component defers is removed by the print stylesheet.
    return () => {
      io.disconnect()
      window.removeEventListener('hashchange', onHash)
      el.removeEventListener('focusin', mount)
    }
  }, [state, id, load])

  useEffect(() => {
    const i = restoreTo.current
    restoreTo.current = null
    if (state !== 'mounted' || i === null || i < 0) return
    ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[i]?.focus()
  }, [state])

  if (state === 'static') {
    // The prerender itself: the whole section, rendered through the same lazy
    // boundary the client uses, because prerenderToNodeStream waits for it.
    if (isServer) {
      return (
        <div data-deferred="static">
          <ChunkBoundary
            id={id}
            n={n}
            title={title}
            seq={seq}
            attempt={attempt}
            onRetry={() => undefined}
          >
            <Suspense fallback={<Placeholder id={id} n={n} title={title} seq={seq} />}>
              <Lazy />
            </Suspense>
          </ChunkBoundary>
        </div>
      )
    }

    /*
     * The client's first render of a prerendered section, and the one React
     * hydrates. An empty `dangerouslySetInnerHTML` is how React is told that
     * this subtree is not its business: it adopts the element, never compares
     * or touches what is inside it, and leaves the server's markup exactly as
     * the browser parsed it. Nothing is being *set* — the empty string carries
     * no content — so there is no injection surface behind the lint rule
     * suppressed on it.
     *
     * The `key` is what makes the swap clean. Both states render a div in this
     * slot, so without a key React would update this one in place — and React
     * does not clear an element it was handed via dangerouslySetInnerHTML, so
     * the live section would be appended alongside the static copy of itself.
     * A changed key removes this node, and every prerendered child with it, in
     * the same commit that inserts the live one.
     */
    return (
      <div
        key="static"
        ref={ref}
        data-deferred="static"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: no content is set — see above
        dangerouslySetInnerHTML={{ __html: '' }}
      />
    )
  }

  const Section = Ready ?? Lazy

  return (
    <div key="live" ref={ref} data-deferred={state}>
      {state === 'mounted' ? (
        <ChunkBoundary
          key={attempt}
          id={id}
          n={n}
          title={title}
          seq={seq}
          attempt={attempt}
          onRetry={() => {
            setReady(null)
            setLazy(() => lazy(load))
            setAttempt((a) => a + 1)
          }}
        >
          <Suspense fallback={<Placeholder id={id} n={n} title={title} seq={seq} />}>
            <Section />
          </Suspense>
        </ChunkBoundary>
      ) : (
        <Placeholder id={id} n={n} title={title} seq={seq} />
      )}
    </div>
  )
}

/** Which focusable inside `el` currently has focus, or -1. */
function focusedIndex(el: HTMLElement): number {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || !el.contains(active)) return -1
  return [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].indexOf(active)
}

/**
 * Stands in for a section with no prerendered markup to adopt, which in
 * practice means the dev server. It is not a spinner: it carries the section's
 * own number, title and production stamp, so the page still reads as an ordered
 * sequence.
 */
function Placeholder({
  id,
  n,
  title,
  seq,
}: {
  readonly id: string
  readonly n: string
  readonly title: string
  readonly seq: number
}) {
  return (
    <section className="sect page" id={id} aria-busy="true">
      <div className="sect-head">
        <span className="sect-num" aria-hidden="true">
          {n}
        </span>
        <span className="sect-eyebrow">{title}</span>
        <span className="bates sect-bates">{bates(seq)}</span>
      </div>
      <p className="sect-standfirst deferred__note">{deferred.loading}</p>
    </section>
  )
}
