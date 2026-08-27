import { mulberry32 } from './prng'
import {
  dimensions,
  stream,
  defensibility,
  type DefensibilityBand,
  type DimensionId,
} from '../content/thresholds'

/**
 * The tripwire.
 *
 * A simulated quarter of events, generated deterministically, evaluated against
 * the reader's bands. Every event carries a hidden classification — genuine
 * signal, near miss, or noise — which is what makes "signals missed" meaningful
 * rather than circular.
 */

export type EventClass = 'signal' | 'nearMiss' | 'noise'

export interface StreamEvent {
  readonly i: number
  /** Position through the quarter, 0–1, for the chart. */
  readonly t: number
  readonly klass: EventClass
  readonly values: Readonly<Record<DimensionId, number>>
  /** The dimension that runs highest, for display. */
  readonly peak: DimensionId
  readonly peakValue: number
}

export interface Settings {
  readonly levels: Readonly<Record<DimensionId, number>>
  readonly loggingTier: boolean
  /** How far beneath the review band the logging band sits, in trip-level points. */
  readonly loggingOffset: number
}

export type Disposition = 'escalated' | 'logged' | 'uncaptured'

export interface Evaluated {
  readonly event: StreamEvent
  readonly disposition: Disposition
}

export interface Readout {
  readonly events: readonly Evaluated[]
  readonly escalations: number
  readonly nearMissTotal: number
  readonly nearMissCaptured: number
  readonly signalTotal: number
  readonly signalsMissed: number
  readonly band: DefensibilityBand
  readonly bandCopy: (typeof defensibility)[DefensibilityBand]
}

/** Skew a uniform draw toward zero. Higher power means quieter noise. */
function skew(u: number, power: number): number {
  return u ** power * 100
}

/**
 * Generated once and cached. The stream does not depend on the reader's
 * settings: the same quarter of traffic is evaluated against whatever bands
 * they choose, which is the only way the comparison means anything.
 */
let cached: readonly StreamEvent[] | null = null

export function generateStream(): readonly StreamEvent[] {
  if (cached) return cached
  const rand = mulberry32(stream.seed)
  const events: StreamEvent[] = []

  for (let i = 0; i < stream.count; i++) {
    const roll = rand()
    const klass: EventClass = roll < 0.045 ? 'signal' : roll < 0.185 ? 'nearMiss' : 'noise'

    // Signals and near misses run hot on one or two dimensions rather than all
    // of them, which is what makes a single-cutoff band miss things.
    const hotCount = klass === 'signal' ? 2 : klass === 'nearMiss' ? 1 : 0
    const hot = new Set<DimensionId>()
    while (hot.size < hotCount) {
      const d = dimensions[Math.floor(rand() * dimensions.length)]
      if (d) hot.add(d.id)
    }

    // Ranges matter more than they look. A dimension is compared against its
    // own band, and an event trips if ANY of seven dimensions crosses, so
    // ordinary traffic has to sit clearly below the bands or the max of seven
    // draws trips almost everything and the instrument says nothing.
    //
    //   noise      0–26   quiet enough that a review band never sees it
    //   near miss  26–52  under most review bands, over the logging band
    //   signal     64–100 over every review band a firm would plausibly set
    const values = {} as Record<DimensionId, number>
    for (const d of dimensions) {
      if (hot.has(d.id)) {
        values[d.id] = klass === 'signal' ? 64 + rand() * 36 : 26 + rand() * 26
      } else {
        values[d.id] = skew(rand(), 2) * 0.26
      }
    }

    let peak: DimensionId = dimensions[0]!.id
    let peakValue = -1
    for (const d of dimensions) {
      const v = values[d.id]
      if (v > peakValue) {
        peakValue = v
        peak = d.id
      }
    }

    events.push({ i, t: i / (stream.count - 1), klass, values, peak, peakValue })
  }

  cached = events
  return events
}

function dispositionOf(event: StreamEvent, settings: Settings): Disposition {
  for (const d of dimensions) {
    if (event.values[d.id] >= settings.levels[d.id]) return 'escalated'
  }
  if (settings.loggingTier) {
    for (const d of dimensions) {
      const logBand = Math.max(0, settings.levels[d.id] - settings.loggingOffset)
      if (event.values[d.id] >= logBand) return 'logged'
    }
  }
  return 'uncaptured'
}

function bandFor(escalations: number): DefensibilityBand {
  if (escalations === 0) return 'none'
  if (escalations <= 5) return 'narrow'
  if (escalations <= 35) return 'strong'
  return 'weak'
}

export function evaluate(settings: Settings): Readout {
  const events = generateStream().map((event) => ({
    event,
    disposition: dispositionOf(event, settings),
  }))

  const escalations = events.filter((e) => e.disposition === 'escalated').length
  const nearMisses = events.filter((e) => e.event.klass === 'nearMiss')
  const signals = events.filter((e) => e.event.klass === 'signal')

  const band = bandFor(escalations)

  return {
    events,
    escalations,
    nearMissTotal: nearMisses.length,
    nearMissCaptured: nearMisses.filter((e) => e.disposition !== 'uncaptured').length,
    signalTotal: signals.length,
    signalsMissed: signals.filter((e) => e.disposition === 'uncaptured').length,
    band,
    bandCopy: defensibility[band],
  }
}
