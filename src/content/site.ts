/**
 * Site-level metadata, citation and disclaimers.
 *
 * All prose on this site lives in src/content/. Edit copy here, never in a
 * component. Every factual claim must trace to the paper.
 */

import type { GlossaryId } from './glossary'

export interface Author {
  readonly name: string
  /** Given name(s), Highwire/JSON-LD order. Needed because "Family, Given"
   *  can't be safely guessed back out of the display name for every author —
   *  e.g. a two-part given name or a single-word family name. */
  readonly given: string
  readonly family: string
  readonly corresponding?: boolean
  readonly email?: string
}

export const paper = {
  title: 'Architecting Candor',
  subtitle: 'Products Liability and AI Incident Knowledge Governance',
  date: 'August 2026',
  /** ISO-ish year-month, for citation_publication_date and JSON-LD
   *  datePublished. `date` above stays the prose form readers see. */
  datePublished: '2026-08',
  language: 'en',
  publisher: 'Arcadia Impact AI Governance Taskforce',
  copublisher: 'Responsible AI Collaborative',
  authors: [
    {
      name: 'Michael A. Celone',
      given: 'Michael A.',
      family: 'Celone',
      corresponding: true,
      email: 'michael.celone@arcadiaimpact.org',
    },
    { name: 'Sean McGregor', given: 'Sean', family: 'McGregor' },
    { name: 'Mosi Secret', given: 'Mosi', family: 'Secret' },
    { name: 'Eduardo Mignot', given: 'Eduardo', family: 'Mignot' },
    { name: 'Noga Bregman', given: 'Noga', family: 'Bregman' },
    { name: 'Bekhzodkhon Alikhanov', given: 'Bekhzodkhon', family: 'Alikhanov' },
  ] as const satisfies readonly Author[],
  citation:
    'Celone, M. A., McGregor, S., Secret, M., Mignot, E., Bregman, N., & Alikhanov, B. (2026). Architecting Candor: Products Liability and AI Incident Knowledge Governance. Arcadia Impact AI Governance Taskforce. https://doi.org/10.2139/ssrn.7310079',
  researchPage: 'https://www.arcadiaimpact.org/ai-governance-taskforce/research',
  /**
   * The taskforce's permanent link for this paper. It forwards to the SSRN
   * record, so this is the address to cite rather than the SSRN URL: it keeps
   * working if the paper moves. Until this existed, "Read the paper" and
   * "Arcadia Impact research" both pointed at the same index page.
   */
  paperUrl: 'https://www.arcadiaimpact.org/aigt/research/s26-incident-liability-report',
  /**
   * The DOI the taskforce link above forwards to. Cite and link this
   * directly rather than the Arcadia URL: a DOI is the address that survives
   * if Arcadia's own redirect ever changes, which is the same reasoning that
   * put paperUrl ahead of the SSRN link in the first place.
   */
  doi: '10.2139/ssrn.7310079',
  doiUrl: 'https://doi.org/10.2139/ssrn.7310079',
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
  /** §09 has no standfirst for SectionHead to define this against, so it is
   *  defined directly where the third block below names itself: "synchronic". */
  terms: ['synchronic'] as const satisfies readonly GlossaryId[],
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

/**
 * Section register. The numbering is a sequence because the argument is one.
 *
 * `readingMinutes` is each section's word count at ~220 wpm, computed with
 * interactives' generated/telemetry values excluded — the same prose filter
 * read-aloud.ts uses. scripts/check-reading-time.ts recomputes it from the
 * content modules on every `pnpm check` and fails if this drifts from the
 * recomputation by more than a minute, so a copy edit that meaningfully
 * changes a section's length cannot silently leave the label wrong.
 */
export const sections = [
  { n: '00', id: 'memo', title: 'The memo', readingMinutes: 3 },
  { n: '01', id: 'pincer', title: 'The pincer', readingMinutes: 7 },
  { n: '02', id: 'signal', title: 'Where the signal dies', readingMinutes: 6 },
  { n: '03', id: 'route', title: 'Route the record', readingMinutes: 11 },
  { n: '04', id: 'architecture', title: 'The architecture, operable', readingMinutes: 9 },
  { n: '05', id: 'calibrate', title: 'Calibrate the tripwire', readingMinutes: 4 },
  { n: '06', id: 'regimes', title: 'Four regimes, one logic', readingMinutes: 5 },
  { n: '07', id: 'ask', title: 'The ask', readingMinutes: 4 },
  { n: '08', id: 'gc', title: 'Take it to your GC', readingMinutes: 8 },
  { n: '09', id: 'paper', title: 'The paper', readingMinutes: 4 },
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
  readonly readingMinutes: number
} {
  const i = sections.findIndex((s) => s.id === id)
  const found = sections[i]
  if (!found) throw new Error(`Unknown section id: ${id}`)
  return { ...found, seq: i + 1 }
}

/**
 * The explainer video. The player itself sits in §00, as the first "way in" —
 * see hero.ts's waysIn — because the audit found it buried at the bottom of
 * §09 with nothing at the top pointing to it. §09 keeps a one-line link back
 * up to it beside the citation.
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
  /** The §09 text link back up to the §00 player. */
  backLabel: 'Watch the explainer',
} as const

/** The section rail. */
export const navCopy = {
  label: 'Sections',
  title: 'The argument',
  /** The narrow-viewport control that opens the same list. */
  jumpLabel: 'Jump to a section',
  jumpShort: 'Sections',
  /** Visually-hidden prefix on the locator bar's current-section text. Not
   *  aria-live: that text changes on every scroll frame and would flood a
   *  screen reader, so it is read only on demand, like any other text. */
  current: 'Current section',
  /** The popover's back-to-top item. */
  top: 'Top',
} as const

/** Colophon furniture. */
export const colophonCopy = {
  correspondingLabel: 'Corresponding author',
  citeLabel: 'Cite as',
  readPaper: 'Read the paper',
  researchLink: 'Arcadia Impact research',
  /** The Cite-as block's two copy buttons. Each label swaps to `copied` for a
   *  couple of seconds; a role="status" element carries the same word to a
   *  screen reader, since a swapped button label alone is not reliably
   *  announced. */
  copyCitation: 'Copy citation',
  copyBibtex: 'Copy BibTeX',
  copied: 'Copied',
  glossaryLabel: 'Terms used on this page',
} as const

/** The per-section "Copy link" button beside the Bates stamp. Shares the
 *  same "Copied" feedback word as the Cite-as buttons above. */
export const sectionLinkCopy = {
  copied: 'Copied',
} as const

/**
 * Bates-style production numbers. The section numbering is chain of custody:
 * an append-only production in which nothing has been removed.
 */
export function bates(n: number): string {
  return `ARC-${String(n).padStart(6, '0')}`
}
