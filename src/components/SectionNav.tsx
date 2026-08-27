import { useEffect, useState } from 'react'
import { sections, navCopy } from '../content/site'

/**
 * The section rail.
 *
 * Ten numbered sections and, until now, no way to move between them except
 * scrolling — so a reader who wanted the calibrator had to travel through the
 * whole argument to find it. The rail lives in the shell's left track, which on
 * wide viewports is space that was previously empty margin.
 *
 * Navigation itself is plain anchors: `html { scroll-behavior: smooth }` handles
 * the movement and is already switched off under prefers-reduced-motion, and
 * Deferred mounts a section on hashchange, so a jump to an unmounted section
 * resolves without any work here.
 *
 * The active section is computed from live geometry on scroll rather than with
 * an IntersectionObserver. A deferred section's placeholder is REPLACED in the
 * DOM when its chunk arrives, which silently drops an observer registered
 * against the old node; re-querying each frame cannot go stale that way, and at
 * ten elements it costs nothing.
 */

/** A section is current once its top passes this fraction of the viewport. */
const READING_LINE = 0.4

export function SectionNav() {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const line = window.innerHeight * READING_LINE
      let current: string = sections[0]?.id ?? ''
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= line) current = s.id
      }
      setActive(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <nav className="snav" aria-label={navCopy.label}>
      <div className="snav__inner">
        <p className="snav__title">{navCopy.title}</p>
        <ol className="snav__list">
          {sections.map((s) => {
            const current = s.id === active
            return (
              <li key={s.id}>
                <a
                  className="snav__link"
                  href={`#${s.id}`}
                  data-current={current}
                  {...(current ? { 'aria-current': 'true' as const } : {})}
                >
                  <span className="snav__n">{s.n}</span>
                  <span className="snav__label">{s.title}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
