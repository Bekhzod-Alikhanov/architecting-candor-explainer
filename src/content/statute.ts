/**
 * 07 — The ask.
 *
 * The four statutory principles from §4.2.2, stated plainly. The second is
 * interactive: each protection can be switched off, and the interface says what
 * breaks. Those consequences are the paper's own reasoning, not invention.
 */

export interface Principle {
  readonly n: string
  readonly title: string
  readonly body: string
  readonly cite?: string
}

export const principles: readonly Principle[] = [
  {
    n: '01',
    title: 'Protection attaches only to a defined process',
    body: 'The statute should authorise certified non-enforcement AI safety organizations to receive sanitized incident reports derived from the three channels, without making participation in that safety-sharing process a basis for compelling otherwise protected internal deliberations among legal, engineering and safety teams. Protection follows the workflow, exactly as it does under the healthcare model, rather than following a label attached after an adverse event.',
  },
  {
    n: '02',
    title: 'Predictable rules on discovery, admissibility, preemption and waiver',
    body: 'Authentic candour depends on predictable limits on adverse use, a principle the Supreme Court has long treated as a prerequisite to the attorney-client privilege itself. Because liability exposure is the driving force behind suppression, the act of reporting through the authorised process cannot itself supply prima facie evidence of a defect or of negligence in design.',
    cite: 'Upjohn Co. v. United States (1981)',
  },
  {
    n: '03',
    title: 'Raw Channel One telemetry stays discoverable',
    body: 'Just as the healthcare model leaves original medical records discoverable, the raw factual telemetry collected in the first channel should remain reachable by injured parties and by regulators. This is not a concession the design tolerates; it is the condition that makes the rest of it legitimate, and the reason a firm can credibly say its privileged channel holds judgment rather than concealed facts.',
  },
  {
    n: '04',
    title: 'The certified organization converts private learning into a commons',
    body: 'The receiving organization should de-identify submissions, aggregate cross-firm patterns, issue urgent hazard notices where warranted, share pattern-level findings with participating firms and government safety authorities, and publish periodic findings. That obligation turns each firm’s private learning into an industry-wide safety commons, which no market incentive produces on its own, and it anchors the statute in the separation of recipient from enforcer on which every analog regime rests.',
  },
]

/** The four protections inside principle two, and what fails without each. */
export interface Protection {
  readonly id: string
  readonly name: string
  readonly holds: string
  readonly breaks: string
}

export const protections: readonly Protection[] = [
  {
    id: 'nondiscovery',
    name: 'Nondiscoverability',
    holds:
      'Material transmitted through the authorised safety-sharing process cannot be compelled from the firm in civil discovery.',
    breaks:
      'Reporting becomes the cheapest possible route to a firm’s internal analysis. A plaintiff who could not reach the deliberation directly simply requests whatever was shared, and every participant learns to share less.',
  },
  {
    id: 'inadmissibility',
    name: 'Inadmissibility',
    holds:
      'Even where the material is obtained, it cannot be put to a jury to prove defect or negligence.',
    breaks:
      'The report itself becomes the exhibit. A firm that participated candidly hands the opposing party a document written in the register of self-criticism, and a firm that participated minimally hands over nothing worth reading.',
  },
  {
    id: 'preemption',
    name: 'Preemption of contrary state law',
    holds:
      'The federal protection survives contact with state discovery rules and state tort law, as the healthcare model does.',
    breaks:
      'The protection means whatever each of fifty states decides it means. A national developer cannot rely on it anywhere, so it plans around the least protective forum, which is the same as having no protection at all.',
  },
  {
    id: 'nonwaiver',
    name: 'Non-waiver',
    holds:
      'Bounded deliberative analysis does not lose protection merely because it also informed a mandatory regulatory report or an authorised safety-sharing submission.',
    breaks:
      'Compliance and candour become mutually exclusive. Filing the report that the EU AI Act requires would waive protection over the analysis that produced it, so a firm must choose between its regulatory duty and its privilege — which is the documentation paradox rebuilt inside the statute meant to resolve it.',
  },
]

export const statuteCopy = {
  section: '07',
  eyebrow: 'The ask',
  headline: 'The architecture can be built now. What it cannot do is travel.',
  standfirst:
    'Every comparative regime in the previous section rests on a statute. This one does not, and the three-channel structure works only inside a single firm. Legislation would let what a firm learns move safely beyond it, so that one company’s incident can inform safety across the industry. The paper asks for four things.',
  interactiveLead:
    'The second principle is four separate protections, and it fails if any one of them is missing. Switch them off and see.',
  onLabel: 'In force',
  offLabel: 'Removed',
  breaksLabel: 'What breaks',
  allOffTitle: 'Nothing is left to rely on.',
  allOffBody:
    'With all four gone, the authorised process is a route by which a firm’s most candid internal analysis reaches its opponents faster than discovery would have carried it. No rational general counsel would let their firm participate, and the statute would produce less safety information than the voluntary architecture it was meant to extend.',
  intactTitle: 'All four in force.',
  intactBody:
    'This is the configuration the paper asks for. It is narrow: it protects a defined process, leaves the underlying facts reachable, and buys candour with predictability rather than with secrecy.',
} as const

export const statuteArgues = {
  label: 'What the ask argues',
  body: [
    'Nothing in this legislation would shield a fact. Raw telemetry stays discoverable to injured parties and to regulators, which is the third principle and the one that makes the other three defensible. What the statute protects is a bounded evaluative process, and what it buys with that protection is the ability to move safety findings between firms without each transfer becoming an act of self-incrimination.',
    'The paper is careful about the order. Legislation is not a prerequisite to the internal benefits of the three-channel approach, and a firm that waits for Congress before building the architecture has misread the argument. Codification does something the architecture alone cannot: it converts a private discipline into public infrastructure, and turns one firm’s expensive lesson into an industry-wide safety commons that no market incentive produces on its own.',
  ],
} as const
