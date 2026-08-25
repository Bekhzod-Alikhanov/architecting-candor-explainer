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
