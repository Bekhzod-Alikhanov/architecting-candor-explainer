import { lazy } from 'react'
import { Hero } from './modules/hero/Hero'
import { Pincer } from './modules/pincer/Pincer'
import { Colophon } from './modules/colophon/Colophon'
import { Deferred } from './components/Deferred'
import { TakeItToYourGC } from './modules/gc/TakeItToYourGC'
import { section } from './content/site'
import { skipLink } from './content/ui'

/**
 * The nine sections, in order, because the argument is a sequence.
 *
 * 00 and 01 are eager: they are the opening argument and they are above or near
 * the fold. 02 to 07 are each their own chunk, mounted as the reader approaches
 * them. 08 is eager because it has to be printable from anywhere on the page —
 * see the note above its import. 09 is small and stays eager so the citation is
 * always present.
 */
const Signal = lazy(() => import('./modules/signal/Signal').then((m) => ({ default: m.Signal })))
const RouteTheRecord = lazy(() =>
  import('./modules/route/RouteTheRecord').then((m) => ({ default: m.RouteTheRecord })),
)
const Architecture = lazy(() =>
  import('./modules/architecture/Architecture').then((m) => ({ default: m.Architecture })),
)
const Calibrate = lazy(() =>
  import('./modules/calibrate/Calibrate').then((m) => ({ default: m.Calibrate })),
)
const Regimes = lazy(() =>
  import('./modules/regimes/Regimes').then((m) => ({ default: m.Regimes })),
)
const Statute = lazy(() =>
  import('./modules/statute/Statute').then((m) => ({ default: m.Statute })),
)
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
      <a className="skip-link" href="#memo">
        {skipLink}
      </a>
      <main>
        <Hero />
        <Pincer />

        <Deferred {...section('signal')}>
          <Signal />
        </Deferred>

        <Deferred {...section('route')}>
          <RouteTheRecord />
        </Deferred>

        <Deferred {...section('architecture')}>
          <Architecture />
        </Deferred>

        <Deferred {...section('calibrate')}>
          <Calibrate />
        </Deferred>

        <Deferred {...section('regimes')}>
          <Regimes />
        </Deferred>

        <Deferred {...section('ask')}>
          <Statute />
        </Deferred>

        <TakeItToYourGC />

        <Colophon />
      </main>
    </>
  )
}
