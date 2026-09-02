import { Component, type ReactNode } from 'react'
import { bates } from '../content/site'
import { deferred } from '../content/ui'

/**
 * Catches a failed chunk — a lazy `import()` that rejected, most often because
 * a deploy has replaced the file this tab was built against. Suspense does not
 * catch errors, so this sits outside it, wrapping the Suspense boundary rather
 * than the lazy component directly.
 *
 * Error boundaries have no hook form, hence the class.
 *
 * "Try again" does not just re-render: `lazy()` caches a rejected promise
 * forever, so retrying means the caller (Deferred) has to hand this a fresh
 * `lazy(load)` and remount it with a new `key`. This component only reports
 * the failure and asks for that remount; it does not know how to produce one.
 *
 * That remount is not the whole story, though. A browser's module map also
 * caches a failed dynamic `import()` against the URL it fetched — permanently,
 * for the life of the page — so a second attempt at the same chunk URL rejects
 * without even issuing a new request, whether or not the file exists again by
 * then. (Verified against Chrome directly: a bare `import()` retried after the
 * file is restored still fails, with no second network request.) A remount
 * cannot out-run that cache; only a fresh page load gets a fresh module map.
 * So `attempt` — Deferred's retry counter, not just its remount key — tells
 * this boundary whether the failure it just caught followed an earlier retry
 * of this same section. If it did, remounting again is certain to fail the
 * same way, and componentDidCatch reloads the page instead of showing the
 * button again. A first-time failure still gets the ordinary retry UI: that
 * case can be a genuine transient render error rather than a chunk fetch, and
 * a remount is the lighter fix for it.
 */
export interface ChunkBoundaryProps {
  readonly id: string
  readonly n: string
  readonly title: string
  readonly seq: number
  readonly onRetry: () => void
  /** Deferred's retry counter — see the class comment for why this boundary
   *  needs it, not just the remount key. */
  readonly attempt: number
  readonly children: ReactNode
}

interface ChunkBoundaryState {
  readonly failed: boolean
}

export class ChunkBoundary extends Component<ChunkBoundaryProps, ChunkBoundaryState> {
  override state: ChunkBoundaryState = { failed: false }

  static getDerivedStateFromError(): ChunkBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(): void {
    if (this.props.attempt > 0) window.location.reload()
  }

  override render() {
    if (!this.state.failed) return this.props.children

    const { id, n, title, seq, onRetry } = this.props
    return (
      <section className="sect page" id={id}>
        <div className="sect-head">
          <span className="sect-num" aria-hidden="true">
            {n}
          </span>
          <span className="sect-eyebrow">{title}</span>
          <span className="bates sect-bates">{bates(seq)}</span>
        </div>
        <p className="sect-standfirst">{deferred.failed}</p>
        <div className="deferred__actions">
          <button type="button" className="btn" onClick={onRetry}>
            {deferred.retry}
          </button>
          <a className="btn" href={window.location.href}>
            {deferred.reload}
          </a>
        </div>
      </section>
    )
  }
}
