/**
 * Provenance marks.
 *
 * Three states, so a reader can always tell which they are looking at, on the
 * screen that shows it rather than in a footnote:
 *
 *   simulated    — synthetic data written for this page
 *   illustrative — a numeric value the paper does not supply
 *   paper        — traceable to the source, with a section reference
 *
 * Each variant carries a text label and a distinct fill treatment, so meaning
 * never rests on hue alone.
 */

export type ProvKind = 'simulated' | 'illustrative' | 'paper'

const LABEL: Record<ProvKind, string> = {
  simulated: 'Simulated',
  illustrative: 'Illustrative',
  paper: 'From the paper',
}

const EXPLAIN: Record<ProvKind, string> = {
  simulated: 'Synthetic data written for this page. Not drawn from any real firm, product or matter.',
  illustrative: 'The paper does not supply a value here. This number is illustrative only.',
  paper: 'Traceable to Architecting Candor.',
}

export interface ProvProps {
  readonly kind: ProvKind
  /** For `paper`, the section or page reference. Shown after the label. */
  readonly cite?: string
  /** Overrides the default label where a screen needs to be more specific. */
  readonly label?: string
  readonly className?: string
}

export function Prov({ kind, cite, label, className = '' }: ProvProps) {
  const text = label ?? LABEL[kind]
  return (
    <span
      className={`prov prov--${kind} ${className}`.trim()}
      title={EXPLAIN[kind]}
    >
      <Glyph kind={kind} />
      <span>
        {text}
        {cite ? <span className="opacity-80">{` · ${cite}`}</span> : null}
      </span>
    </span>
  )
}

/** A distinct shape per kind, so the mark is legible without colour. */
function Glyph({ kind }: { readonly kind: ProvKind }) {
  if (kind === 'simulated') {
    return (
      <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
        <path d="M0 7 7 0M2 9 9 2" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </svg>
    )
  }
  if (kind === 'illustrative') {
    return (
      <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
        <circle cx="4.5" cy="4.5" r="3.6" stroke="currentColor" strokeWidth="1.2" fill="none" strokeDasharray="2 1.6" />
      </svg>
    )
  }
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
      <rect x="0.6" y="0.6" width="7.8" height="7.8" rx="1" fill="currentColor" />
    </svg>
  )
}
