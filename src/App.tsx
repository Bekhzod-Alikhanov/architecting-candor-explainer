import { lazy } from 'react'
import { Hero } from './modules/hero/Hero'
import { Pincer } from './modules/pincer/Pincer'
import { Colophon } from './modules/colophon/Colophon'
import { Deferred } from './components/Deferred'

/**
 * The nine sections, in order, because the argument is a sequence.
 *
 * 00 and 01 are eager: they are the opening argument and they are above or near
 * the fold. Everything from 02 to 08 is its own chunk, mounted as the reader
 * approaches it. 09 is small and stays eager so the citation is always present.
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
const TakeItToYourGC = lazy(() =>
  import('./modules/gc/TakeItToYourGC').then((m) => ({ default: m.TakeItToYourGC })),
)

export function App() {
  return (
    <>
      <a className="skip-link" href="#memo">
        Skip to content
      </a>
      <main>
        <Hero />
        <Pincer />

        <Deferred id="signal" n="02" title="Where the signal dies" seq={3}>
          <Signal />
        </Deferred>

        <Deferred id="route" n="03" title="Route the record" seq={4}>
          <RouteTheRecord />
        </Deferred>

        <Deferred id="architecture" n="04" title="The architecture, operable" seq={5}>
          <Architecture />
        </Deferred>

        <Deferred id="calibrate" n="05" title="Calibrate the tripwire" seq={6}>
          <Calibrate />
        </Deferred>

        <Deferred id="regimes" n="06" title="Four regimes, one logic" seq={7}>
          <Regimes />
        </Deferred>

        <Deferred id="ask" n="07" title="The ask" seq={8}>
          <Statute />
        </Deferred>

        <Deferred id="gc" n="08" title="Take it to your GC" seq={9}>
          <TakeItToYourGC />
        </Deferred>

        <Colophon />
      </main>
    </>
  )
}
