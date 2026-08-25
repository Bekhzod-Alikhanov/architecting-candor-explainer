import { Hero } from './modules/hero/Hero'
import { Pincer } from './modules/pincer/Pincer'
import { RouteTheRecord } from './modules/route/RouteTheRecord'
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
        <RouteTheRecord />
        <Colophon />
      </main>
    </>
  )
}
