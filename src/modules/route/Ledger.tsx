import { outcomes } from '../../content/grading'
import { bins } from '../../content/artifacts'
import type { Grade } from '../../lib/grade'

/**
 * The itemised result of the document request.
 *
 * Every privilege outcome names its authority and gives one line of reasoning,
 * because a reader who cannot check the reasoning has been asked to take the
 * grading on trust, which is the opposite of the point.
 */
export function Ledger({ grade }: { readonly grade: Grade }) {
  return (
    <div className="ledger">
      <ol className="ledger__list">
        {grade.verdicts.map((v) => {
          const meta = outcomes[v.outcome]
          const bin = bins.find((b) => b.id === v.bin)
          return (
            <li className="ledger__item doc-object doc-object--flat on-doc" key={v.artifact.id}>
              <div className="ledger__head">
                <span className="ledger__kind">{v.artifact.kind}</span>
                <span className="ledger__bin">{bin?.name ?? ''}</span>
              </div>

              <p className="ledger__title">{v.artifact.title}</p>

              <p className="ledger__outcome" data-outcome={v.outcome} data-adverse={meta.adverse}>
                <span className="ledger__glyph" aria-hidden="true">
                  {meta.glyph}
                </span>
                {meta.label}
              </p>

              {v.authority ? <p className="ledger__authority">{v.authority}</p> : null}
              <p className="ledger__reason">{v.reason}</p>
              {v.caveat ? <p className="ledger__caveat">{v.caveat}</p> : null}

              {v.flags.map((fl) => (
                <p className="ledger__flag" key={fl.kind}>
                  <span className="ledger__flagLabel">{fl.label}</span>
                  {fl.text}
                </p>
              ))}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
