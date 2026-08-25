/**
 * 01 — The reclassification timeline.
 *
 * Every entry, date, holding and citation traces to Architecting Candor.
 * The `classification` value positions the entry on the product / not-a-product
 * axis: 1 is firmly "not a product", 0 is firmly "a product". The boundary the
 * chart draws is the line through these points, so the migration is the finding
 * rather than a decoration laid over it.
 *
 * Do not add entries the paper does not support.
 */

export interface TimelineEntry {
  readonly id: string
  /** Display date, as the paper gives it. */
  readonly date: string
  /** Fractional year, for the time scale. */
  readonly t: number
  /** For span entries, the end of the range. */
  readonly tEnd?: number
  readonly title: string
  /** Citation as the paper reports it. */
  readonly authority: string
  /** What the court or instrument did. */
  readonly holding: string
  /** What changed for a firm's internal records. This is the point. */
  readonly forRecords: string
  /** 1 = not a product, 0 = a product. */
  readonly classification: number
  /** Has not yet commenced. */
  readonly future?: boolean
}

export const axis = {
  from: 1989,
  to: 2027.4,
  topLabel: 'Not a product',
  topNote: 'Internal records rarely reached a jury, because most claims ended before discovery.',
  bottomLabel: 'A product',
  bottomNote:
    'Internal records become the central evidence of defect, notice and feasible alternative design.',
  bandLabel: 'The ground the boundary has crossed',
  bandNote:
    'Hatched: everything the line has passed over. Design choices that were once unreachable by a products claim now sit inside it, and the records describing them come with.',
} as const

export const entries: readonly TimelineEntry[] = [
  {
    id: 'winter',
    date: '1991',
    t: 1991,
    title: 'Software as a service of the mind',
    authority: "Winter v. G.P. Putnam's Sons, 938 F.2d 1033 (9th Cir. 1991)",
    holding:
      'Courts often declined to treat software’s informational content as a product, reasoning that ideas, words and information were services of the mind, akin to words on a page, and could not be defective in the way tangible goods can.',
    forRecords:
      'A developer’s design deliberations stayed internal by default. Claims were directed toward negligence, which asks whether the developer acted with reasonable care, rather than toward whether the thing itself was defective.',
    classification: 0.95,
  },
  {
    id: 'economic-loss',
    date: 'Roughly three decades',
    t: 1993,
    tEnd: 2022,
    title: 'Economic loss ends cases before discovery',
    authority: 'Choi (2019); Ramakrishnan et al. (2024)',
    holding:
      'Because traditional software disputes frequently alleged only financial or data losses, recovery was constrained by doctrines limiting recovery for purely economic loss. Negligence claims also typically required bodily injury or property damage, harms historically absent from software failures.',
    forRecords:
      'Litigation against software developers was routinely dismissed before the discovery stage at which internal records might be disclosed. Documentation carried little litigation cost, because the cases ended first. This is the period whose habits corporate counsel still carry.',
    classification: 0.88,
  },
  {
    id: 'social-media',
    date: '2023',
    t: 2023.5,
    title: 'Design features become analysable as defects',
    authority:
      'In re Social Media Adolescent Addiction/Personal Injury Products Liability Litigation, 702 F. Supp. 3d 809 (N.D. Cal. 2023)',
    holding:
      'Some American courts allowed claims alleging that platform design features can be analysed as product defects, reasoning as a matter of public policy that technology platforms are best positioned to understand and remedy the risks their designs create.',
    forRecords:
      'The discoverable set widens from what a firm said to how it built. Records about recommendation logic, age gates, guardrails and deployment configuration become relevant matter, because the claim is directed at the design of the system rather than at the content it delivers.',
    classification: 0.55,
  },
  {
    id: 'garcia',
    date: 'May 2025',
    t: 2025.39,
    title: 'Generative AI reaches products liability',
    authority: 'Garcia v. Character Technologies, Inc., No. 6:24-cv-01903 (M.D. Fla. May 21, 2025)',
    holding:
      'A federal court allowed products liability claims to proceed against Character Technologies and Google, holding that Character A.I. is a product for the purposes of the plaintiff’s product liability claims so far as those claims arise from defects in the app rather than ideas or expressions within it.',
    forRecords:
      'Internal safety research becomes probative of knowledge of the defect. The court accepted allegations resting in part on the developers’ own internal safety work, so adversarial testing findings and escalation memoranda are now material a plaintiff can use to establish notice.',
    classification: 0.3,
  },
  {
    id: 'florida',
    date: 'June 2026',
    t: 2026.42,
    title: 'A state uses the firm’s own safety policies',
    authority:
      'State of Florida v. OpenAI Global, LLC, Complaint (Fla. Cir. Ct., 10th Jud. Cir., Highlands Cnty., filed June 1, 2026)',
    holding:
      'The Florida Attorney General sued OpenAI and its chief executive, relying on the company’s internal safety records to assert design-defect, failure-to-warn and other products liability claims arising from incidents in the state.',
    forRecords:
      'The significance is evidentiary. The allegations invoke internal employee communications, alleged internal warnings, testing decisions, proposed safeguards and public representations, to support theories of notice, feasible alternative design and conscious disregard. The safety programme itself becomes the instrument.',
    classification: 0.2,
  },
  {
    id: 'pld',
    date: '9 December 2026',
    t: 2026.94,
    title: 'Software is expressly a product in the EU',
    authority: 'Directive (EU) 2024/2853, applying from 9 December 2026',
    holding:
      'The revised Product Liability Directive expressly classifies software as a product and applies to products placed on the market or put into service from this date. It also introduces a rebuttable presumption of defectiveness where a defendant fails to comply with a court-ordered disclosure of relevant evidence.',
    forRecords:
      'The incentive inverts. Until now, not having written it down was a defensive posture. Under Article 9(1), failing to produce ordered evidence can hand the claimant a presumption that the product was defective. Not having the record becomes worse than having it.',
    classification: 0.05,
    future: true,
  },
]

/** The countdown. Computed client-side against this instant. */
export const commencement = {
  /** 9 December 2026, 00:00 UTC. Stated in UTC so the figure is deterministic. */
  isoUTC: '2026-12-09T00:00:00Z',
  label: 'Directive (EU) 2024/2853 applies from',
  displayDate: '9 December 2026',
  zoneNote: 'Counted in UTC.',
  liveHeading: 'Time remaining',
  passedHeading: 'Now in force',
  passedBody:
    'The Product Liability Directive now applies to products placed on the market or put into service from 9 December 2026.',
  scope:
    'Applies to products placed on the market or put into service from this date.',
} as const

export const timelineCopy = {
  heading: 'The boundary moved. It did not move back.',
  standfirst:
    'For roughly three decades, software sat on the safe side of a line. Step through what moved it. The line you are watching is the classification itself, drawn through the decisions that moved it.',
  recordsLabel: 'What changed for a firm’s internal records',
  holdingLabel: 'What the court did',
  advanceHint: 'Use the arrow keys, or select any entry.',
  releaseLabel: 'Over to you',
  releaseBody:
    'The whole line is drawn. Select any entry to read what it changed, in either order.',
} as const

/**
 * Guided steps. Each one moves the chart's own state, and the last releases it.
 * Written so a reader who never touches a control still gets the argument.
 */
export const timelineSteps = [
  {
    heading: 'Start where counsel’s instincts were formed',
    body: 'In 1991 a court declined to treat software’s informational content as a product. The boundary sits near the top of the chart, and the territory beneath it — where a firm’s internal records are central evidence of defect — is almost empty.',
  },
  {
    heading: 'Three decades of cases ending early',
    body: 'Doctrines limiting recovery for purely economic loss, together with a requirement of bodily injury or property damage, dismissed most claims before discovery. The line barely moves. That is the point: a generation of documentation practice was built on a boundary that looked permanent.',
  },
  {
    heading: 'Design becomes analysable as defect',
    body: 'In 2023 a court allowed claims that platform design features can be analysed as product defects. Watch the line drop, and watch the territory below it grow. That territory now includes recommendation logic, age gates, guardrails and deployment configuration.',
  },
  {
    heading: 'Generative AI crosses',
    body: 'In May 2025 the reasoning reached a chatbot. The court held Character A.I. a product so far as the claims arise from defects in the app rather than ideas or expressions within it, resting in part on the developers’ own internal safety research.',
  },
  {
    heading: 'The safety record becomes the instrument',
    body: 'In June 2026 a state attorney general built design-defect and failure-to-warn claims out of a developer’s internal safety policies. The programme a firm builds to be safer is the same programme that supplies the evidence against it.',
  },
  {
    heading: 'The incentive inverts',
    body: 'From 9 December 2026 the revised Product Liability Directive expressly classifies software as a product. It also lets a court presume defectiveness where a defendant fails to comply with an order to disclose relevant evidence. Writing nothing down stops being a defence and starts being a liability.',
  },
  {
    heading: 'Over to you',
    body: 'The whole line is drawn. Select any entry, on the chart or in the list, to read what it changed for a firm’s internal records.',
  },
] as const

/** The labelled block closing the section, in the paper's voice. */
export const timelineArgues = {
  label: 'What the timeline argues',
  body: 'Products liability shifts the question a court asks. Negligence asks whether the developer behaved reasonably; design defect asks whether the system’s foreseeable risks outweighed its utility and whether a safer alternative design was reasonably available. That second question is answered out of the firm’s own materials. System cards, adversarial testing findings and internal escalation memoranda can show a jury that the company knew of a failure mode, held a feasible alternative, and deployed anyway. The same records can also show disciplined testing, prompt escalation and reasonable remediation. Which of those two things the record proves depends on how it was written, and that is a matter of architecture rather than of luck.',
} as const
