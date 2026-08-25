import { Hero } from './modules/hero/Hero'
import { Pincer } from './modules/pincer/Pincer'
import { RouteTheRecord } from './modules/route/RouteTheRecord'
import { Architecture } from './modules/architecture/Architecture'
import { Calibrate } from './modules/calibrate/Calibrate'
import { Signal } from './modules/signal/Signal'
import { Regimes } from './modules/regimes/Regimes'
import { Statute } from './modules/statute/Statute'
import { TakeItToYourGC } from './modules/gc/TakeItToYourGC'
import { Colophon } from './modules/colophon/Colophon'

export function App() {
  return (
    <>
      <a className="skip-link" href="#memo">
        Skip to content
      </a>
      <main>
        <Hero />
        <Pincer />
        <Signal />
        <RouteTheRecord />
        <Architecture />
        <Calibrate />
        <Regimes />
        <Statute />
        <TakeItToYourGC />
        <Colophon />
      </main>
    </>
  )
}
