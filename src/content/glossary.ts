/**
 * §09 — Terms used on this page.
 *
 * A glossary entry is not a footnote: it is a definition a reader can open
 * inline, from wherever the term first appears, without losing their place.
 * This module is the one place a term's wording lives; `forms` lists every
 * surface spelling of a term this site's prose actually uses, so
 * `findTerm`/`defineTerms` (src/lib/) can recognise a term wherever a section
 * writes it, and `scripts/check-glossary.ts` can catch a definition that no
 * section's prose ever refers to.
 */

export type GlossaryId =
  | 'privilege'
  | 'work-product'
  | 'discovery'
  | 'spoliation'
  | 'rule-407'
  | 'kovel'
  | 'caremark'
  | 'upjohn'
  | 'tripwire'
  | 'near-miss'
  | 'normalization-of-deviance'
  | 'synchronic'

export interface GlossaryEntry {
  readonly id: GlossaryId
  readonly term: string
  /** Every surface spelling this site's prose uses for the term, longest
   *  first isn't required here — findTerm sorts by length itself. */
  readonly forms: readonly string[]
  readonly definition: string
  readonly ref: string
}

export const glossary: readonly GlossaryEntry[] = [
  {
    id: 'privilege',
    term: 'Attorney-client privilege',
    forms: ['attorney-client privilege', 'privileged channel', 'privilege', 'privileged'],
    definition:
      'The oldest protection for confidential communications known to the common law. It shields what a client tells a lawyer in order to obtain legal advice, and the advice given back, but never the underlying facts, which stay discoverable however many lawyers have seen them.',
    ref: 'Upjohn Co. v. United States (1981); paper §1.2.1–1.2.2',
  },
  {
    id: 'work-product',
    term: 'Work product',
    forms: ['work-product protection', 'work product'],
    definition:
      'Protection for material a party prepares because it reasonably anticipates litigation. Courts have refused it where the same investigation would have been carried out anyway in the ordinary course of business.',
    ref: 'Hickman v. Taylor (1947); Fed. R. Civ. P. 26(b)(3); paper §1.1, §1.2.2',
  },
  {
    id: 'discovery',
    term: 'Discovery',
    forms: ['civil discovery', 'discoverable', 'discovery'],
    definition:
      'The stage of American civil litigation in which each side can compel the other to produce any nonprivileged material relevant to a claim or defence, including electronically stored information wherever it sits.',
    ref: 'Fed. R. Civ. P. 26(b)(1), 34(a)(1)(A); paper §1.2.1',
  },
  {
    id: 'spoliation',
    term: 'Spoliation',
    forms: ['spoliation'],
    definition:
      'Destroying, altering or failing to preserve records once litigation is reasonably anticipated. A credible claim of user harm can trigger the duty to preserve, and suppressing a record that already exists is a worse position than producing it.',
    ref: 'Fed. R. Civ. P. 37(e); paper §3.2.2',
  },
  {
    id: 'rule-407',
    term: 'Rule 407',
    // The plural "subsequent remedial measures" appears nowhere in this
    // site's prose — every occurrence is singular — so it is not listed.
    forms: ['Rule 407', 'subsequent remedial measure'],
    definition:
      'Federal Rule of Evidence 407 generally bars using a fix made after an injury to prove negligence, culpable conduct, a product defect or a need for warning. It limits use at trial, not discovery, and it protects the fix rather than any analysis written alongside it.',
    ref: 'Fed. R. Evid. 407; paper §1.2.3',
  },
  {
    id: 'kovel',
    term: 'Kovel',
    forms: ['Kovel'],
    definition:
      "United States v. Kovel (1961): an outside expert retained by counsel can sit inside the privilege where the expert's work is genuinely necessary to the legal advice. Arranging an audit through counsel does not, by itself, make the audit privileged.",
    ref: 'United States v. Kovel, 296 F.2d 918 (2d Cir. 1961); paper §3.2.1',
  },
  {
    id: 'caremark',
    term: 'Caremark duty',
    forms: ['Caremark'],
    definition:
      'The duty of a corporate board to maintain reporting systems and oversee the risks the firm runs. A board deprived of incident data cannot discharge it, and courts have read the standard more demandingly since it was set.',
    ref: "In re Caremark Int'l Inc. Derivative Litig., 698 A.2d 959 (Del. Ch. 1996); paper §1, executive summary VI",
  },
  {
    id: 'upjohn',
    term: 'Upjohn',
    forms: ['Upjohn'],
    definition:
      'Upjohn Co. v. United States (1981): the Supreme Court extended corporate attorney-client privilege to employees at every level, and held that the privilege protects communications, never the underlying facts. Channel One is built on that rule.',
    ref: 'Upjohn Co. v. United States, 449 U.S. 383 (1981); paper §1.2.1',
  },
  {
    id: 'tripwire',
    term: 'Tripwire',
    forms: ['telemetry tripwire', 'tripwire'],
    definition:
      'A quantitative threshold, set and versioned before any incident, whose crossing automatically opens the privileged channel and alerts counsel. Pre-commitment is what lets a firm show that a privileged review was a planned legal step rather than a reaction to a harm-framed record.',
    ref: 'Paper §3.2.2',
  },
  {
    id: 'near-miss',
    term: 'Near miss',
    forms: ['near misses', 'near miss', 'near-miss'],
    definition:
      'An event that crossed a logging threshold but not the review threshold. The paper calls near misses the highest-value harm-adjacent safety signal and a comparatively low-liability class of data, and the first thing a regime designed under legal fear discards.',
    ref: 'Paper §3.2.2',
  },
  {
    id: 'normalization-of-deviance',
    // The site's prose (§02, §05) only ever writes the American spelling —
    // it is the term as Vaughan's own literature uses it — so `term` and
    // `forms` both follow that; the British spelling was never used and is
    // not listed.
    term: 'Normalization of deviance',
    forms: ['normalization of deviance'],
    definition:
      "Diane Vaughan's account of the Challenger disaster: an anomaly accepted once becomes a precedent, and each uneventful recurrence is read as evidence that it is benign, until the boundary of the acceptable has migrated to the edge of safe behaviour.",
    ref: 'Vaughan (1996); paper §2.1.2',
  },
  {
    id: 'synchronic',
    term: 'Synchronic',
    forms: ['synchronic'],
    definition:
      'Describing one moment rather than a development over time. The paper calls its own analysis synchronic: a picture of a legal landscape moving faster than any single document can track.',
    ref: 'Paper, Methodology',
  },
] as const
