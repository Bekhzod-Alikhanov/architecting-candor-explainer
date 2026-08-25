/**
 * 03 — Grading copy.
 *
 * The five discovery outcomes are the ones the paper's doctrine actually
 * produces. A sixth state, "not created", is not a discovery outcome at all:
 * nothing is produced because nothing exists. It is shown separately, because
 * conflating it with suppression of an existing record would misstate both.
 */

import type { Bin } from './artifacts'

export type Outcome =
  | 'produced'
  | 'withheld'
  | 'pierced'
  | 'excluded407'
  | 'spoliation'
  | 'notCreated'

export const outcomes: Readonly<
  Record<Outcome, { label: string; short: string; glyph: string; blurb: string; adverse: boolean }>
> = {
  produced: {
    label: 'Produced',
    short: 'Produced',
    glyph: '▣',
    blurb: 'Handed to the other side. For Channel One that is the design, not a failure.',
    adverse: false,
  },
  withheld: {
    label: 'Withheld as privileged',
    short: 'Withheld',
    glyph: '◆',
    blurb: 'Privilege asserted, and the claim holds.',
    adverse: false,
  },
  pierced: {
    label: 'Privilege pierced',
    short: 'Pierced',
    glyph: '✕',
    blurb: 'Privilege asserted and defeated. The document is produced anyway, and the attempt is now on the record.',
    adverse: true,
  },
  excluded407: {
    label: 'Excluded at trial, Rule 407',
    short: '407',
    glyph: '⊘',
    blurb:
      'A qualifying subsequent remedial measure, barred from proving negligence, culpable conduct, defect or a need for warning.',
    adverse: false,
  },
  spoliation: {
    label: 'Spoliation risk',
    short: 'Spoliation',
    glyph: '⚠',
    blurb: 'Lost or never made after a preservation duty had attached.',
    adverse: true,
  },
  notCreated: {
    label: 'Never created',
    short: 'Not created',
    glyph: '—',
    blurb: 'Nothing produced, because nothing exists. The cost lands on the other scoreboard.',
    adverse: false,
  },
}

/** The caveat that must ride with every Rule 407 outcome. */
export const rule407Caveat =
  'Rule 407 limits admissibility at trial rather than discovery. The ticket is still produced; it is excluded only for those purposes, and only where the measure would have made an earlier harm less likely.'

export const spoliationAuthority = 'Fed. R. Civ. P. 37(e)'
export const spoliationReason =
  'Electronically stored information that should have been preserved in anticipation of litigation was lost. A credible claim of user harm may itself trigger the duty.'

export type FlagKind =
  | 'autoCaptured'
  | 'faultInDiscoverable'
  | 'waiverRisk'
  | 'valveViolation'
  | 'admissionSurvives'
  | 'factsRemoved'

export const flags: Readonly<Record<FlagKind, { label: string; text: string }>> = {
  autoCaptured: {
    label: 'Suppression had no effect',
    text: 'Instrumentation wrote this before anyone decided anything. Choosing not to write it down changed nothing about what gets produced.',
  },
  faultInDiscoverable: {
    label: 'Fault language in a discoverable record',
    text: 'This imports a subjective admission of harm into a record that will be produced. A timestamp, a session identifier, a classifier score against its deployment threshold and a policy version would have recorded the same event as an instrument measurement.',
  },
  waiverRisk: {
    label: 'Privilege waiver risk',
    text: 'Counsel’s assessment has been placed in an ordinary-course record. Privilege protects communications and never the underlying facts, and putting the advice itself here risks the protection entirely.',
  },
  valveViolation: {
    label: 'The one-way valve refuses this',
    text: 'A causal conclusion, fault characterisation or litigation assessment written into a discoverable remediation record risks defeating or waiving the privilege that protected it.',
  },
  admissionSurvives: {
    label: 'The admission may outlive the exclusion',
    text: 'Rule 407 may exclude the remedial measure, but the causal statement travelling inside the ticket is a separate assertion that can remain admissible even when the measure itself does not.',
  },
  factsRemoved: {
    label: 'Facts removed from engineering',
    text: 'Channel Two has bounded membership and controlled distribution. Facts filed there are no longer where the engineers who need them can reach them, and they were never privileged in the first place.',
  },
}

export const scoreboards = {
  discovery: {
    title: 'Discovery exposure',
    sub: 'A simulated plaintiff document request, run against your routing.',
    empty: 'Route the deck, then run the document request.',
  },
  remediation: {
    title: 'Remediation capability',
    sub: 'Could an engineer six months from now reconstruct the failure and write a regression test?',
    empty: 'Nothing routed yet.',
    availableLabel: 'Held where engineering can reach it',
    lostLabel: 'Lost',
  },
} as const

export const runLabel = 'Run the document request'
export const replayLabel = 'Re-route and run again'
export const revealLabel = 'Compare four strategies'

/** The four strategies, run through the same grading function as the reader's. */
export interface Strategy {
  readonly id: string
  readonly name: string
  readonly claim: string
  /** Filled in from the grader; this is what the strategy actually produces. */
  readonly lesson: string
  readonly assign: (properBin: Bin) => Bin
}

export const strategies: readonly Strategy[] = [
  {
    id: 'nothing',
    name: 'Write nothing',
    claim: 'The lesson counsel drew from the Pinto. If it is not written down, it cannot be produced.',
    lesson:
      'The telemetry a plaintiff most wants — the classifier score against its deployment threshold, and the interval before the guardrail fired — is generated automatically and produced either way. What suppression removes is everything a person wrote: the April finding that named the threshold, and the user’s account of the conditions the failure actually arose in. Without those, the raw telemetry says what happened and cannot say what to change, so no regression test gets written. It also adds a spoliation problem for the artifacts that already existed.',
    assign: () => 'none',
  },
  {
    id: 'counsel',
    name: 'Route everything through counsel',
    claim: 'Privilege is a shield. Put the whole incident under it.',
    lesson:
      'Privilege is pierced across most of the deck on the reasoning of In re Capital One, because substantially similar work would have been performed in the ordinary course. The documents are produced anyway, and the failed claim is now itself on the record. Counsel becomes a chokepoint on routine technical response, and the facts engineering needs sit inside a channel with bounded membership.',
    assign: () => 'two',
  },
  {
    id: 'one-system',
    name: 'Write everything into one system',
    claim: 'Full transparency. One record, everything in it, nothing hidden.',
    lesson:
      'Remediation is at its best, and so is exposure. Fault language and counsel’s assessments sit in discoverable tickets, and the privilege that would have protected candid analysis is waived by where it was written.',
    assign: () => 'one',
  },
  {
    id: 'three-channel',
    name: 'The three-channel routing',
    claim: 'Separate the act of observing from the act of judging, and judging from fixing.',
    lesson:
      'Remediation is preserved, the privilege claims that are made survive because entry was pre-committed rather than asserted after the fact, and remedial instructions are written in engineering language. The facts remain discoverable, which is the design.',
    assign: (properBin) => properBin,
  },
]

export const routeCopy = {
  section: '03',
  eyebrow: 'Route the record',
  headline: 'You decide where each piece of knowledge goes.',
  standfirst:
    'Two systems will grade the result, and they pull in opposite directions. One asks what a plaintiff can get. The other asks what an engineer can still fix. Nothing here marks you against a correct answer; it grades a strategy.',
  unroutedLabel: 'Unrouted',
  routedLabel: 'routed',
  keyboardHint: 'Select a card, then press 1 to 4. Or use the arrow keys and Enter.',
  binHint: 'Press 1–4 to route the selected card',
  scaffoldLabel: 'Guided walk through routing the incident record',
  listboxLabel: 'Unrouted artifacts. Use the arrow keys to select, then press 1 to 4 to route.',
  resetAnnouncement: 'Deck reset. Three instrumentation records remain in Channel One.',
  autoTitle: 'Generated by instrumentation, not by a person',
  binsLabel: 'Channels',
  queueDone:
    'All fifteen routed. Run the document request, or select a card in a channel below and press 1 to 4 to move it.',
  actionsHint:
    'still unrouted. Every artifact needs a destination, including the ones you would rather not think about.',
  yourRoutingName: 'Your routing',
  yourRoutingClaim: 'Graded by exactly the same function as the four above.',
  loopNote:
    'The loop is closed. The monitoring that missed this incident now carries a standing test against it.',
} as const

export const routeSteps = [
  {
    heading: 'Start with what you did not choose to write',
    body: 'The first three artifacts are instrumentation output: an inference event, a guardrail decision, a drift measure. No one decided to create them. They are already routed to Channel One, because that is where automatically captured facts live, discoverable by design.',
  },
  {
    heading: 'Now the ones a person wrote',
    body: 'A red-team finding from April. A user’s report of harm. An engineer’s message in the first ten minutes. These exist too, and someone must decide what happens to them. Route the rest of the deck yourself.',
  },
  {
    heading: 'Try the fourth bin',
    body: 'Do not write it down is the strategy most readers arrive believing in. Put whatever you like in it. The grader will tell you exactly what it bought you, artifact by artifact.',
  },
  {
    heading: 'Over to you',
    body: 'Route all fifteen, then run the document request. You can re-route and run again as many times as you like.',
  },
] as const

export const routeArgues = {
  label: 'What the routing game argues',
  body: [
    'The instinct the Pinto taught is not merely unhelpful now; it is close to inert. An AI system writes much of its own record automatically, so the decision not to document arrives after the document already exists. Suppression buys very little in discovery, and what it costs is the human record: the finding that named the threshold, the account of the conditions the failure arose in, the analysis that would have said what to change. The instrumentation survives and says what happened. It cannot say what to fix.',
    'What the architecture withholds is only what the law has always permitted a company to withhold, which is the legal advice itself. The facts stay discoverable. That is not a concession extracted from the design; it is the condition on which the design works, because a firm that has preserved and produced its factual record in the ordinary course can credibly say that its privileged channel holds judgment rather than concealed facts.',
  ],
} as const
