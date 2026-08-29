import { SectionHead } from '../../components/SectionHead'
import {
  paper,
  about,
  contribution,
  disclaimer,
  colophonCopy,
  explainer,
  section,
} from '../../content/site'
import './colophon.css'

/**
 * 09 — The paper, and about this page.
 *
 * The About block is what makes the site honest about its own shelf life: a
 * dated snapshot, illustrative interactives, and a legal landscape that moves
 * faster than the page does.
 */
/** §09's number, title and Bates sequence all come from the section register. */
const paperSection = section('paper')

export function Colophon() {
  const corresponding = paper.authors.find((a) => 'corresponding' in a && a.corresponding)

  return (
    <section className="sect page" id="paper" aria-labelledby="paper-title">
      <SectionHead
        n={paperSection.n}
        eyebrow={paperSection.title}
        seq={paperSection.seq}
        titleId="paper-title"
      />

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
            <a className="btn btn--primary" href={paper.paperUrl} rel="noreferrer">
              {colophonCopy.readPaper} <span aria-hidden="true">↗</span>
            </a>
            <a className="btn" href={paper.researchPage} rel="noreferrer">
              {colophonCopy.researchLink} <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/*
            The video ships with the deployment but is not in git, so the build
            reports whether it was actually there — see vite.config.ts. Without
            this a fresh clone would render a player pointing at a 404.
          */}
          {__HAS_EXPLAINER__ ? (
            <figure className="colo__video">
              <figcaption className="colo__videoHead">
                <span className="colo__videoLabel">{explainer.label}</span>
                <span className="colo__videoMeta">{explainer.duration}</span>
              </figcaption>
              {/* biome-ignore lint/a11y/useMediaCaption: no caption track exists
                  for this video yet. A fabricated or empty track would be worse
                  than none, because it would claim captions that are not there.
                  This is the site's one known accessibility gap and it is
                  recorded in the README rather than hidden. */}
              <video
                className="colo__player"
                controls
                preload="none"
                poster={explainer.poster}
                width={1280}
                height={720}
              >
                <source src={explainer.src} type={explainer.type} />
                {explainer.fallback}{' '}
                <a href={explainer.src} download>
                  {explainer.downloadLabel}
                </a>
              </video>
              <p className="colo__videoNote">{explainer.note}</p>
            </figure>
          ) : null}

          <div className="colo__citation">
            <span className="colo__citationLabel">{colophonCopy.citeLabel}</span>
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
