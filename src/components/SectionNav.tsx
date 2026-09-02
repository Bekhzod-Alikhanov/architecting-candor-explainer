import { useEffect, useRef, useState } from 'react'
import { sections, navCopy } from '../content/site'

/**
 * The section rail, the mobile locator bar, and the scroll progress line.
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
 *
 * The same rAF loop also drives the top progress line: scrollY and document
 * height are already being read this frame for the active-section geometry,
 * so folding progress in avoids a second scroll listener for one number.
 */

/** A section is current once its top passes this fraction of the viewport. */
const READING_LINE = 0.4

/** Static: there is exactly one of these on the page. */
const JUMP_ID = 'section-jump'

export function SectionNav() {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '')
  const [progress, setProgress] = useState(0)
  const panel = useRef<HTMLElement>(null)

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

      // Fraction of the scrollable distance travelled. Clamped: iOS rubber-
      // band overscroll can push scrollY past either end for a frame, and a
      // page shorter than the viewport has nothing to scroll at all.
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0)
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

  /** Closes the popover before scrolling, matching every other item in it —
   *  see the click handler `list()` attaches below. */
  const goToTop = () => {
    panel.current?.hidePopover()
    window.scrollTo({ top: 0 })
  }

  const list = (onNavigate?: () => void) => (
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
              {...(onNavigate ? { onClick: onNavigate } : {})}
            >
              <span className="snav__n">{s.n}</span>
              <span className="snav__label">{s.title}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )

  const currentSection = sections.find((s) => s.id === active) ?? sections[0]

  return (
    <>
      {/* The scroll progress line. Every viewport, unlike the rail and the
          locator bar below: it costs no space to keep it around at 1440px,
          and a reader who has scrolled past the argument once already knows
          roughly where they are without it, but there is no reason to take
          the indicator away from them. aria-hidden because it changes on
          every scroll frame — anything a screen reader announced from it
          would be noise, not signal. */}
      <div className="progress" aria-hidden="true">
        <div className="progress__bar" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* The rail. Wide viewports only — it lives in a track that does not
          exist below 82rem. */}
      <nav className="snav" aria-label={navCopy.label}>
        <div className="snav__inner">
          <p className="snav__title">{navCopy.title}</p>
          {list()}
        </div>
      </nav>

      {/*
        Narrow viewports get the same ten sections from a fixed bottom bar
        instead of the rail's track, which does not exist below 82rem.

        This used to be a floating "☰ Sections" pill anchored to the
        bottom-right corner. On a phone that corner sits directly over body
        text — the last line of a paragraph, the final item of a list — with
        no reserved space beneath it, so the pill simply covered whatever
        happened to scroll underneath. A full-width bar claims that strip of
        the viewport instead of floating over it, and .shell__flow pads its
        own bottom by the bar's height so nothing before #gc can ever land
        behind it.

        The bar also answers "where am I", which the pill never did: its left
        side names the section the reader is currently in, using the same
        register as the rail's own current-section styling. The popover
        itself is unchanged — same button, same panel, same Escape and light
        dismiss — it just anchors above the bar now instead of above a
        floating button.
      */}
      <div className="locator">
        <p className="locator__current">
          {/* Not aria-live: this text changes every scroll frame, and a live
              region would announce every intermediate section a reader
              scrolls past rather than the one they land on. */}
          <span className="sr-only">{navCopy.current}: </span>
          {currentSection ? (
            <>
              <span className="locator__n">{currentSection.n}</span>
              <span className="locator__label">{currentSection.title}</span>
            </>
          ) : null}
        </p>
        <button
          type="button"
          className="snavJump__btn"
          popoverTarget={JUMP_ID}
          aria-label={navCopy.jumpLabel}
        >
          <span aria-hidden="true">☰</span>
          {navCopy.jumpShort}
        </button>
      </div>
      <nav
        className="snavJump__panel"
        popover="auto"
        id={JUMP_ID}
        aria-label={navCopy.label}
        ref={panel}
      >
        <p className="snav__title">{navCopy.title}</p>
        {/* Back-to-top, first in the list: scrolling is the only way down
            through ten sections, so it should also be the shortest way back. */}
        <button type="button" className="snavJump__top" onClick={goToTop}>
          <span className="snav__n" aria-hidden="true">
            ↑
          </span>
          <span className="snav__label">{navCopy.top}</span>
        </button>
        {list(() => panel.current?.hidePopover())}
      </nav>
    </>
  )
}
