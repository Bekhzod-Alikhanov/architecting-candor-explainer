import { useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { Scaffold } from '../../components/Scaffold'
import { ArguesBlock } from '../../components/ArguesBlock'
import { BoundaryChart } from './BoundaryChart'
import { Countdown } from './Countdown'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { pincer } from '../../content/pincer'
import { entries, timelineCopy, timelineSteps, timelineArgues, axis } from '../../content/timeline'
import './pincer.css'

/**
 * 01 — The pincer.
 *
 * Two forces on one reader, then the reclassification that makes the second
 * force bite. The boundary chart is scaffolded: six guided steps that move the
 * chart's own state, then an explicit release.
 */
export function Pincer() {
  const vertical = !useMediaQuery('(min-width: 56rem)')
  const [step, setStep] = useState(0)
  const [freeSelected, setFreeSelected] = useState(entries.length - 1)

  const released = step >= entries.length
  const drawnUpTo = released ? entries.length - 1 : step
  const selected = released ? freeSelected : step
  const entry = entries[selected]

  const onSelect = (i: number) => {
    if (released) setFreeSelected(i)
    else setStep(i)
  }

  return (
    <section className="sect page" id="pincer" aria-labelledby="pincer-title">
      <SectionHead
        n={pincer.section}
        eyebrow={pincer.eyebrow}
        seq={2}
        titleId="pincer-title"
        headline={pincer.headline}
        standfirst={pincer.standfirst}
      />

      {/* The two forces, set opposite one another. */}
      <div className="forces">
        {pincer.forces.map((f) => (
          <article className="force" key={f.id} data-force={f.id}>
            <p className="force__kicker">{f.kicker}</p>
            <h3 className="force__title">{f.title}</h3>
            <p className="force__lead">{f.lead}</p>
            <ul className="force__items">
              {f.items.map((it) => (
                <li key={it.authority}>
                  <span className="force__authority">{it.authority}</span>
                  <span className="force__text">{it.text}</span>
                </li>
              ))}
            </ul>
            <p className="force__consequence">{f.consequence}</p>
          </article>
        ))}
      </div>

      <aside className="bind doc-object doc-object--scanned on-doc">
        <span className="bind__label">{pincer.bind.label}</span>
        <p className="bind__body">{pincer.bind.body}</p>
        <span className="bind__cite">{pincer.bind.cite}</span>
      </aside>

      {/* The reclassification. */}
      <div className="tl">
        <h3 className="tl__heading">{timelineCopy.heading}</h3>
        <p className="tl__standfirst">{timelineCopy.standfirst}</p>

        <Scaffold
          steps={timelineSteps}
          current={step}
          onChange={setStep}
          label={timelineCopy.scaffoldLabel}
          hint={timelineCopy.advanceHint}
          className="tl__scaffold"
        />

        <div className="tl__chart" data-vertical={vertical}>
          <BoundaryChart
            entries={entries}
            current={drawnUpTo}
            onSelect={onSelect}
            vertical={vertical}
          />
          <div className="tl__regions">
            <p>
              <strong>{axis.topLabel}.</strong> {axis.topNote}
            </p>
            <p>
              <strong>{axis.bottomLabel}.</strong> {axis.bottomNote}
            </p>
            <p className="tl__regionBand">
              <strong>{axis.bandLabel}.</strong> {axis.bandNote}
            </p>
          </div>
        </div>

        {/* The entry list is the keyboard path into the chart, and the chart's
            text equivalent. */}
        <ul className="tl__list" aria-label={timelineCopy.entriesLabel}>
          {entries.map((e, i) => (
            <li key={e.id}>
              <button
                type="button"
                className="tl__entry"
                data-selected={i === selected}
                data-drawn={i <= drawnUpTo}
                aria-current={i === selected ? 'true' : undefined}
                onClick={() => onSelect(i)}
              >
                <span className="tl__entryDate">{e.date}</span>
                <span className="tl__entryTitle">{e.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {entry ? (
          <article className="tl__detail doc-object doc-object--scanned on-doc" aria-live="polite">
            <header className="tl__detailHead">
              <span className="tl__detailDate">{entry.date}</span>
              {entry.future ? <span className="tl__pending">Not yet in force</span> : null}
            </header>
            <h4 className="tl__detailTitle">{entry.title}</h4>
            <p className="tl__authority">{entry.authority}</p>

            <div className="tl__field">
              <span className="tl__fieldLabel">{timelineCopy.holdingLabel}</span>
              <p className="tl__fieldBody">{entry.holding}</p>
            </div>
            <div className="tl__field tl__field--records">
              <span className="tl__fieldLabel">{timelineCopy.recordsLabel}</span>
              <p className="tl__fieldBody">{entry.forRecords}</p>
            </div>
          </article>
        ) : null}
      </div>

      <Countdown />

      <ArguesBlock label={timelineArgues.label} body={timelineArgues.body} />
    </section>
  )
}
