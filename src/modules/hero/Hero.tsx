import { useState, type CSSProperties } from 'react'
import { Seam } from '../../components/Seam'
import { Prov } from '../../components/Provenance'
import { SectionTime } from '../../components/SectionTime'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { bp } from '../../lib/breakpoints'
import { memo as content, exhibitLegend, waysIn } from '../../content/hero'
import { bates, disclaimer, explainer, isAbsoluteVideoSrc, section } from '../../content/site'
import { cues } from '../../content/transcript'
import { Orientation } from './Orientation'
import './hero.css'

/** §00's number, title and Bates sequence come from the section register. */
const memoSection = section('memo')

/** `m:ss`, for the transcript's per-line timestamp. Not exported: this is
 *  display formatting for a number, not prose, so it stays with the one
 *  component that renders a cue rather than living in src/content/. */
function formatCueTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * 00 — The memo.
 *
 * The hero is built from the collision itself: one incident record rendered
 * simultaneously as an engineering log line and as a discovery exhibit,
 * divided by the seam. On wide screens the reader can drag the seam to give
 * either document system more of the record; neither reading ever disappears.
 *
 * On narrow screens the two readings stack and both are shown in full, which
 * carries the same point without asking anyone to drag a splitter on a 360px
 * screen.
 *
 * Which of the two arrangements is drawn is decided in hero.css, at the same
 * breakpoint this component reads. That duplication is deliberate: the build
 * prerenders this section, so the CSS has to be able to lay it out correctly at
 * every width before any JavaScript has run, and `wide` then only decides
 * whether the seam becomes draggable.
 */
export function Hero() {
  const wide = useMediaQuery(bp.tablet)
  const [split, setSplit] = useState(0.46)
  const r = content.record

  return (
    <section className="hero page" id="memo" aria-labelledby="memo-title">
      {/* The masthead rubric this section used to open with now lives in
          App.tsx's <header> — see the comment there for why. */}
      <div className="hero__head">
        <span className="hero__number" aria-hidden="true">
          {memoSection.n}
        </span>
        <span className="hero__eyebrow">{memoSection.title}</span>
        {/* Grouped so the row can wrap as a unit below 48rem — see
            .hero__meta in hero.css — without disturbing reading order:
            `display: contents` at wider widths keeps these where they'd sit
            as direct children of .hero__head. */}
        <span className="hero__meta">
          <SectionTime minutes={memoSection.readingMinutes} />
          <span className="bates bates--push">{bates(memoSection.seq)}</span>
        </span>
      </div>

      <div className="hero__masthead">
        <div>
          <h1 className="hero__headline" id="memo-title">
            {content.headline}
          </h1>

          {/* The turn. */}
          <div className="hero__turn">
            <p className="hero__turnLead reg-console">{content.turn.lead}</p>
            <p className="hero__strike">{content.turn.strike}</p>
            <p className="hero__turnFollow">{content.turn.follow}</p>
          </div>

          {/* The express lane: four exits for a reader who has not yet
              committed to reading past the opening paragraph, let alone the
              other nine sections. Sits in the same text track as the turn,
              directly under it, so it is above the fold beside the Pinto
              artifact rather than buried below the seam demo. */}
          <nav className="hero__waysIn" aria-labelledby="ways-in-label">
            <span className="hero__waysInLabel" id="ways-in-label">
              {waysIn.label}
            </span>
            <ul className="hero__waysInList">
              {waysIn.items.map((w) => (
                <li key={w.label}>
                  <a
                    className="hero__waysInLink"
                    href={w.href}
                    {...(w.external ? { rel: 'noreferrer' } : {})}
                  >
                    <span className="hero__waysInTitle">
                      {w.label}
                      {w.external ? <span aria-hidden="true"> ↗</span> : null}
                    </span>
                    <span className="hero__waysInHint">{w.hint}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* The artifact, cold. Described, never reconstructed. */}
        <div className="hero__pinto doc-object doc-object--scanned reg-doc on-doc">
          {content.pinto.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <span className="hero__pintoCite">{content.pintoCite}</span>
        </div>
      </div>

      {/* The double reading. */}
      <div className="hero__record">
        <div className="hero__recordHead">
          <h2 className="hero__recordTitle">{r.heading}</h2>
          <Prov kind="simulated" />
        </div>
        {/* Both endings to the sentence are in the markup and CSS shows the one
            that matches the viewport. The page is prerendered, so a JS
            breakpoint read cannot decide this: the HTML is written before any
            viewport exists. */}
        <p className="hero__standfirst">
          {r.standfirst.replace(r.dragInstruction, '')}
          <span className="hero__dragNote">{r.dragInstruction}</span>
          <span className="hero__stackedNote">{r.standfirstStacked}</span>
        </p>

        {/* The seam's position is a custom property rather than a conditional
            inline style, so the prerendered markup already carries the split
            the reader will see and CSS applies it only where the panes sit
            side by side. */}
        <div className="hero__split" style={{ '--hero-split': `${split * 100}%` } as CSSProperties}>
          {/* The engineering reading. */}
          <div className="hero__pane hero__console">
            <p className="hero__paneLabel">{r.consoleLabel}</p>
            <dl className="hero__telemetry">
              {r.telemetry.map((f) => (
                <div key={f.key} style={{ display: 'contents' }}>
                  <dt>{f.key}</dt>
                  <dd data-load={f.loadBearing ? 'true' : undefined}>{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="hero__consoleFoot">{r.telemetryFoot}</p>
          </div>

          <Seam
            className="hero__seam"
            orientation={wide ? 'vertical' : 'horizontal'}
            {...(wide
              ? {
                  split: {
                    value: split,
                    onChange: setSplit,
                    label: r.seamLabel,
                  },
                }
              : {})}
          />

          {/* The legal reading. Same facts. */}
          <div className="hero__pane hero__exhibitWrap">
            <div className="hero__exhibit doc-object doc-object--scanned on-doc">
              <div className="hero__exhibitHead">
                <span className="hero__exhibitNo">{r.exhibitNo}</span>
                <span className="bates">{r.exhibitBates}</span>
              </div>
              <p className="hero__exhibitBody">{r.exhibitBody}</p>
              <p className="hero__exhibitPurpose">{r.exhibitPurpose}</p>
              <div className="hero__exhibitFoot">
                <span>{r.exhibitLegend}</span>
                <span className="hero__legend">{exhibitLegend}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="hero__caption">{r.caption}</p>
      </div>

      {/* The explainer, moved up from §09 (U1): it was the single most
          accessible entry point and nothing at the top linked to it. Still
          preload="none" behind the poster — 9½ minutes of video costs
          nothing until a reader presses play. */}
      <figure className="hero__explainer" id="explainer">
        <figcaption className="hero__explainerHead">
          <span className="hero__explainerLabel">{explainer.label}</span>
          <span className="hero__explainerMeta">{explainer.duration}</span>
        </figcaption>
        {/* biome-ignore lint/a11y/useMediaCaption: the track below renders as
              soon as transcript.ts has cues. Until then, a fabricated or
              empty track would claim captions that are not there, which is
              worse than the honestly documented gap this is — recorded in
              the README rather than hidden. */}
        <video
          className="hero__explainerPlayer"
          controls
          preload="none"
          poster={explainer.poster}
          width={1280}
          height={720}
        >
          <source src={explainer.src} type={explainer.type} />
          {cues.length > 0 && (
            <track kind="captions" srcLang="en" label="English" src={explainer.captions} default />
          )}
          {explainer.fallback}{' '}
          <a href={explainer.downloadUrl} download>
            {explainer.downloadLabel}
          </a>
        </video>
        <p className="hero__explainerNote">
          {isAbsoluteVideoSrc(explainer.src) ? explainer.noteBlob : explainer.note}
        </p>
      </figure>

      {cues.length > 0 && (
        <details className="hero__transcript">
          <summary>{explainer.transcriptLabel}</summary>
          <ol>
            {cues.map((c) => (
              <li key={c.start}>
                <span className="hero__transcriptTime">{formatCueTime(c.start)}</span>
                {c.text}
              </li>
            ))}
          </ol>
        </details>
      )}

      {/* The orientation block and the five-minute version (U2), between the
          explainer and "What follows" — after the two ways the reader has
          just been shown the record, and before the section-by-section
          argument begins. */}
      <Orientation />

      <div className="hero__onward">
        <p className="hero__onwardBody">
          <span className="hero__onwardLabel">{content.onward.label}</span>
          {content.onward.body}
          <span className="sr-only"> {disclaimer.full}</span>
        </p>
        <a className="hero__cta" href="#pincer">
          {content.onward.cta}
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  )
}
