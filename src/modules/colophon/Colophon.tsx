import { SectionHead } from '../../components/SectionHead'
import { paper, about, contribution, disclaimer } from '../../content/site'
import './colophon.css'

/**
 * 09 — The paper, and about this page.
 *
 * The About block is what makes the site honest about its own shelf life: a
 * dated snapshot, illustrative interactives, and a legal landscape that moves
 * faster than the page does.
 */
export function Colophon() {
  const corresponding = paper.authors.find((a) => 'corresponding' in a && a.corresponding)

  return (
    <section className="sect page" id="paper" aria-labelledby="paper-title">
      <SectionHead n="09" eyebrow="The paper" seq={10} titleId="paper-title" />

      <div className="colo">
        <div className="colo__cite doc-object doc-object--scanned on-doc">
          <h2 className="colo__title">{paper.title}</h2>
          <p className="colo__subtitle">{paper.subtitle}</p>

          <ul className="colo__authors">
            {paper.authors.map((a) => (
              <li key={a.name}>
                {a.name}
                {'corresponding' in a && a.corresponding ? (
                  <span className="colo__star" title="Corresponding author">
                    {' '}
                    ✳
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="colo__imprint">
            {paper.publisher} · {paper.copublisher} · {paper.date}
          </p>

          {corresponding && 'email' in corresponding && corresponding.email ? (
            <p className="colo__corresponding">
              Corresponding author: {corresponding.name},{' '}
              <a href={`mailto:${corresponding.email}`}>{corresponding.email}</a>
            </p>
          ) : null}

          <div className="colo__links">
            <a className="btn btn--primary" href={paper.paperUrl} rel="noreferrer">
              Read the paper <span aria-hidden="true">↗</span>
            </a>
            <a className="btn" href={paper.researchPage} rel="noreferrer">
              Arcadia Impact research <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="colo__citation">
            <span className="colo__citationLabel">Cite as</span>
            <p>{paper.citation}</p>
          </div>
        </div>

        <div className="colo__side">
          <h3 className="colo__sideHead">{contribution.heading}</h3>
          <p className="colo__sideNote">{contribution.note}</p>
          <dl className="colo__credit">
            {contribution.rows.map((r) => (
              <div key={r.role}>
                <dt>{r.role}</dt>
                <dd>{r.who}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="colo__about doc-object doc-object--scanned on-doc">
        <h3 className="colo__aboutHead">{about.heading}</h3>
        {about.blocks.map((b) => (
          <p className="colo__aboutBody" key={b.slice(0, 30)}>
            {b}
          </p>
        ))}
        <p className="colo__disclaimer">{disclaimer.full}</p>
      </div>
    </section>
  )
}
