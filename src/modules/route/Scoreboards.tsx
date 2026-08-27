import { outcomes, scoreboards, type Outcome } from '../../content/grading'
import type { Grade } from '../../lib/grade'

/**
 * Two scoreboards, always visible, moving in tension.
 *
 * Discovery exposure asks what a plaintiff can get. Remediation capability asks
 * what an engineer can still fix. They are meant to pull against each other,
 * and the reader should be able to watch one fall as the other rises.
 */

const ORDER: readonly Outcome[] = [
  'produced',
  'withheld',
  'pierced',
  'excluded407',
  'spoliation',
  'notCreated',
]

export interface ScoreboardsProps {
  readonly grade: Grade
  readonly routedCount: number
  readonly total: number
}

export function Scoreboards({ grade, routedCount, total }: ScoreboardsProps) {
  const max = Math.max(1, ...ORDER.map((o) => grade.counts[o]))

  return (
    <div className="boards">
      <section className="board" aria-labelledby="board-discovery">
        <h3 className="board__title" id="board-discovery">
          {scoreboards.discovery.title}
        </h3>
        <p className="board__sub">{scoreboards.discovery.sub}</p>

        {routedCount === 0 ? (
          <p className="board__empty">{scoreboards.discovery.empty}</p>
        ) : (
          <ul className="board__rows">
            {ORDER.map((o) => {
              const n = grade.counts[o]
              const meta = outcomes[o]
              return (
                <li className="board__row" key={o} data-zero={n === 0} data-adverse={meta.adverse}>
                  <span className="board__glyph" aria-hidden="true">
                    {meta.glyph}
                  </span>
                  <span className="board__label">{meta.label}</span>
                  <span className="board__bar" aria-hidden="true">
                    <span style={{ inlineSize: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="board__n" data-figure>
                    {n}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <p className="board__live sr-only" aria-live="polite">
          {routedCount} of {total} routed. {grade.counts.produced} produced, {grade.counts.withheld}{' '}
          withheld as privileged, {grade.counts.pierced} pierced, {grade.counts.excluded407}{' '}
          excluded under Rule 407, {grade.counts.spoliation} at spoliation risk,{' '}
          {grade.counts.notCreated} never created.
        </p>
      </section>

      <section className="board" aria-labelledby="board-remediation">
        <h3 className="board__title" id="board-remediation">
          {scoreboards.remediation.title}
        </h3>
        <p className="board__sub">{scoreboards.remediation.sub}</p>

        <p className="board__score">
          <span className="board__scoreValue" data-figure>
            {grade.remediationScore}
          </span>
          <span className="board__scoreOf">of {grade.remediationTotal} fields recoverable</span>
        </p>

        <ul className="board__fields">
          {grade.fields.map((f) => (
            <li className="board__field" key={f.id} data-available={f.available}>
              <span className="board__fieldMark" aria-hidden="true">
                {f.available ? '✓' : '✗'}
              </span>
              <span className="board__fieldBody">
                <span className="board__fieldLabel">{f.label}</span>
                {f.consequence ? <span className="board__fieldLost">{f.consequence}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
