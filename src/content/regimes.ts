/**
 * 06 — Four regimes, one logic.
 *
 * The paper's Table 1 tabulates three regimes. A fourth, highway safety data,
 * is cited in §4.2.2 as a model for the statutory recommendation, so it earns a
 * row. Nothing else does, and no row here is invented: the specification asked
 * for six, the paper supports four, and padding a comparative table to hit a
 * number is exactly the move this paper argues against.
 *
 * The Safety Translation Layer is shown as the target row, not as a fifth
 * precedent. It has no statute behind it, and the table says so.
 */

export type ChannelMap = 'one' | 'two' | 'three'

export interface Regime {
  readonly id: string
  readonly name: string
  readonly domain: string
  /** Who receives the report. */
  readonly recipient: string
  /** Who holds enforcement authority. */
  readonly enforcer: string
  /** Separation of recipient from enforcer is the structural device. */
  readonly separated: boolean
  readonly protects: string
  readonly discoverable: string
  readonly source: string
  readonly citation: string
  readonly maps: readonly ChannelMap[]
  /** The design lesson the paper draws from it. */
  readonly lesson: string
  readonly proposed?: boolean
}

export const regimes: readonly Regime[] = [
  {
    id: 'asrs',
    name: 'Aviation Safety Reporting System',
    domain: 'Commercial aviation',
    recipient: 'NASA',
    enforcer: 'FAA',
    separated: true,
    protects: 'The voluntary report, and information derived from it, against use in enforcement',
    discoverable: 'Evidence the FAA obtains independently',
    source: 'Federal statute and regulation',
    citation: '49 U.S.C. § 40123 · 14 C.F.R. § 91.25',
    maps: ['two'],
    lesson:
      'Candour is made rational by separating the body that receives safety information from the body empowered to punish the reporter. NASA receives, analyses and de-identifies; the FAA enforces, but generally may not use an ASRS report or anything derived from it to do so. The Safety Translation Layer carries that principle inside the firm through a pre-committed Channel Two trigger that fixes the boundary before any particular incident arises.',
  },
  {
    id: 'psqia',
    name: 'Patient Safety and Quality Improvement Act',
    domain: 'Healthcare',
    recipient: 'Federally listed patient safety organizations',
    enforcer: 'State licensing and civil litigation',
    separated: true,
    protects:
      'Patient safety work product assembled or developed within a defined patient safety evaluation system',
    discoverable:
      'Original medical records, billing and discharge information, and anything maintained separately from the protected system',
    source: 'Federal statute preempting contrary state discovery law',
    citation: '42 U.S.C. §§ 299b-21 to -26 · 42 C.F.R. pt. 3',
    maps: ['one', 'two'],
    lesson:
      'Protection turns on a statutorily defined process rather than on a label attached after an adverse event, and routing a copy into the protected workflow cannot make the independently existing original undiscoverable. That is precisely the relationship between Channel One and Channel Two: the facts stay where they were, and the evaluation is what the boundary protects.',
  },
  {
    id: 'military',
    name: 'Military aircraft accident investigation',
    domain: 'Military aviation',
    recipient: 'Safety investigation board',
    enforcer: 'The service, and litigants in proceedings arising from the accident',
    separated: true,
    protects: 'Investigators’ opinions and causal conclusions, against litigation use',
    discoverable: 'Specified factual information from the investigation',
    source: 'Federal statute',
    citation: '10 U.S.C. § 2254(b), (d)',
    maps: ['one', 'two'],
    lesson:
      'The statute separates the record of what happened from the judgment of why it happened, making factual findings available to litigants while restricting the use of investigators’ opinions and causal conclusions. That distinction is the model for the boundary between Channel One and Channel Two, and it is the clearest statement anywhere in American law that the two are different kinds of thing.',
  },
  {
    id: 'highway',
    name: 'Highway safety data',
    domain: 'Transportation infrastructure',
    recipient: 'State and local transportation agencies',
    enforcer: 'Civil litigants',
    separated: false,
    protects:
      'Reports, surveys and data compiled for federally funded hazard-identification programmes, against discovery and admission',
    discoverable:
      'The underlying facts, obtained from sources other than the protected compilation',
    source: 'Federal statute, upheld against constitutional challenge',
    citation: '23 U.S.C. § 409 · Pierce County v. Guillen (2003)',
    maps: ['two'],
    lesson:
      'The paper cites this as a model for the statutory recommendation in §4.2.2: a targeted protection for information compiled within a defined safety programme, which leaves the underlying facts reachable by other means. It shows Congress has already built the narrow kind of shield the paper asks for, and that it survives.',
  },
]

/** Not a precedent. The thing the precedents are being read toward. */
export const target: Regime = {
  id: 'stl',
  name: 'Safety Translation Layer',
  domain: 'AI incident knowledge',
  recipient: 'Counsel and the safety review function, inside the firm',
  enforcer: 'Regulators, and civil litigants',
  separated: false,
  protects: 'Counsel-directed causal and legal analysis, entered through a pre-committed tripwire',
  discoverable: 'Channel One telemetry in full, and the fact of every remediation',
  source: 'No statute. Attorney-client privilege and work-product doctrine only',
  citation: 'Upjohn (1981) · Kovel (1961) · Fed. R. Evid. 407 · Fed. R. Civ. P. 37(e)',
  maps: ['one', 'two', 'three'],
  lesson:
    'Every structural choice above has been tested by another safety-critical industry against decades of accidents, litigation and regulatory scrutiny. The Safety Translation Layer assembles them without waiting for legislation, and that is both its advantage and its exposure: it can be built today, and it rests on doctrine rather than on statute. Only the second channel depends on that protection to exist at all.',
  proposed: true,
}

export interface Column {
  readonly id: keyof Regime | 'maps'
  readonly label: string
  readonly short: string
}

export const columns: readonly Column[] = [
  { id: 'recipient', label: 'Who receives the report', short: 'Recipient' },
  { id: 'enforcer', label: 'Who holds enforcement authority', short: 'Enforcer' },
  { id: 'protects', label: 'What is protected', short: 'Protected' },
  { id: 'discoverable', label: 'What remains discoverable', short: 'Discoverable' },
  { id: 'source', label: 'Source of protection', short: 'Source' },
  { id: 'maps', label: 'Which channel it maps to', short: 'Channel' },
]

export const channelNames: Readonly<Record<ChannelMap, string>> = {
  one: 'Channel One',
  two: 'Channel Two',
  three: 'Channel Three',
}

export const regimeCopy = {
  section: '06',
  eyebrow: 'Four regimes, one logic',
  headline: 'Every structural choice in the architecture has already been tested somewhere else.',
  standfirst:
    'Aviation and healthcare confronted this problem long before machine learning, and resolved it through deliberate institutional design rather than professional norms. Read together, the regimes reveal a common logic: preserve original facts, protect only a bounded process of evaluative analysis, and return verified findings to operations as corrective action.',
  note: 'The paper tabulates three regimes and cites a fourth as a model for its statutory recommendation. Those four are here, and nothing else is.',
  filterLabel: 'Show regimes mapping to',
  filterAll: 'All',
  sortLabel: 'Sort by',
  separatedLabel: 'Recipient separated from enforcer',
  lessonLabel: 'The design lesson',
  targetLabel: 'The proposal',
  targetNote: 'Not a precedent. This is what the precedents are being read toward.',
  regimeColumn: 'Regime',
  separatedTitle: 'Recipient separated from enforcer',
  separatedMark: 'separated',
  captionTemplate: 'Comparative safety-reporting regimes.',
  /** Which columns the table can be sorted by. */
  sortable: ['name', 'recipient', 'enforcer', 'source'] as const,
  scaffoldLabel: 'Guided walk through the four regimes',
  scaffoldHint: 'Filter, sort and open any row.',
  emptyBefore: 'No regime in the paper maps to',
  emptyAfter: 'alone. The proposal below still does — that is the point of the row.',
} as const

export const regimeArgues = {
  label: 'What the comparison argues',
  body: [
    'The three functions recur in every one of these regimes, and no regime protects everything. Each preserves the original operational facts for regulators and injured parties, each protects a bounded evaluative process with prespecified conditions of entry, and each returns verified findings to operations as corrective requirements rather than leaving the protected process as an informational dead end. The architecture is not novel. What is novel is applying it to a class of system whose records are generated automatically, and doing it before an accident forces the question.',
    'One difference matters more than any similarity. Every regime above rests on a statute; the Safety Translation Layer rests on privilege doctrine, which is forum-specific and which no court has yet applied to this device. That is the gap section 07 asks Congress to close, and until it does, a firm building this architecture is relying on the durability of a common-law protection rather than on a rule written for the purpose.',
  ],
} as const

/**
 * The guided walk.
 *
 * Every other heavy interactive on the site opens with one, and the comparator
 * opened cold: a reader arrived at a four-row table with a filter and a sort
 * and no reason to touch either. Each step moves the comparator's own state and
 * makes one argument with it; the last releases control.
 */
export const regimeSteps = [
  {
    heading: 'Four regimes that already ran this experiment',
    body: 'Three the paper tabulates, and a fourth it cites as the model for its statutory ask. None of them is an analogy: each is a working regime in which a protected reporting channel exists, and each has been tested against real litigation.',
  },
  {
    heading: 'Sort by who receives the report',
    body: 'The recipient is the structural choice, not a detail of drafting. Every one of these regimes routes the candid record to a party that is not the defendant, and that is what makes the protection hold up rather than read as self-serving.',
  },
  {
    heading: 'Now show only the channel that needs a statute',
    body: 'Filtered to Channel Two. This is the whole legal exposure of the architecture: Channels One and Three need no protection at all, because facts and remediation were always meant to be reachable. Only the counsel-directed channel depends on a privilege holding.',
  },
  {
    heading: 'The row with no statute',
    body: 'The Safety Translation Layer sits in the same shape as the four above it and is the only one without a statute behind it. That is the ask in §07, and it is also why the paper is careful to say the architecture can be built under existing law today.',
  },
  {
    heading: 'Over to you',
    body: 'Filter by channel, sort by any column, and open any row. The question worth asking is which of these four you would cite first if you had to explain the protected channel to your own general counsel.',
  },
] as const
