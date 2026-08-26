/**
 * 05 — Calibrate the tripwire.
 *
 * The seven dimensions are the paper's, named in §3.2.2. The paper supplies no
 * numeric value for any of them, so every value on this screen is illustrative
 * and is marked as such in the interface. What the paper does recommend is the
 * shape: a tiered band, with a logging tier beneath the review tier, because
 * near misses are at once the highest-value harm-adjacent safety signal and a
 * comparatively low-liability data class, and a documentation regime designed
 * under legal fear discards them first.
 *
 * The event stream is simulated and generated in the reader's browser from a
 * fixed seed.
 */

export type DimensionId =
  | 'severity'
  | 'recurrence'
  | 'vulnerable'
  | 'confidence'
  | 'drift'
  | 'toolUse'
  | 'nearMiss'

export interface Dimension {
  readonly id: DimensionId
  readonly label: string
  /** What crossing this band actually means operationally. */
  readonly meaning: string
  /** An illustrative unit reading, derived from the trip level. */
  readonly unit: (level: number) => string
  readonly defaultLevel: number
}

/**
 * Trip level runs 0–100. Higher is stricter: the band sits further out, so
 * fewer events reach it. The scale is normalised because the paper gives no
 * units, and inventing seven plausible-looking unit scales would dress an
 * illustrative number up as a finding.
 */
export const dimensions: readonly Dimension[] = [
  {
    id: 'severity',
    label: 'Severity',
    meaning: 'How grave the harm would be if the observed behaviour reached a user.',
    unit: (l) => `≥ Sev-${Math.max(1, 4 - Math.floor(l / 26))}`,
    defaultLevel: 55,
  },
  {
    id: 'recurrence',
    label: 'Recurrence',
    meaning: 'How often the same failure mode has already been observed.',
    unit: (l) => `≥ ${(l / 10).toFixed(1)} per 10k sessions`,
    defaultLevel: 55,
  },
  {
    id: 'vulnerable',
    label: 'Vulnerable-user exposure',
    meaning: 'Whether the affected sessions involve users the system should treat with more care.',
    unit: (l) => `≥ ${(l / 20).toFixed(1)}% of affected sessions`,
    defaultLevel: 45,
  },
  {
    id: 'confidence',
    label: 'Classifier confidence',
    meaning: 'How far the safety classifier fell below its deployment threshold.',
    unit: (l) => `≥ ${(l / 200).toFixed(2)} below threshold`,
    defaultLevel: 55,
  },
  {
    id: 'drift',
    label: 'Distributional drift',
    meaning: 'How far the input distribution on a named slice has moved from its baseline.',
    unit: (l) => `PSI ≥ ${(l / 250).toFixed(2)}`,
    defaultLevel: 50,
  },
  {
    id: 'toolUse',
    label: 'Critical tool use',
    meaning: 'Whether the model invoked a tool with real-world effect during the episode.',
    unit: (l) => `≥ tier ${Math.max(1, Math.ceil(l / 34))} tool`,
    defaultLevel: 60,
  },
  {
    id: 'nearMiss',
    label: 'Near misses',
    meaning: 'Guardrail activations that fired after the output had already been served.',
    unit: (l) => `≥ ${Math.max(1, Math.round(l / 12))} in the window`,
    defaultLevel: 50,
  },
]

/**
 * The paper's recommendation. The shape is the paper's: tiered, with a logging
 * tier beneath the review tier. The numbers are not, and are marked so.
 */
export const recommended = {
  levels: {
    severity: 62,
    recurrence: 58,
    vulnerable: 48,
    confidence: 58,
    drift: 54,
    toolUse: 62,
    nearMiss: 46,
  } as Readonly<Record<DimensionId, number>>,
  loggingTier: true,
  loggingOffset: 22,
  note:
    'Tiered, with a logging tier sitting well beneath the review tier. The review bands are set so counsel is engaged on a signal that is genuinely quantified and comparatively rare, while the logging tier below catches the near misses that a regime designed under legal fear would discard first.',
}

export const stream = {
  seed: 20260714,
  count: 420,
  quarterLabel: 'one quarter of production traffic',
} as const

export const calibrateCopy = {
  section: '05',
  eyebrow: 'Calibrate the tripwire',
  headline: 'Set the bands. Watch what you catch, and what you lose.',
  standfirst:
    'Channel Two opens automatically when a pre-committed threshold is crossed, and precommitment is what makes the claim defensible when a firm is acting on its own signals. Below is a simulated quarter of events. Move the bands and watch four things move against each other.',
  streamLabel: 'Simulated event stream',
  streamNote: 'Generated in your browser from a fixed seed, so the same settings always give the same numbers.',
  tierLabel: 'Tiered structure',
  tierOn: 'Logging tier active',
  tierOff: 'Logging tier collapsed',
  tierHint:
    'A logging tier sits beneath the review tier. Records that reach it are captured without engaging counsel.',
  offsetLabel: 'How far beneath the review tier',
  showRecommended: 'Show the paper’s recommended configuration',
  showRecommendedLocked: 'Move some bands first',
  recommendedShown: 'Showing the paper’s recommended shape',
  reset: 'Back to my settings',
  levelLabel: 'Trip level',
  shareLabel: 'Copy a link to this configuration',
  shareCopied: 'Link copied',
  shareNote:
    'The stream is generated from a fixed seed, so anyone opening your link sees the same quarter of events against your bands and reads the same four numbers.',
  scaffoldLabel: 'Guided walk through calibrating the telemetry tripwire',
  scaffoldHint: 'Every band, and the tier control.',
  legend: [
    'genuine signal',
    'near miss',
    'ordinary traffic',
    'escalated',
    'logged only',
    'not captured',
  ],
} as const

export const readouts = {
  escalations: {
    label: 'Escalations to counsel',
    sub: 'per quarter',
    note: 'Too many and the second channel stops looking like anticipated litigation.',
  },
  nearMisses: {
    label: 'Near misses captured',
    sub: 'of those that occurred',
    note: 'The highest-value harm-adjacent signal, and a comparatively low-liability data class. Collapse the logging tier and watch them go.',
  },
  missed: {
    label: 'Signals missed',
    sub: 'harm-relevant events that tripped nothing',
    note: 'Set the bands too high and you have reproduced normalization of deviance as a number on your own screen.',
  },
  defensibility: {
    label: 'Privilege defensibility',
    sub: 'a qualitative reading, not a score',
    note: 'How the trigger reads against the reasoning of the cybersecurity discovery disputes.',
  },
} as const

export type DefensibilityBand = 'none' | 'narrow' | 'strong' | 'weak'

export const defensibility: Readonly<
  Record<DefensibilityBand, { label: string; body: string; authority: string }>
> = {
  none: {
    label: 'Nothing to defend',
    body:
      'The channel never opens. There is no privileged analysis to protect, and no candid assessment being made anywhere in the firm.',
    authority: '',
  },
  narrow: {
    label: 'Defensible, but barely exercised',
    body:
      'A quantified trigger that almost never fires is defensible in form. It is also doing very little of the work the architecture assumes, and the analysis it was built to protect is mostly not happening.',
    authority: 'In re Target (2015)',
  },
  strong: {
    label: 'Reads as pre-committed and quantified',
    body:
      'The channel opens on an objective threshold set in advance, fires at a rate consistent with genuinely anticipated litigation, and is demonstrably separate from routine operational remediation. This is the posture that survived in the data-breach discovery disputes.',
    authority: 'In re Target (2015)',
  },
  weak: {
    label: 'Reads as routine business activity',
    body:
      'A channel that opens this often is not responding to anticipated litigation; it is how the firm processes ordinary incidents. That is the reasoning on which privilege was pierced, because substantially similar work would have been performed in the ordinary course.',
    authority: 'In re Capital One (2020)',
  },
}

export const calibrateSteps = [
  {
    heading: 'Start where a nervous firm starts',
    body: 'Every band is set high and the logging tier is collapsed. Counsel is engaged almost never, which looks safe. Look at what the other three readouts are doing.',
  },
  {
    heading: 'Now bring the review bands down',
    body: 'Escalations rise and signals missed falls. Keep going and watch privilege defensibility turn: a channel that opens constantly stops looking like anticipated litigation and starts looking like how the firm processes ordinary incidents.',
  },
  {
    heading: 'Turn the logging tier on',
    body: 'A second band beneath the review band. Records that reach it are captured without engaging counsel at all. Watch near-miss capture, and watch escalations stay where they were.',
  },
  {
    heading: 'Now collapse it again',
    body: 'One control, and the near misses go. This is the move a documentation regime designed under legal fear makes first, and it costs the firm the signal class with the best ratio of safety value to liability exposure.',
  },
  {
    heading: 'Over to you',
    body: 'Find a configuration you could defend to your own general counsel on Monday. When you have one, compare it with the shape the paper recommends.',
  },
] as const

export const calibrateArgues = {
  label: 'What the calibrator argues',
  body: [
    'There is no setting that makes all four readouts good at once, and that is the finding rather than a limitation of the model. Bands high enough to keep counsel’s involvement rare are bands high enough to miss real signals; bands low enough to catch everything turn the privileged channel into ordinary business process and forfeit the protection it exists for. The tiered structure is the only move that improves two readouts without worsening a third, because it separates the decision to capture a record from the decision to engage counsel.',
    'That separation is also what makes the trigger defensible. A threshold defined before any harm-framed record exists supplies contemporaneous timing and separation, which is the difference between a privilege claim a court reads as pre-committed and one it reads as a reactive assertion made after the firm knew it had a problem.',
  ],
} as const
