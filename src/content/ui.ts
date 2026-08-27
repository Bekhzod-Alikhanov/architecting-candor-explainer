/**
 * Cross-cutting interface copy.
 *
 * The shared components — the provenance marks, the deferred-section
 * placeholder — carry prose too, and it belongs here for the same reason every
 * other sentence on the site does: an author should be able to change any of it
 * without opening a component.
 */

export const provenance = {
  simulated: {
    label: 'Simulated',
    explain:
      'Synthetic data written for this page. Not drawn from any real firm, product or matter.',
  },
  illustrative: {
    label: 'Illustrative',
    explain: 'The paper does not supply a value here. This number is illustrative only.',
  },
  paper: {
    label: 'From the paper',
    explain: 'Traceable to Architecting Candor.',
  },
} as const

export const deferred = {
  loading: 'Loading this section.',
} as const

/** The skip link, which is the first thing a keyboard user reaches. */
export const skipLink = 'Skip to content'

/** The guided-steps component. */
export const scaffold = {
  back: 'Back',
  next: 'Next',
  released: 'Released',
} as const

/**
 * Accessible names.
 *
 * A screen-reader user hears these as prose, so they belong here with every
 * other sentence rather than inside a component. They are functions because
 * each one has to interpolate live state; scripts/read-aloud.ts calls them with
 * representative arguments so they go through the tone check like the rest.
 */
export const a11y = {
  /** The scaffold's step dots and its position readout. */
  stepDot: (n: number, heading: string) => `Step ${n}: ${heading}`,
  /** Zero-padded, because it sits in the monospace console register. */
  stepOf: (n: number, total: number) =>
    `Step ${String(n).padStart(2, '0')} of ${String(total).padStart(2, '0')}`,

  /** Route the Record. */
  routeToBin: (bin: string, key: number) =>
    `Route the selected artifact to ${bin}. Keyboard shortcut ${key}.`,
  selectCard: (kind: string, bin: string) => `Select ${kind}, currently in ${bin}`,
  returnToQueue: (kind: string) => `Return ${kind} to the queue`,
  returnedAnnouncement: (kind: string) => `${kind} returned to the queue.`,

  /** The seam's value readout, announced on every drag step. */
  seamValue: (pct: number) => `${pct}% to the engineering record`,

  /** A threshold slider's value, which must carry the illustrative caveat. */
  bandValue: (label: string, level: number, reading: string) =>
    `${label} ${level} of 100. Illustrative reading: ${reading}.`,

  /** The reclassification chart. */
  boundarySummary: (from: number, to: number, active: string | null) =>
    `The product classification boundary from ${from} to ${to}.` +
    (active ? ` Currently showing ${active}.` : '') +
    ` The full sequence is listed below the chart.`,

  /**
   * The calibrator's stream chart. This is the chart for anyone who cannot see
   * it, so it carries the same four readouts the visible chart does.
   */
  streamSummary: (r: {
    readonly events: readonly unknown[]
    readonly escalations: number
    readonly nearMissCaptured: number
    readonly nearMissTotal: number
    readonly signalsMissed: number
    readonly signalTotal: number
  }) =>
    `Simulated quarter of ${r.events.length} events plotted against your bands. ` +
    `${r.escalations} escalated to counsel, ` +
    `${r.nearMissCaptured} of ${r.nearMissTotal} near misses captured, ` +
    `${r.signalsMissed} of ${r.signalTotal} signals missed. ` +
    `The figures are repeated below the chart.`,
} as const
