/**
 * 04 — The architecture, operable.
 *
 * Figure 1 is not a picture here. The reader picks up an object and tries to
 * move it, and the valve answers. Every refusal states a doctrinal reason.
 *
 * The object texts are simulated, continuing the incident from section 03.
 * The rules are not: they are the paper's, from §1.2 and §3.2.2.
 */

export type NodeId =
  | 'one'
  | 'one-overwrite'
  | 'two'
  | 'three'
  | 'dashboard'
  | 'public'
  | 'regulator'

export interface ChannelNode {
  readonly id: NodeId
  readonly name: string
  readonly sub: string
  readonly body: string
  /** Its status in discovery, stated on the node itself. */
  readonly status: string
  readonly authority?: string
  /** Inside the architecture, or a surface outside it. */
  readonly side: 'channel' | 'outward'
}

export const nodes: readonly ChannelNode[] = [
  {
    id: 'one',
    name: 'Channel One',
    sub: 'The factual record',
    body: 'System state, model outputs, evaluation scores, drift metrics and guardrail activations, captured contemporaneously by instrumentation. Measurement language, not fault language.',
    status: 'Discoverable by design',
    authority: 'Upjohn Co. v. United States (1981)',
    side: 'channel',
  },
  {
    id: 'one-overwrite',
    name: 'The pre-remediation state',
    sub: 'Append-only storage',
    body: 'The snapshot of the system as it stood before anything was changed. Written to storage the inference system itself cannot alter.',
    status: 'No channel permits deletion',
    authority: 'Fed. R. Civ. P. 37(e)',
    side: 'channel',
  },
  {
    id: 'two',
    name: 'Channel Two',
    sub: 'Privileged legal analysis',
    body: 'Counsel and the safety review function jointly conduct root-cause analysis, weigh conditional risk against total risk across the deployed life of the system, and develop legal advice on remediation. Outside evaluators may enter as agents of counsel where their work is genuinely necessary to that advice.',
    status: 'Attorney-client and work product',
    authority: 'United States v. Kovel (1961)',
    side: 'channel',
  },
  {
    id: 'three',
    name: 'Channel Three',
    sub: 'The remediation record',
    body: 'Regression tests, engineering changes and process revisions, recorded in operational imperatives and stripped of the causal and normative reasoning that produced them.',
    status: 'Subsequent remedial measure',
    authority: 'Fed. R. Evid. 407',
    side: 'channel',
  },
  {
    id: 'dashboard',
    name: 'Engineering dashboard',
    sub: 'Operational surface',
    body: 'What the on-call engineer sees. An ordinary-course business record like any other.',
    status: 'Discoverable',
    side: 'outward',
  },
  {
    id: 'regulator',
    name: 'Regulator-facing report',
    sub: 'Serious-incident reporting',
    body: 'A factual account assembled from Channel One, satisfying reporting duties without generating causal assessments of purported harm.',
    status: 'Disclosed to the regulator',
    side: 'outward',
  },
  {
    id: 'public',
    name: 'Public communication',
    sub: 'External statement',
    body: 'Anything the firm says outside the privileged circle.',
    status: 'Disclosure may waive privilege',
    side: 'outward',
  },
]

export interface FlowRule {
  readonly to: NodeId
  readonly title: string
  readonly reason: string
  readonly authority?: string
}

export interface FlowObject {
  readonly id: string
  readonly label: string
  readonly text: string
  readonly home: NodeId
  readonly kind: 'fact' | 'instruction' | 'conclusion' | 'verification' | 'test'
  readonly allow: readonly FlowRule[]
  /** Named refusals the reader should meet. Anything else falls to defaultRefusal. */
  readonly refuse: readonly FlowRule[]
  readonly defaultRefusal: Omit<FlowRule, 'to'>
}

export const objects: readonly FlowObject[] = [
  {
    id: 'fact',
    label: 'A system-state fact',
    text: 'clf_confidence=0.31 against deploy_threshold=0.60, session a9f1c2, guardrail fired +1.842s',
    home: 'one',
    kind: 'fact',
    allow: [
      {
        to: 'two',
        title: 'Facts flow inward.',
        reason:
          'Channel One facts may enter the privileged channel so counsel and safety engineers can assess them. Nothing about that entry makes the fact privileged: the copy in Channel One stays exactly where it was, and stays discoverable.',
        authority: 'Upjohn Co. v. United States (1981)',
      },
      {
        to: 'three',
        title: 'A measurement may be cited in a work order.',
        reason:
          'A remediation ticket records the observed metric and window it responds to. That is measurement language, and it belongs there.',
      },
      {
        to: 'dashboard',
        title: 'Telemetry belongs on the dashboard.',
        reason:
          'This is the ordinary operational use of the first channel. It was always going to be a business record.',
      },
      {
        to: 'regulator',
        title: 'The report is built from these facts.',
        reason:
          'A regulator-facing factual report is assembled from Channel One and nothing else, which is how a reporting duty is satisfied without generating a causal assessment of purported harm.',
      },
    ],
    refuse: [],
    defaultRefusal: {
      title: 'Not a destination for raw session data.',
      reason:
        'The fact itself is not legally hazardous, but a public statement is not where an individual user’s session record goes.',
    },
  },
  {
    id: 'causal',
    label: 'A causal conclusion',
    text: '“The late guardrail activation caused the harm described in the user’s report.”',
    home: 'two',
    kind: 'conclusion',
    allow: [],
    refuse: [
      {
        to: 'three',
        title: 'The valve refuses.',
        reason:
          'Mixing a lawyer’s causal assessment into a discoverable engineering ticket risks defeating or waiving the privilege that protected it. A work order says what to change. It does not say why the change is owed.',
      },
      {
        to: 'dashboard',
        title: 'The valve refuses.',
        reason:
          'An operational dashboard is an ordinary-course business record. A causal conclusion placed there is produced with everything else on it, and the protection is simply gone.',
      },
      {
        to: 'regulator',
        title: 'The valve refuses.',
        reason:
          'The regulator-facing report is assembled from Channel One facts. Routing counsel’s causal analysis into a mandatory report exposes the analysis and overstates what the record actually establishes.',
      },
      {
        to: 'one',
        title: 'The valve refuses.',
        reason:
          'Channel One holds what the system did, not what the event means. A causal conclusion written there is an ordinary-course record and is produced, and a causal explanation recorded in the moment of observation is rarely supported by controlled evidence anyway.',
      },
      {
        to: 'public',
        title: 'The valve refuses.',
        reason:
          'A public statement of cause is a waiver as to that subject and an admission in its own right.',
      },
    ],
    defaultRefusal: {
      title: 'The valve refuses.',
      reason:
        'Causal conclusions, fault characterisations and litigation assessments do not cross outward.',
    },
  },
  {
    id: 'fault',
    label: 'A fault characterisation',
    text: '“The safety architecture was at fault, and the April finding should have been actioned before release.”',
    home: 'two',
    kind: 'conclusion',
    allow: [],
    refuse: [
      {
        to: 'dashboard',
        title: 'The valve refuses.',
        reason:
          'This imports a subjective admission of harm into a record that will be produced. The same event recorded as a timestamp, a session identifier, a classifier score against its deployment threshold and a policy version is an instrument measurement instead.',
      },
      {
        to: 'three',
        title: 'The valve refuses.',
        reason:
          'A ticket carrying a fault characterisation creates a separate statement that may remain admissible even where Rule 407 excludes the remedial measure itself.',
        authority: 'Fed. R. Evid. 407',
      },
      {
        to: 'one',
        title: 'The valve refuses.',
        reason:
          'The first channel is the one place the firm can point to and say it recorded what happened without characterising it. Putting fault language here forfeits that.',
      },
    ],
    defaultRefusal: {
      title: 'The valve refuses.',
      reason: 'Fault characterisation does not leave the privileged channel in any direction.',
    },
  },
  {
    id: 'exposure',
    label: 'A litigation assessment',
    text: '“Estimated exposure arising from the incident and from the open April finding, with advice on the order of remediation.”',
    home: 'two',
    kind: 'conclusion',
    allow: [],
    refuse: [
      {
        to: 'public',
        title: 'The valve refuses.',
        reason:
          'Disclosure outside the privileged circle waives the privilege as to that subject. There is no partial version of this.',
      },
      {
        to: 'three',
        title: 'The valve refuses.',
        reason:
          'An exposure estimate in a remediation ticket is the clearest possible evidence that the ticket was written for legal reasons, which is the argument that pierced privilege in the cybersecurity cases.',
        authority: 'In re Capital One (2020)',
      },
      {
        to: 'dashboard',
        title: 'The valve refuses.',
        reason:
          'A dashboard is read by people outside the privileged circle and is produced in discovery. Both facts are fatal to the claim.',
      },
    ],
    defaultRefusal: {
      title: 'The valve refuses.',
      reason:
        'The liability assessment is the most protected thing in the architecture, and the only thing in it that depends on legal protection to exist at all.',
    },
  },
  {
    id: 'instruction',
    label: 'A bounded operational instruction',
    text: 'Add a regression test for slice health_advice_longform at confidence < 0.35. Lower deploy_threshold on this slice to 0.75. Owner: platform-safety.',
    home: 'two',
    kind: 'instruction',
    allow: [
      {
        to: 'three',
        title: 'This is what the second channel is permitted to return.',
        reason:
          'A bounded operational instruction, stripped of the causal and normative reasoning that produced it. Note what is absent: no cause, no fault, no exposure. Just what to change and how completion will be demonstrated.',
        authority: 'Fed. R. Evid. 407',
      },
    ],
    refuse: [
      {
        to: 'public',
        title: 'The valve refuses.',
        reason:
          'The instruction itself is bounded, but publishing it invites the inference the architecture exists to avoid, and it is not a communication the second channel is authorised to make.',
      },
    ],
    defaultRefusal: {
      title: 'Not a destination for a work order.',
      reason: 'A bounded instruction returns to the remediation channel, not elsewhere.',
    },
  },
  {
    id: 'preserve',
    label: 'A preservation and suspension order',
    text: 'Preserve all evidence for session a9f1c2 and the surrounding window. Suspend deployment on the affected slice pending evaluation.',
    home: 'two',
    kind: 'instruction',
    allow: [
      {
        to: 'three',
        title: 'Permitted, and often urgent.',
        reason:
          'Preserving evidence, suspending a deployment and running a specified evaluation are exactly the bounded operational instructions the second channel may return.',
        authority: 'Fed. R. Civ. P. 37(e)',
      },
      {
        to: 'dashboard',
        title: 'Permitted.',
        reason:
          'A suspension has to reach the people who operate the system. It states what to do, and not why.',
      },
      {
        to: 'regulator',
        title: 'Permitted.',
        reason:
          'Preparing a regulator-facing factual report is one of the instructions the paper names, and the report itself is drawn from Channel One.',
      },
    ],
    refuse: [],
    defaultRefusal: {
      title: 'Not a destination for an operational order.',
      reason: 'The order goes to the people who will carry it out.',
    },
  },
  {
    id: 'verification',
    label: 'The fact of a completed change',
    text: 'Change SAFE-2291 deployed 2026-08-02 and verified: threshold on the affected slice now 0.75.',
    home: 'three',
    kind: 'verification',
    allow: [
      {
        to: 'one',
        title: 'The third channel may enrich the first.',
        reason:
          'The fact and the verification of a completed change are appended to the factual record. The record grows; nothing in it is replaced.',
      },
    ],
    refuse: [
      {
        to: 'one-overwrite',
        title: 'The append-only store refuses.',
        reason:
          'Channel Three may add the fact of a completed change. It may not overwrite the pre-remediation state. The system as it stood before the fix is the evidence of what the fix was for, and no channel in this architecture permits deletion.',
        authority: 'Fed. R. Civ. P. 37(e)',
      },
    ],
    defaultRefusal: {
      title: 'Not a destination for a verification record.',
      reason: 'The verification belongs in the factual record, appended.',
    },
  },
  {
    id: 'regression',
    label: 'A permanent regression test',
    text: 'Standing test: slice health_advice_longform must not serve an output below confidence 0.35 without guardrail activation preceding it.',
    home: 'three',
    kind: 'test',
    allow: [
      {
        to: 'one',
        title: 'The loop closes here.',
        reason:
          'Each resolved incident yields a permanent test that sharpens the very monitoring that failed to detect the problem. The next occurrence trips a threshold instead of reaching a user, and the calibration improves with each incident the firm survives.',
      },
    ],
    refuse: [],
    defaultRefusal: {
      title: 'Not a destination for a regression test.',
      reason: 'The test returns to the monitoring layer, which is where it does its work.',
    },
  },
]

/** The four arrows on the diagram. Each says what it is and why it runs that way. */
export const arrows = [
  {
    id: 'facts-in',
    from: 'one',
    to: 'two',
    label: 'facts in, one way',
    title: 'Facts enter the privileged channel for analysis',
    reason:
      'Counsel cannot advise on an incident without knowing what the system did. The facts travel inward and are analysed there, and the analysis is what the privilege protects. The facts themselves never become privileged, because privilege protects communications and never the underlying facts.',
    authority: 'Upjohn Co. v. United States (1981)',
  },
  {
    id: 'order-out',
    from: 'two',
    to: 'three',
    label: 'work order out',
    title: 'A bounded instruction returns to engineering',
    reason:
      'Once the protected analysis is complete, counsel’s advice leaves as remedial requirements: regression tests, monitoring threshold adjustments, guardrail modifications, training data exclusions. It leaves stripped of the causal and normative reasoning that produced it. That stripping is the valve.',
  },
  {
    id: 'append',
    from: 'three',
    to: 'one',
    label: 'append, never overwrite',
    title: 'Remediation enriches the factual record',
    reason:
      'The third channel writes back the fact and the verification of a completed change, so the factual record shows both the original condition and the fix. It cannot overwrite the pre-remediation state, because that state is the evidence the fix was needed.',
    authority: 'Fed. R. Civ. P. 37(e)',
  },
  {
    id: 'loop',
    from: 'three',
    to: 'one',
    label: 'the loop',
    title: 'Each incident sharpens the monitoring that missed it',
    reason:
      'A regression test preserves the lesson of an incident in a form every subsequent release must satisfy. It also improves the thresholds on which the second channel’s recurrence estimates depend, so the tripwire gets better calibrated with every incident the firm actually resolves.',
  },
] as const

/** Stated plainly on the surface, because these are the load-bearing claims. */
export const plainly = [
  'Only the second channel depends on legal protection for its existence. The first and third are written regardless.',
  'The architecture protects judgment and never facts. Channel One remains discoverable in full.',
  'No channel permits deletion.',
  'No court has yet passed on the central device, though no legal barrier prevents building it today.',
]

export const architectureCopy = {
  section: '04',
  eyebrow: 'The architecture, operable',
  headline: 'Pick something up and try to move it.',
  standfirst:
    'This is Figure 1 from the paper, except that it runs. Choose an object, choose a destination, and the valve will answer. Some flows are permitted and some are refused, and every refusal gives its reason.',
  objectsLabel: 'Objects',
  targetsLabel: 'Destinations',
  logLabel: 'Attempt log',
  logNote: 'Append-only, like everything else here. Your refused attempts stay on the record too.',
  logEmpty: 'Nothing attempted yet. Select an object, then choose a destination.',
  chooseObject: 'Select an object to move',
  chooseTarget: 'Now choose a destination',
  refusedBadge: 'Refused',
  allowedBadge: 'Permitted',
  scaffoldLabel: 'Guided walk through the one-way valve',
  scaffoldHint: 'Every object, every destination.',
  arrowsLabel: 'Permitted flows',
  valveIdle: 'The valve is idle. Select an object above, then choose a destination.',
  loopNote:
    'The loop is closed. The monitoring that missed this incident now carries a standing test against it.',
  overwriteAction: 'Try to overwrite it',
  outwardLabel: 'Surfaces outside the architecture',
  homeNote: 'Home of the selected object',
  sendTo: 'Send the selected object to',
} as const

export const architectureSteps = [
  {
    heading: 'Start with a fact',
    body: 'A system-state fact is selected. Send it to Channel Two. Counsel needs to know what the system did, and the fact travels inward without becoming privileged: the copy in Channel One stays where it is, and stays discoverable.',
  },
  {
    heading: 'Now try to bring a conclusion back out',
    body: 'A causal conclusion is selected. Try sending it to Channel Three, or to the dashboard, or to the regulator report. The valve refuses each one, and tells you why. This is the single rule the whole architecture turns on.',
  },
  {
    heading: 'Send back what is allowed to travel',
    body: 'A bounded operational instruction is selected. This one is permitted outward, because it says what to change without saying why the change is owed. Compare its text with the conclusion you just tried to move.',
  },
  {
    heading: 'Try to rewrite history',
    body: 'The fact of a completed change is selected. Appending it to Channel One is permitted. Overwriting the pre-remediation state is not, and the append-only store will say so.',
  },
  {
    heading: 'Over to you',
    body: 'Every object, every destination. Try the combinations you would actually argue for, and read what the valve says about each one.',
  },
] as const

export const architectureArgues = {
  label: 'What the machine argues',
  body: [
    'The valve is the whole design. Everything else in the architecture follows from a single rule: analysis may consume facts, and facts may not be replaced by analysis.',
    'Take the rule away and the three channels collapse back into one system that is either candid and exposed, or protected and useless.',
    'Notice what the machine never does. It never hides a fact, never deletes anything, and never claims protection for work the firm would have done anyway.',
    'It withholds one thing, which is the legal advice itself, and that is the thing the law has always permitted a company to withhold. The candour of the first channel is what makes the claim over the second one credible.',
  ],
} as const
