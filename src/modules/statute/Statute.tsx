import { useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { ArguesBlock } from '../../components/ArguesBlock'
import { principles, protections, statuteCopy as copy, statuteArgues } from '../../content/statute'
import './statute.css'

/**
 * 07 — The ask.
 *
 * Four principles, and the second one is four separate protections that fail
 * together. Switching any of them off says what breaks, in the paper's own
 * reasoning.
 */
export function Statute() {
  const [off, setOff] = useState<ReadonlySet<string>>(new Set())

  const toggle = (id: string) =>
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allOff = off.size === protections.length
  const intact = off.size === 0

  return (
    <section className="sect page" id="ask" aria-labelledby="ask-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={8}
        titleId="ask-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />

      <ol className="prin">
        {principles.map((p) => (
          <li className="prin__item" key={p.n} data-interactive={p.n === '02'}>
            <div className="prin__head">
              <span className="prin__n" aria-hidden="true">
                {p.n}
              </span>
              <h3 className="prin__title">{p.title}</h3>
            </div>
            <p className="prin__body">{p.body}</p>
            {p.cite ? <p className="prin__cite">{p.cite}</p> : null}

            {p.n === '02' ? (
              <div className="prot">
                <p className="prot__lead">{copy.interactiveLead}</p>

                <ul className="prot__list">
                  {protections.map((pr) => {
                    const isOff = off.has(pr.id)
                    return (
                      <li className="prot__item" key={pr.id} data-off={isOff}>
                        <button
                          type="button"
                          className="prot__toggle"
                          role="switch"
                          aria-checked={!isOff}
                          onClick={() => toggle(pr.id)}
                        >
                          <span className="prot__track" aria-hidden="true">
                            <span className="prot__knob" />
                          </span>
                          <span className="prot__name">{pr.name}</span>
                          <span className="prot__state">
                            {isOff ? copy.offLabel : copy.onLabel}
                          </span>
                        </button>
                        <p className="prot__text">{isOff ? pr.breaks : pr.holds}</p>
                        {isOff ? <p className="prot__breaksLabel">{copy.breaksLabel}</p> : null}
                      </li>
                    )
                  })}
                </ul>

                <div
                  className="prot__summary"
                  data-state={allOff ? 'all-off' : intact ? 'intact' : 'partial'}
                  aria-live="polite"
                >
                  <p className="prot__summaryTitle">
                    {allOff
                      ? copy.allOffTitle
                      : intact
                        ? copy.intactTitle
                        : `${off.size} of ${protections.length} ${copy.partialTitleSuffix}`}
                  </p>
                  <p className="prot__summaryBody">
                    {allOff ? copy.allOffBody : intact ? copy.intactBody : copy.partialBody}
                  </p>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <ArguesBlock label={statuteArgues.label} body={statuteArgues.body} />
    </section>
  )
}
