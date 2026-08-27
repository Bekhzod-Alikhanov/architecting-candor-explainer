/**
 * 00 — The memo.
 *
 * Opens cold on the artifact, not the abstract. Then the turn.
 *
 * Sourcing note: the Pinto memorandum is described, never reconstructed.
 * Presenting a facsimile of a real document would be manufacturing a record,
 * which is the opposite of what this paper argues for. The only artifact
 * rendered on this page is the synthetic incident record below, and it is
 * labelled as simulated.
 */

/** One field of the automatically captured record. */
export interface TelemetryField {
  readonly key: string
  readonly value: string
  /** Marked fields are the ones the exhibit reading leans on. */
  readonly loadBearing?: boolean
}

export const rubric = {
  publisher: 'Arcadia Impact · AI Governance Taskforce',
  season: 'Summer 2026',
} as const

/** The stamp in the corner of the exhibit, which is a legal marking. */
export const exhibitLegend = 'Confidential'

export const memo = {
  section: '00',
  eyebrow: 'The memo',

  /** The display headline. This is the thesis. */
  headline: 'The record gets written either way.',

  /** The Pinto passage. Paraphrase with attribution; no facsimile. */
  pinto: [
    'The American legal system has a long memory for internal corporate candour.',
    'In the litigation that followed the Ford Pinto, a car whose rear-mounted fuel tank was prone to rupture in rear-end collisions, an internal cost-benefit memorandum surfaced in which the company appeared to weigh the projected cost of settling burn-death claims against the per-unit cost of a safer tank.',
    'The lesson corporate counsel drew from it has proved durable and perverse. It taught a generation of lawyers that the gravest danger lay in writing the trade-offs down.',
  ],
  pintoCite: 'Grimshaw v. Ford Motor Co. (1981) · paper, Executive Summary I',

  /** The turn. It should land hard. */
  turn: {
    lead: 'Half a century later, the bind is the same, with one difference that changes everything.',
    strike: 'AI developers cannot decline to write things down.',
    follow:
      'Their systems generate the operational record automatically, and European regulation makes safety documentation an affirmative legal duty. Meanwhile American courts are reclassifying those systems as products, the doctrine under which internal records carry their greatest evidentiary weight. The memo now writes itself.',
  },

  /** The double reading. Same event, two document systems. */
  record: {
    heading: 'One record. Two readings.',
    standfirst:
      'Below is a single incident record. On the left, the system that produced it. On the right, the system that will read it in court. Nothing has been added or removed between them. Drag the seam.',

    consoleLabel: 'Channel One · captured in the ordinary course',
    docLabel: 'Plaintiff exhibit',

    /** The engineering reading: measurement language, not fault language. */
    telemetry: [
      { key: 'event', value: 'output.served', loadBearing: false },
      { key: 'timestamp', value: '2026-07-14T14:22:07.331Z', loadBearing: true },
      { key: 'session', value: 'a9f1c2', loadBearing: true },
      { key: 'model', value: 'asst-4.2', loadBearing: false },
      { key: 'policy_version', value: '2026.07.3', loadBearing: true },
      { key: 'clf_confidence', value: '0.31', loadBearing: true },
      { key: 'deploy_threshold', value: '0.60', loadBearing: true },
      { key: 'guardrail', value: 'fired +1.842s', loadBearing: true },
      { key: 'retrieval', value: '4 documents', loadBearing: false },
      { key: 'tool_calls', value: '1', loadBearing: false },
      { key: 'store', value: 'append-only', loadBearing: false },
    ] as const satisfies readonly TelemetryField[],

    telemetryFoot: 'measurement language, not fault language',

    /** The legal reading. The same facts, in the register of a produced exhibit. */
    exhibitNo: 'EXHIBIT 14',
    exhibitBates: 'ARC-000412',
    exhibitLegend: 'Produced in the ordinary course of business',
    exhibitBody:
      'At 14:22:07 on 14 July 2026 the system served the output at issue in session a9f1c2. The safety classifier scored that output at 0.31 against a deployment threshold of 0.60. The guardrail activated 1.842 seconds after the output had already been served. The routing was governed by policy version 2026.07.3.',
    exhibitPurpose: 'Offered to establish notice, threshold, and the interval.',

    /** The caption is the argument. */
    caption:
      'The firm does not get to choose which reading applies. It wrote the left column automatically and it will be handed the right one by opposing counsel.',

    /** Shown instead of the drag instruction where the two readings stack. */
    standfirstStacked: 'Both readings are shown in full below.',
    dragInstruction: 'Drag the seam.',
    seamLabel: 'Divide the record between the engineering reading and the exhibit reading',
  },

  /** What the reader is about to do. */
  onward: {
    label: 'What follows',
    body: 'Ten sections, numbered because the argument is a sequence. The first three set out the bind. The fourth hands you the mechanism and asks you to run it. Nothing here is legal advice.',
    cta: 'Begin with the pincer',
  },
} as const
