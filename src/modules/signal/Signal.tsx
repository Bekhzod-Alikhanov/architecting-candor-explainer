import { useCallback, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Prov } from '../../components/Provenance'
import {
  handoffs,
  boundaries,
  translation,
  deviance,
  recording,
  anchor,
  signalCopy as copy,
  signalArgues,
} from '../../content/signal'
import './signal.css'

/**
 * 02 — Where the signal dies.
 *
 * Three compact instruments rather than one large one, because the section's
 * job is to establish three mechanisms and then hand the reader the figure that
 * measures what they produce together.
 */
export function Signal() {
  const [stage, setStage] = useState(0)
  const [recurrences, setRecurrences] = useState(0)

  const current = handoffs[stage]!
  const origin = handoffs[0]!
  const harmed = recurrences >= deviance.steps.length

  const advance = useCallback(() => {
    setStage((s) => Math.min(s + 1, handoffs.length - 1))
  }, [])

  return (
    <section className="sect page" id="signal" aria-labelledby="signal-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={3}
        titleId="signal-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />

      {/* Mechanism one: translation loss. */}
      <div className="mech">
        <div className="mech__head">
          <span className="mech__label">{translation.label}</span>
          <h3 className="mech__heading">{translation.heading}</h3>
        </div>
        <div className="mech__body">
          {translation.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <div className="decay">
          <ol className="decay__track" aria-label={translation.trackLabel}>
            {handoffs.map((h, i) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="decay__stop"
                  data-active={i === stage}
                  data-passed={i < stage}
                  aria-current={i === stage ? 'step' : undefined}
                  onClick={() => setStage(i)}
                >
                  <span className="decay__stopBar" aria-hidden="true">
                    <span
                      style={{ blockSize: `${(h.fields.length / origin.fields.length) * 100}%` }}
                    />
                  </span>
                  <span className="decay__stopName">{h.actor}</span>
                  <span className="decay__stopCount" data-figure>
                    {h.fields.length}/{origin.fields.length}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="decay__panel" aria-live="polite">
            <p className="decay__boundary" data-boundary={current.boundary}>
              <span>{boundaries[current.boundary].label}</span>
              {boundaries[current.boundary].note}
            </p>
            <p className="decay__note">{current.boundaryNote}</p>

            <div className="decay__cols">
              <div>
                <p className="decay__colLabel">{translation.fieldsLabel}</p>
                <ul className="decay__fields">
                  {current.fields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              {current.dropped ? (
                <div>
                  <p className="decay__colLabel decay__colLabel--lost">
                    {translation.droppedLabel}
                  </p>
                  <p className="decay__dropped">{current.dropped}</p>
                </div>
              ) : null}
            </div>

            <div className="decay__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={advance}
                disabled={stage >= handoffs.length - 1}
              >
                {translation.stepLabel} <span aria-hidden="true">→</span>
              </button>
              {stage > 0 ? (
                <button type="button" className="btn" onClick={() => setStage(0)}>
                  {translation.restartLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mechanism two: normalization of deviance. */}
      <div className="mech">
        <div className="mech__head">
          <span className="mech__label">{deviance.label}</span>
          <h3 className="mech__heading">{deviance.heading}</h3>
        </div>
        <div className="mech__body">
          {deviance.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <div className="drift" data-harmed={harmed}>
          <div className="drift__meter">
            <span className="drift__original" style={{ insetInlineStart: '18%' }}>
              <span className="drift__originalLabel">{deviance.originalLabel}</span>
            </span>
            <span
              className="drift__accepted"
              style={{ inlineSize: `${18 + recurrences * 12}%` }}
              aria-hidden="true"
            />
            <span className="drift__scale" aria-hidden="true" />
          </div>

          <div className="drift__readout" aria-live="polite">
            <p className="drift__counts">
              <span className="drift__count" data-figure>
                {Math.min(recurrences, deviance.steps.length)}
              </span>
              <span className="drift__countLabel">{deviance.observedLabel}</span>
            </p>
            <p className="drift__step">
              {harmed
                ? deviance.harmBody
                : recurrences === 0
                  ? deviance.initial
                  : deviance.steps[recurrences - 1]}
            </p>
          </div>

          <div className="drift__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setRecurrences((n) => n + 1)}
              disabled={harmed}
            >
              {harmed ? deviance.harmLabel : deviance.runLabel}
            </button>
            {recurrences > 0 ? (
              <button type="button" className="btn" onClick={() => setRecurrences(0)}>
                {deviance.resetLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mechanism three: the decision to record. */}
      <div className="mech">
        <div className="mech__head">
          <span className="mech__label">{recording.label}</span>
          <h3 className="mech__heading">{recording.heading}</h3>
        </div>
        <div className="mech__split">
          <div className="mech__body">
            {recording.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <aside className="studies">
            <p className="studies__figure" data-figure>
              {recording.studies}
            </p>
            <p className="studies__note">{recording.studiesNote}</p>
          </aside>
        </div>
      </div>

      {/* The finding that anchors the section. */}
      <figure className="anchor">
        <p className="anchor__figure">{anchor.figure}</p>
        <figcaption className="anchor__lead">{anchor.lead}</figcaption>
        <p className="anchor__body">{anchor.body}</p>
        <p className="anchor__cite">
          <Prov kind="paper" cite="§2.1.3" />
          {anchor.cite}
        </p>
      </figure>

      <ArguesBlock label={signalArgues.label} body={signalArgues.body} />
    </section>
  )
}
