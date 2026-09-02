import { Prov } from '../../components/Provenance'
import { orientation } from '../../content/orientation'
import { section } from '../../content/site'

/**
 * The orientation block and the five-minute version (U2).
 *
 * Sits between the explainer figure and "What follows" in §00 — see Hero.tsx
 * — as a document object, so it reads as the memo's own summary rather than
 * as site chrome. Every sentence in the five-minute version traces to the
 * paper's executive summary, which is what the single `paper` provenance
 * mark on the block as a whole is for.
 *
 * The "→ 01 The pincer" link under each sentence is built from the section
 * register rather than written out here, so the number and title cannot
 * drift from what the section itself is currently called.
 */
export function Orientation() {
  const { what, who, how, express } = orientation

  return (
    <div className="orient doc-object doc-object--scanned reg-doc on-doc" id="orientation">
      <div className="orient__head">
        <h2 className="orient__title" id="orientation-title">
          {orientation.eyebrow}
        </h2>
        <Prov kind="paper" />
      </div>

      <dl className="orient__facts">
        <div>
          <dt>{what.label}</dt>
          <dd>{what.body}</dd>
        </div>
        <div>
          <dt>{who.label}</dt>
          <dd>{who.body}</dd>
        </div>
        <div>
          <dt>{how.label}</dt>
          <dd>
            <ul className="orient__how">
              {how.items.map((item) => (
                <li key={item.label}>
                  <span className="orient__howLabel">{item.label}</span>
                  <span className="orient__howValue reg-console">{item.value}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="orient__express">
        <h3 className="orient__expressTitle">{express.label}</h3>
        <p className="orient__expressIntro">{express.intro}</p>

        <ol className="orient__steps">
          {express.steps.map((step) => {
            const target = section(step.ref)
            return (
              <li className="orient__step" key={step.id}>
                <p className="orient__stepText">{step.text}</p>
                <div className="orient__stepMeta">
                  <a className="orient__stepLink reg-console" href={step.href}>
                    <span aria-hidden="true">→ </span>
                    {target.n} {target.title}
                  </a>
                  <span className="orient__stepCite reg-console">{step.cite}</span>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="orient__outro">{express.outro}</p>
      </div>
    </div>
  )
}
