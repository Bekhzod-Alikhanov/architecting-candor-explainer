import { useState } from 'react'
import { Seam } from '../../components/Seam'
import { Prov } from '../../components/Provenance'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { memo as content, rubric } from '../../content/hero'
import { bates, disclaimer } from '../../content/site'
import './hero.css'

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
 */
export function Hero() {
  const wide = useMediaQuery('(min-width: 48rem)')
  const [split, setSplit] = useState(0.46)
  const r = content.record

  return (
    <section className="hero page" id="memo" aria-labelledby="memo-title">
      <div className="hero__rubric">
        <span>{rubric.publisher}</span>
        <span>{rubric.season}</span>
      </div>

      <div className="hero__head">
        <span className="hero__number" aria-hidden="true">
          {content.section}
        </span>
        <span className="hero__eyebrow">{content.eyebrow}</span>
        <span className="bates ml-auto">{bates(1)}</span>
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
        <p className="hero__standfirst">
          {wide
            ? r.standfirst
            : r.standfirst.replace(r.dragInstruction, r.standfirstStacked)}
        </p>

        <div className="hero__split" data-stacked={!wide}>
          {/* The engineering reading. */}
          <div
            className="hero__pane hero__console"
            style={wide ? { flex: `0 0 ${split * 100}%` } : undefined}
          >
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
          <div className="hero__pane hero__exhibitWrap" style={wide ? { flex: '1 1 0' } : undefined}>
            <div className="hero__exhibit doc-object doc-object--scanned on-doc">
              <div className="hero__exhibitHead">
                <span className="hero__exhibitNo">{r.exhibitNo}</span>
                <span className="bates">{r.exhibitBates}</span>
              </div>
              <p className="hero__exhibitBody">{r.exhibitBody}</p>
              <p className="hero__exhibitPurpose">{r.exhibitPurpose}</p>
              <div className="hero__exhibitFoot">
                <span>{r.exhibitLegend}</span>
                <span className="hero__legend">Confidential</span>
              </div>
            </div>
          </div>
        </div>

        <p className="hero__caption">{r.caption}</p>
      </div>

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
