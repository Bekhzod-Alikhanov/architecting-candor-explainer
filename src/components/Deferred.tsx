import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { bates } from '../content/site'
import { deferred } from '../content/ui'
import { isServer, prerendered } from '../lib/env'
import { prerenderedComponent } from '../lib/prerender-cache'
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
 * section's height does not change across it.
 *
 * A failed import never takes the markup away. In `static` the section stays
 * exactly as the build wrote it and a short notice is added after it, because
 * what the reader has lost is the instrument, not the argument — the prose,
 * the figures and the headings are all still on screen and still findable.
 * `lazy()`, Suspense and ChunkBoundary are kept for `placeholder`, the one
 * state where there is nothing to keep: there a rejected import has to reach
 * an error boundary as a render error, which is the only way a boundary can
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

/**
 * The adoption prop, defined once and never rebuilt.
 *
 * This object's *identity* is load-bearing. React's property update skips a
 * prop only when `nextProp === lastProp`, and `dangerouslySetInnerHTML` is not
 * compared any more deeply than that, so a fresh `{ __html: '' }` on a
 * re-render is a changed prop and React answers it by setting the element's
 * innerHTML to `''` — emptying the prerendered section it was told never to
 * look inside. Inline it again and the failure notice below takes the whole
 * section down with it. (Measured: the wrapper survives, its 5 845 characters
 * do not.)
 */
const ADOPT_SERVER_MARKUP = { __html: '' }

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
  /** The import rejected while the prerendered markup is still on screen. */
  const [stalled, setStalled] = useState(false)
  /** Where focus was inside the static markup, if it was inside it at all. */
  const restoreTo = useRef<number | null>(null)

  /**
   * Resolve the module and swap the static markup for the live section. Shared
   * by the mount triggers and by the notice's "Try again", because a successful
   * retry has to be the same swap and not a second, differently-behaved one.
   *
   * What "Try again" cannot do is out-run the browser's module map, which
   * records a failed dynamic import against its URL for the life of the page
   * and rejects a second import of it without issuing a request — measured:
   * one network entry for the chunk across both attempts. So a chunk that 404d
   * or was fetched while offline needs the reload the notice offers next to
   * this; retrying is the lighter fix for the case where the import itself was
   * never reached. See the note on ChunkBoundary for the same finding.
   */
  const swapIn = useCallback(
    (el: HTMLElement, focusFirst: boolean) =>
      load().then((mod) => {
        // Read focus now rather than when the mount was triggered: the reader
        // may have moved since, and the static markup is still the thing on
        // screen until the state below changes. After a retry the button that
        // was focused is about to be removed with the notice, so focus goes to
        // the top of the section the reader just asked for instead of to body.
        restoreTo.current = focusFirst ? 0 : focusedIndex(el)
        startTransition(() => {
          setReady(() => mod.default)
          setState('mounted')
        })
      }),
    [load],
  )

  useEffect(() => {
    if (state === 'mounted') return
    const el = ref.current
    if (!el) return

    let claimed = false

    const mount = () => {
      if (claimed) return
      claimed = true

      swapIn(el, false).catch(() => {
        if (state === 'static') {
          // Keep the section. Every word of it is in the document already, and
          // replacing a complete, readable section with an error box is a
          // strictly worse page than the one the reader is looking at. The
          // notice rendered after it says what is missing and offers the retry.
          setStalled(true)
          return
        }
        // No markup to keep — the dev server's placeholder. Let the lazy
        // component re-throw the same rejection during render, where
        // ChunkBoundary can catch it and offer the retry.
        restoreTo.current = focusedIndex(el)
        startTransition(() => setState('mounted'))
      })
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
  }, [state, id, swapIn])

  useEffect(() => {
    const i = restoreTo.current
    restoreTo.current = null
    if (state !== 'mounted' || i === null || i < 0) return
    ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[i]?.focus()
  }, [state])

  if (state === 'static') {
    // The prerender itself: the whole section, straight out of the module the
    // build already resolved. No Suspense boundary — see prerender-cache.ts for
    // what React does with one that resolves late.
    if (isServer) {
      const Resolved = prerenderedComponent(load)
      if (!Resolved) {
        throw new Error(`Deferred section "${id}" was not resolved before the prerender`)
      }
      return (
        <div data-deferred="static">
          <Resolved />
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
     *
     * A fragment even when there is no notice to render. Changing a component's
     * return between a bare element and a fragment changes what React finds in
     * this slot, and it answers that by unmounting the wrapper — taking the
     * prerendered markup with it, which is the one thing the failure path
     * exists to keep. The notice is a sibling and never a child: the wrapper's
     * contents belong to the browser, and React never looks inside it.
     */
    return (
      <>
        <div
          key="static"
          ref={ref}
          data-deferred="static"
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: no content is set — see above
          dangerouslySetInnerHTML={ADOPT_SERVER_MARKUP}
        />
        {stalled ? (
          <div key="stalled" className="page deferred__failure" role="status">
            <p className="deferred__note">{deferred.inert}</p>
            <div className="deferred__actions">
              <button
                type="button"
                className="btn"
                // The notice is left standing while this runs, and on a second
                // failure nothing changes at all. Clearing it first would drop
                // the reader's focus onto <body> the moment this button was
                // unmounted, and put it back a moment later — on the path where
                // retrying is least likely to help. A successful swap removes
                // the notice with the rest of the static branch.
                onClick={() => {
                  const el = ref.current
                  if (el) swapIn(el, true).catch(() => {})
                }}
              >
                {deferred.retry}
              </button>
              <button type="button" className="btn" onClick={() => window.location.reload()}>
                {deferred.reload}
              </button>
            </div>
          </div>
        ) : null}
      </>
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
