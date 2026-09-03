import { Hero } from './modules/hero/Hero'
import { Pincer } from './modules/pincer/Pincer'
import { Colophon } from './modules/colophon/Colophon'
import { Deferred } from './components/Deferred'
import { TakeItToYourGC } from './modules/gc/TakeItToYourGC'
import { SectionNav } from './components/SectionNav'
import { section, disclaimer, paper } from './content/site'
import { rubric } from './content/hero'
import { skipLink } from './content/ui'

/**
 * The nine sections, in order, because the argument is a sequence.
 *
 * 00 and 01 are eager: they are the opening argument and they are above or near
 * the fold. 02 to 07 are each their own chunk, mounted as the reader approaches
 * them. 08 is eager because it has to be printable from anywhere on the page —
 * see the note above its import. 09 is small and stays eager so the citation is
 * always present.
 *
 * These are plain import functions, not `lazy(...)` calls: Deferred builds the
 * lazy component itself, because a retry after a chunk failure needs a fresh
 * one — `lazy()` caches a rejection forever, so the module-scope constant this
 * used to be could never be retried.
 */
const loadSignal = () => import('./modules/signal/Signal').then((m) => ({ default: m.Signal }))
const loadRouteTheRecord = () =>
  import('./modules/route/RouteTheRecord').then((m) => ({ default: m.RouteTheRecord }))
const loadArchitecture = () =>
  import('./modules/architecture/Architecture').then((m) => ({ default: m.Architecture }))
const loadCalibrate = () =>
  import('./modules/calibrate/Calibrate').then((m) => ({ default: m.Calibrate }))
const loadRegimes = () => import('./modules/regimes/Regimes').then((m) => ({ default: m.Regimes }))
const loadStatute = () => import('./modules/statute/Statute').then((m) => ({ default: m.Statute }))

/**
 * The same six imports, as a list, for the build's prerender.
 *
 * src/entry-server.tsx resolves all of them before rendering, because the
 * prerender cannot suspend — see src/lib/prerender-cache.ts. A section left out
 * of this list fails the build rather than shipping as a placeholder, which is
 * what keeps the two lists honest.
 */
export const deferredLoads = [
  loadSignal,
  loadRouteTheRecord,
  loadArchitecture,
  loadCalibrate,
  loadRegimes,
  loadStatute,
] as const
/*
 * §08 is deliberately NOT lazy. It contains the implementation checklist, which
 * the print stylesheet renders as the only thing on the page. Deferring it made
 * Ctrl+P from the top of the document print a blank sheet: `beforeprint` fires
 * synchronously, so a dynamic import started there cannot resolve before the
 * browser captures the page, and what got printed was the Suspense placeholder.
 * The chunk is 3.1KB gzipped against a 200KB budget, so the correct trade is to
 * carry it on first load and have printing work from anywhere on the page.
 */

export function App() {
  return (
    <>
      <a className="skip-link" href="#content">
        {skipLink}
      </a>

      {/* The masthead. A real <header>, deliberately not nested inside <main>
          or a <section>: the "banner" landmark role only applies to a
          top-level <header>, so §00 carried this rubric itself until now and
          a screen reader's landmark list never saw a banner at all. Same
          rubric, same look — see hero.css/components.css for the padding
          that used to live on .hero moving here instead, so nothing shifts. */}
      <header className="shell__mast">
        <span>{rubric.publisher}</span>
        <span>{rubric.season}</span>
      </header>

      <div className="shell">
        <SectionNav />

        <main className="shell__flow" id="content">
          <Hero />
          <Pincer />

          <Deferred {...section('signal')} load={loadSignal} />

          <Deferred {...section('route')} load={loadRouteTheRecord} />

          <Deferred {...section('architecture')} load={loadArchitecture} />

          <Deferred {...section('calibrate')} load={loadCalibrate} />

          <Deferred {...section('regimes')} load={loadRegimes} />

          <Deferred {...section('ask')} load={loadStatute} />

          <TakeItToYourGC />

          <Colophon />
        </main>
      </div>

      {/* contentinfo, and for the same reason as the header above: a
          <footer> nested inside <main> is not a landmark at all, so the
          disclaimer and citation would be unreachable from a landmark list.
          §09's paper card keeps its own full citation and BibTeX block —
          this is only the one-line version every page should carry. */}
      <footer className="shell__foot">
        <p>{disclaimer.short}</p>
        <p>{paper.citation}</p>
      </footer>
    </>
  )
}
