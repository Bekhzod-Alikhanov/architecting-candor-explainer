import { SectionHead } from '../../components/SectionHead'
import { paper, about, contribution, disclaimer, colophonCopy, explainer } from '../../content/site'
import { bibtex } from '../../lib/citation'
import { useCopy } from '../../lib/useCopy'
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
  const bibtexEntry = bibtex(paper)
  const { copied: citationCopied, copy: copyCitation } = useCopy()
  const { copied: bibtexCopied, copy: copyBibtex } = useCopy()

  return (
    <section className="sect page" id="paper" aria-labelledby="paper-title">
      <SectionHead id="paper" titleId="paper-title" />

      <div className="colo">
        <div className="colo__cite doc-object doc-object--scanned on-doc">
          <h2 className="colo__title">{paper.title}</h2>
          <p className="colo__subtitle">{paper.subtitle}</p>

          <ul className="colo__authors">
            {paper.authors.map((a) => (
              <li key={a.name}>
                {a.name}
                {'corresponding' in a && a.corresponding ? (
                  <span className="colo__star" title={colophonCopy.correspondingLabel}>
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
              {colophonCopy.correspondingLabel}: {corresponding.name},{' '}
              <a href={`mailto:${corresponding.email}`}>{corresponding.email}</a>
            </p>
          ) : null}

          <div className="colo__links">
            <a className="btn btn--primary" href={paper.doiUrl} rel="noreferrer">
              {colophonCopy.readPaper} <span aria-hidden="true">↗</span>
            </a>
            <a className="btn" href={paper.researchPage} rel="noreferrer">
              {colophonCopy.researchLink} <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/* The player itself now lives in §00 (U1) — this is the one line
              that says where it went, for a reader who scrolled straight
              here from the section rail. */}
          <a className="colo__videoBack" href="#explainer">
            {explainer.backLabel} <span aria-hidden="true">↑</span>
          </a>

          <div className="colo__citation">
            <span className="colo__citationLabel">{colophonCopy.citeLabel}</span>
            <p>{paper.citation}</p>
            <div className="colo__citeActions">
              <button type="button" className="btn" onClick={() => copyCitation(paper.citation)}>
                {citationCopied ? colophonCopy.copied : colophonCopy.copyCitation}
              </button>
              <button type="button" className="btn" onClick={() => copyBibtex(bibtexEntry)}>
                {bibtexCopied ? colophonCopy.copied : colophonCopy.copyBibtex}
              </button>
              {/* One shared status element rather than one per button: only one
                  copy can ever be in flight at a time, and a screen reader
                  hearing "Copied" twice in a row from two separate regions
                  would be worse than once from a shared one. */}
              <span className="sr-only" role="status">
                {citationCopied || bibtexCopied ? colophonCopy.copied : ''}
              </span>
            </div>
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
