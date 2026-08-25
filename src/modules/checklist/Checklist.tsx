import { checklist } from '../../content/checklist'
import './checklist.css'

/**
 * The implementation checklist.
 *
 * A one-page artifact a safety lead can hand to their general counsel. On
 * screen it is a document object; printed, it is the only thing on the page.
 * See src/styles/print.css.
 */
export function Checklist() {
  return (
    <div className="cl doc-object doc-object--scanned on-doc" id="checklist">
      <header className="cl__head">
        <div>
          <h3 className="cl__title">{checklist.title}</h3>
          <p className="cl__subtitle">{checklist.subtitle}</p>
        </div>
        <div className="cl__actions">
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            {checklist.printLabel}
          </button>
          <p className="cl__printNote">{checklist.printNote}</p>
        </div>
      </header>

      <div className="cl__groups">
        {checklist.groups.map((g) => (
          <section className="clg" key={g.n}>
            <h4 className="clg__title">
              <span className="clg__n">{g.n}</span>
              {g.title}
            </h4>
            <ul className="clg__items">
              {g.items.map((it) => (
                <li className="cli" key={it.text.slice(0, 40)}>
                  <span className="cli__box" aria-hidden="true" />
                  <span className="cli__body">
                    <span className="cli__text">{it.text}</span>
                    {'owner' in it && it.owner ? (
                      <span className="cli__owner">{it.owner}</span>
                    ) : null}
                    {'note' in it && it.note ? <span className="cli__note">{it.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="cl__foot">
        <p className="cl__cite">{checklist.footer.citation}</p>
        <p className="cl__disclaimer">{checklist.footer.disclaimer}</p>
      </footer>
    </div>
  )
}
