import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { bates } from '../content/site'
import { deferred } from '../content/ui'

/**
 * Mounts a below-fold section only once the reader is approaching it.
 *
 * The heavy interactives are each their own chunk, and none of them is needed
 * to read the opening argument. The placeholder is not a spinner: it carries the
 * section's own number, title and production stamp, so the page reads as an
 * ordered sequence before anything has loaded and the scroll height does not
 * lurch when it does.
 *
 * A section is mounted immediately if the reader arrived at its anchor, so a
 * shared link to #route or #linter still lands where it should.
 */
export interface DeferredProps {
  readonly id: string
  readonly n: string
  readonly title: string
  readonly seq: number
  readonly children: ReactNode
}

export function Deferred({ id, n, title, seq, children }: DeferredProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(
    () => typeof window !== 'undefined' && window.location.hash === `#${id}`,
  )

  useEffect(() => {
    if (mounted) return
    const el = ref.current
    if (!el) return

    // No IntersectionObserver means an older engine; mount rather than withhold.
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)

    // A jump to this section's anchor should not wait for a scroll event.
    const onHash = () => {
      if (window.location.hash === `#${id}`) setMounted(true)
    }
    window.addEventListener('hashchange', onHash)

    // No print handling here. Mounting a lazy section on `beforeprint` cannot
    // work — the event is synchronous and the import is not — so the only
    // printable section, §08, is rendered eagerly in App.tsx instead. Every
    // section this component defers is removed by the print stylesheet.
    return () => {
      io.disconnect()
      window.removeEventListener('hashchange', onHash)
    }
  }, [mounted, id])

  if (mounted) {
    return (
      <Suspense fallback={<Placeholder id={id} n={n} title={title} seq={seq} />}>
        {children}
      </Suspense>
    )
  }

  return (
    <div ref={ref}>
      <Placeholder id={id} n={n} title={title} seq={seq} />
    </div>
  )
}

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
