import { useMemo } from 'react'
import { strategies, outcomes } from '../../content/grading'
import { gradeStrategy, type Grade } from '../../lib/grade'

/**
 * The four-strategy comparison. This is the payoff, not the instruction.
 *
 * Each column is produced by running the same grading function over the same
 * deck, so nothing here is asserted. The reader's own result sits alongside
 * them, graded identically.
 */

export interface RevealProps {
  readonly readerGrade: Grade
  readonly readerRouted: number
  readonly total: number
}

export function Reveal({ readerGrade, readerRouted, total }: RevealProps) {
  const runs = useMemo(
    () => strategies.map((s) => ({ strategy: s, grade: gradeStrategy(s.id) })),
    [],
  )

  const columns = [
    ...runs.map((r) => ({
      id: r.strategy.id,
      name: r.strategy.name,
      claim: r.strategy.claim,
      lesson: r.strategy.lesson,
      grade: r.grade,
      isReader: false,
    })),
    ...(readerRouted === total
      ? [
          {
            id: 'yours',
            name: 'Your routing',
            claim: 'Graded by exactly the same function as the four above.',
            lesson: '',
            grade: readerGrade,
            isReader: true,
          },
        ]
      : []),
  ]

  return (
    <div className="reveal">
      <div className="reveal__grid">
        {columns.map((col) => {
          const c = col.grade
          return (
            <article className="scol" key={col.id} data-reader={col.isReader}>
              <h4 className="scol__name">{col.name}</h4>
              <p className="scol__claim">{col.claim}</p>

              <dl className="scol__stats">
                <div className="scol__stat" data-good={c.remediationScore === c.remediationTotal}>
                  <dt>Remediation</dt>
                  <dd data-figure>
                    {c.remediationScore}/{c.remediationTotal}
                  </dd>
                </div>
                <div className="scol__stat" data-bad={c.adverseCount > 0}>
                  <dt>Adverse outcomes</dt>
                  <dd data-figure>{c.adverseCount}</dd>
                </div>
                <div className="scol__stat">
                  <dt>Produced</dt>
                  <dd data-figure>{c.counts.produced}</dd>
                </div>
                <div className="scol__stat">
                  <dt>Withheld</dt>
                  <dd data-figure>{c.counts.withheld}</dd>
                </div>
                {/* Without this, writing everything into one system looks costless:
                    it scores 7/7 with no adverse outcome, and its real price is
                    the fault language and waived privilege sitting in the flags. */}
                <div className="scol__stat" data-bad={c.flagCount > 4}>
                  <dt>Warnings</dt>
                  <dd data-figure>{c.flagCount}</dd>
                </div>
              </dl>

              <ul className="scol__breakdown">
                {(['pierced', 'spoliation', 'excluded407', 'notCreated'] as const)
                  .filter((o) => c.counts[o] > 0)
                  .map((o) => (
                    <li key={o} data-adverse={outcomes[o].adverse}>
                      <span aria-hidden="true">{outcomes[o].glyph}</span>
                      {c.counts[o]} {outcomes[o].short.toLowerCase()}
                    </li>
                  ))}
              </ul>

              {col.lesson ? <p className="scol__lesson">{col.lesson}</p> : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
