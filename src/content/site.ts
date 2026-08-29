/**
 * Site-level metadata, citation and disclaimers.
 *
 * All prose on this site lives in src/content/. Edit copy here, never in a
 * component. Every factual claim must trace to the paper.
 */

export interface Author {
  readonly name: string
  readonly corresponding?: boolean
  readonly email?: string
}

export const paper = {
  title: 'Architecting Candor',
  subtitle: 'Products Liability and AI Incident Knowledge Governance',
  date: 'August 2026',
  publisher: 'Arcadia Impact AI Governance Taskforce',
  copublisher: 'Responsible AI Collaborative',
  authors: [
    { name: 'Michael A. Celone', corresponding: true, email: 'michael.celone@arcadiaimpact.org' },
    { name: 'Sean McGregor' },
    { name: 'Mosi Secret' },
    { name: 'Eduardo Mignot' },
    { name: 'Noga Bregman' },
    { name: 'Bekhzodkhon Alikhanov' },
  ] as const satisfies readonly Author[],
  citation:
    'Celone, M. A., McGregor, S., Secret, M., Mignot, E., Bregman, N., & Alikhanov, B. (2026). Architecting Candor: Products Liability and AI Incident Knowledge Governance. Arcadia Impact AI Governance Taskforce.',
  researchPage: 'https://www.arcadiaimpact.org/ai-governance-taskforce/research',
  /**
   * The taskforce's permanent link for this paper. It forwards to the SSRN
   * record, so this is the address to cite rather than the SSRN URL: it keeps
   * working if the paper moves. Until this existed, "Read the paper" and
   * "Arcadia Impact research" both pointed at the same index page.
   */
  paperUrl: 'https://www.arcadiaimpact.org/aigt/research/s26-incident-liability-report',
} as const

export const meta = {
  /** Reads as an argument, not a label. */
  title: 'Architecting Candor — the record gets written either way',
  description:
    'AI firms are compelled to document safety incidents and compelled to produce those documents in discovery. An operable walkthrough of the three-channel Safety Translation Layer proposed in Architecting Candor (Arcadia Impact, August 2026).',
  canonical: 'https://architecting-candor.vercel.app/',
  /** The standalone linter route. Both entry points are in public/sitemap.xml,
      so each has to claim its own canonical or they contradict each other. */
  linterTitle: 'The incident ticket linter — Architecting Candor',
  linterDescription:
    'Paste an incident ticket and see which phrases would be read as the firm’s own findings, with a measurement-form substitute for each. Runs entirely in your browser. From Architecting Candor (Arcadia Impact, August 2026).',
  linterCanonical: 'https://architecting-candor.vercel.app/linter',
  ogAlt:
    'One incident record shown twice: as a line of engineering telemetry and as a stamped discovery exhibit, divided by a vertical seam.',
} as const

/**
 * The paper's own disclaimer. Reproduced verbatim in substance, as the
 * content rules require. Do not soften this.
 */
export const disclaimer = {
  short: 'Nothing here is legal advice.',
  full: 'Nothing on this page should be construed as providing legal advice. Firms should consult counsel before relying on any legal principle described here.',
} as const

/** The "About this page" block. A dated snapshot, and it says so. */
export const about = {
  heading: 'About this page',
  blocks: [
    'This is a companion to a paper, not a substitute for it. Everything substantive here comes from Architecting Candor (Arcadia Impact AI Governance Taskforce, August 2026).',
    'Where the page states a case holding, a statute, a date or a figure, it traces to that paper. Where it needed a number the paper does not supply, it says so on the screen rather than in a footnote.',
    'It is a dated snapshot pinned to the August 2026 paper. The paper describes its own analysis as synchronic, capturing a legal and regulatory landscape moving faster than any single document can track, and that applies with more force to a web page.',
    'Case law moves. Regulations commence. The countdown on this page will expire. Read the doctrinal positions here as a snapshot of the period in which the paper was written.',
    'The interactives are illustrative reconstructions. The incident in Route the Record did not happen; the artifacts in its deck were written for this page; the event stream in the calibrator is generated in your browser from a fixed seed.',
    'None of it is drawn from any real firm, product or matter. Screens containing simulated or illustrative values are marked as such.',
    'The architecture the paper proposes can be implemented under existing law, but no court has yet passed on its central device. Privilege rules also vary by state and across EU Member States, including for communications with in-house counsel.',
    'Nothing here is legal advice, and a firm should assess the governing privilege rules in each jurisdiction with its own counsel before relying on any of it.',
    'The linter runs entirely in your browser. Nothing you paste into it is transmitted anywhere, and the page makes no network requests after it loads.',
  ],
} as const

export const contribution = {
  heading: 'Contribution statement',
  note: 'Author contributions follow the CRediT taxonomy, as stated in the paper.',
  rows: [
    { role: 'Conceptualization', who: 'Michael A. Celone, Sean McGregor' },
    { role: 'Methodology, Investigation', who: 'All authors' },
    {
      role: 'Writing — original draft',
      who: 'Michael A. Celone (abstract, executive summary, introduction, conclusion); Mosi Secret (Section 1); Eduardo Mignot (Section 2); Noga Bregman (Section 3); Bekhzodkhon Alikhanov (Section 4)',
    },
    { role: 'Visualization', who: 'Eduardo Mignot (Figure 1), Bekhzodkhon Alikhanov (Table 1)' },
    { role: 'Writing — review & editing', who: 'Michael A. Celone (lead editor)' },
    { role: 'Supervision', who: 'Michael A. Celone, Sean McGregor' },
    { role: 'Project administration', who: 'Michael A. Celone' },
  ],
} as const

/** Section register. The numbering is a sequence because the argument is one. */
export const sections = [
  { n: '00', id: 'memo', title: 'The memo' },
  { n: '01', id: 'pincer', title: 'The pincer' },
  { n: '02', id: 'signal', title: 'Where the signal dies' },
  { n: '03', id: 'route', title: 'Route the record' },
  { n: '04', id: 'architecture', title: 'The architecture, operable' },
  { n: '05', id: 'calibrate', title: 'Calibrate the tripwire' },
  { n: '06', id: 'regimes', title: 'Four regimes, one logic' },
  { n: '07', id: 'ask', title: 'The ask' },
  { n: '08', id: 'gc', title: 'Take it to your GC' },
  { n: '09', id: 'paper', title: 'The paper' },
] as const

export type SectionId = (typeof sections)[number]['id']

/**
 * Look up a section by id, with its sequence number.
 *
 * The register above is the single source of truth for a section's number,
 * title and Bates sequence. App.tsx used to repeat all three inline for every
 * deferred section, which meant the placeholder a reader sees while a section
 * loads was the one piece of prose on the site that lived in a component.
 */
export function section(id: SectionId): {
  readonly id: SectionId
  readonly n: string
  readonly title: string
  readonly seq: number
} {
  const i = sections.findIndex((s) => s.id === id)
  const found = sections[i]
  if (!found) throw new Error(`Unknown section id: ${id}`)
  return { ...found, seq: i + 1 }
}

/**
 * The explainer video, in §09 beside the paper links.
 *
 * Self-hosted, so watching it sends no request to anyone but this domain — the
 * same reason the linter runs in the browser. It is 87MB, so preload is off and
 * nothing is fetched until a reader presses play.
 */
export const explainer = {
  src: '/video/architecting-candor-explainer.mp4',
  type: 'video/mp4',
  /**
   * A dedicated poster, not og.png. The OG card is a 2400px PNG at 163KB, and
   * browsers fetch a poster eagerly even when preload is off — so pointing at
   * it pulled 163KB onto the critical path to illustrate a player in the last
   * section, and cost 3 points of mobile performance.
   */
  poster: '/video/poster.webp',
  label: 'The explainer',
  title: 'Architecting Candor: structuring AI safety against litigation',
  duration: '9 min 28 s',
  /** Shown to a browser that cannot play the file at all. */
  fallback: 'Your browser cannot play this video.',
  downloadLabel: 'Download the file',
  note: 'Self-hosted and not tracked. Nothing is downloaded until you press play.',
} as const

/** The section rail. */
export const navCopy = {
  label: 'Sections',
  title: 'The argument',
  /** The narrow-viewport control that opens the same list. */
  jumpLabel: 'Jump to a section',
  jumpShort: 'Sections',
} as const

/** Colophon furniture. */
export const colophonCopy = {
  correspondingLabel: 'Corresponding author',
  citeLabel: 'Cite as',
  readPaper: 'Read the paper',
  researchLink: 'Arcadia Impact research',
} as const

/**
 * Bates-style production numbers. The section numbering is chain of custody:
 * an append-only production in which nothing has been removed.
 */
export function bates(n: number): string {
  return `ARC-${String(n).padStart(6, '0')}`
}
