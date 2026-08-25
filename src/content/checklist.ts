/**
 * 08 — The implementation checklist.
 *
 * A one-page artifact a safety lead can hand to their general counsel. Every
 * item is something the paper actually asks a firm to do, and it prints to a
 * single page through the print stylesheet.
 */

export interface ChecklistItem {
  readonly text: string
  /** Who the paper says owns this, where it says. */
  readonly owner?: string
  readonly note?: string
}

export interface ChecklistGroup {
  readonly n: string
  readonly title: string
  readonly items: readonly ChecklistItem[]
}

export const checklist = {
  title: 'Safety Translation Layer — implementation checklist',
  subtitle:
    'Derived from Architecting Candor (Arcadia Impact AI Governance Taskforce, August 2026). One page. Take it to your general counsel.',
  printLabel: 'Print this page',
  printNote: 'Prints to one page. No network request is made.',

  groups: [
    {
      n: '01',
      title: 'Before deployment: define the bands',
      items: [
        {
          text: 'Define versioned threshold bands for severity, recurrence, vulnerable-user exposure, classifier confidence, distributional drift, critical tool use, and near misses.',
          owner: 'Safety function',
        },
        {
          text: 'Tier the bands rather than setting a single cutoff: a logging tier beneath the review tier, so near misses are captured without engaging counsel.',
          note: 'Near misses are the highest-value harm-adjacent signal and a comparatively low-liability data class. A regime designed under legal fear discards them first.',
        },
        {
          text: 'Fix the bands in advance and version them. Precommitment is what distinguishes a privilege claim a court reads as deliberate from one it reads as a reactive assertion.',
        },
        {
          text: 'Wire escalation into the instrumentation itself rather than adding it afterwards, so crossing a band opens the record automatically and no one has to decide in the moment.',
        },
      ],
    },
    {
      n: '02',
      title: 'Assign one owner per lifecycle stage',
      items: [
        { text: 'Steady-state monitoring.', owner: 'Named owner required' },
        { text: 'Threshold-trip review.', owner: 'Named owner required' },
        { text: 'Active handling.', owner: 'Named owner required' },
        { text: 'Remediation.', owner: 'Named owner required' },
        {
          text: 'Keep measurement separate from remediation: engineering corrects the system, the safety-review function maintains the evaluation sets and the system safety assessments.',
          note: 'A function accountable for both its own assessment and the later fix has a structural incentive to optimise the system against its own assessment.',
        },
        {
          text: 'Place legal adjacent to the record rather than in custody of it, so routine data governance continues independently of counsel.',
          note: 'Where the function accountable for litigation exposure controls documentation, writing less becomes that function’s rational strategy.',
        },
        {
          text: 'Assign the residual-risk determination to the board or its risk committee, stated as a severity level, a likelihood of recurrence, and a risk exposure denominator.',
          owner: 'Board or risk committee',
          note: 'A safety constraint may reduce capability, and the acceptability of that trade is not an engineering judgment.',
        },
      ],
    },
    {
      n: '03',
      title: 'Template the record',
      items: [
        {
          text: 'Make Channel One automatic, contemporaneous, schema-bound and immutable: model and deployment version, the event and its context, classifier and guardrail decisions, drift and calibration measures, and the threshold values those measurements are assessed against.',
        },
        {
          text: 'Write to append-only storage the inference system itself cannot alter, and carry provenance on every artifact: source, model version, event time, the trigger that surfaced it, the channel it sits in, and its retention and legal-hold status.',
        },
        {
          text: 'Template the remediation ticket to these fields: observed metric and window, implicated model or service, change requested, the regression test that will demonstrate completion, the owner, and the release gate.',
        },
        {
          text: 'Prohibit causal, fault and exposure language in Channel One and Channel Three records, and enforce it in tooling rather than in training.',
          note: 'Practitioners under-document when documentation is unmandated, unrewarded and separate from the workflow. The templating has to be embedded in the tools people already use.',
        },
        {
          text: 'Convert each resolved incident into a permanent regression test, so the monitoring that missed the problem carries a standing check against it.',
        },
      ],
    },
    {
      n: '04',
      title: 'Write the culture down',
      items: [
        {
          text: 'Publish a just-culture accountability standard that distinguishes inadvertent error from wilful misconduct.',
        },
        {
          text: 'State explicitly what is reportable, to whom, on what timeline, and with what protection.',
          note: 'In software teams the clarity of stated norms predicts performance substantially more strongly than psychological safety on its own.',
        },
        {
          text: 'Have leadership endorse the standard publicly, and keep the quantitative tripwire as its structural backing: an escalation that fires on an objective threshold requires no one to assess “risk” or “harm” in the moment.',
        },
      ],
    },
    {
      n: '05',
      title: 'The questions for counsel',
      items: [
        {
          text: 'Check the privilege rules in every jurisdiction the firm litigates in. State-law rules vary in the scope of corporate privilege and in when work-product protection attaches.',
          owner: 'Counsel',
        },
        {
          text: 'Check them across EU Member States too. Product Liability Directive claims proceed in national courts, where protections — including for communications with in-house counsel — vary.',
          owner: 'Counsel',
        },
        {
          text: 'Confirm the position on preservation duties: a credible claim of user harm may trigger them, and suppressing a record that already exists is a materially worse posture than producing it.',
          owner: 'Counsel',
        },
        {
          text: 'Accept that no court has yet passed on the central device. The architecture can be implemented under existing law, and its privileged channel rests on doctrine rather than on a statute written for the purpose.',
          owner: 'Counsel',
        },
      ],
    },
  ] as const satisfies readonly ChecklistGroup[],

  footer: {
    citation:
      'Celone, M. A., McGregor, S., Secret, M., Mignot, E., Bregman, N., & Alikhanov, B. (2026). Architecting Candor: Products Liability and AI Incident Knowledge Governance. Arcadia Impact AI Governance Taskforce.',
    disclaimer:
      'Nothing on this page is legal advice. Firms should consult counsel before relying on any legal principle described here.',
  },
} as const
