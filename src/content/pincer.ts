/**
 * 01 — The pincer.
 *
 * Two forces acting on one reader. Everything here traces to the paper.
 */

export interface Force {
  readonly id: 'document' | 'produce'
  readonly kicker: string
  readonly title: string
  readonly lead: string
  readonly items: readonly ForceItem[]
  readonly consequence: string
}

export interface ForceItem {
  readonly authority: string
  readonly text: string
}

export const pincer = {
  section: '01',
  eyebrow: 'The pincer',
  headline: 'Two rules, pulling opposite ways, on the same set of documents.',
  standfirst:
    'One body of law requires an AI developer to monitor its systems and write down what it finds. Another lets a plaintiff compel production of what it wrote. Neither yields to the other, and the paper names the bind the Documentation Paradox.',

  forces: [
    {
      id: 'document',
      kicker: 'Force one',
      title: 'Write it down',
      lead:
        'Regulation and fiduciary duty compel documentation, and the obligations are affirmative rather than permissive.',
      items: [
        {
          authority: 'EU AI Act, art. 73',
          text: 'Serious-incident reporting duties, imposed on specified AI actors.',
        },
        {
          authority: 'Regulation (EU) 2024/1689, arts. 12, 18, 26, 72–73',
          text: 'Recordkeeping and post-market monitoring obligations, requiring a contemporaneous operational record.',
        },
        {
          authority: 'In re Caremark Int’l Inc. Derivative Litig., 698 A.2d 959 (Del. Ch. 1996)',
          text: 'Corporate oversight duties. A board deprived of incident data cannot discharge them, and the paper notes the standard has been read more demandingly since.',
        },
        {
          authority: 'Directive (EU) 2024/2853, art. 9(1)',
          text: 'A rebuttable presumption of defectiveness where a defendant fails to comply with a court-ordered disclosure of relevant evidence.',
        },
      ],
      consequence:
        'Documentation is no longer discretionary, and the newest of these rules penalises the firm that cannot produce.',
    },
    {
      id: 'produce',
      kicker: 'Force two',
      title: 'Hand it over',
      lead:
        'American civil discovery reaches the record the first force compels, and it reaches it wherever it is kept.',
      items: [
        {
          authority: 'Fed. R. Civ. P. 26(b)(1)',
          text: 'A litigant may obtain any nonprivileged matter relevant to any party’s claim or defence and proportional to the needs of the case.',
        },
        {
          authority: 'Fed. R. Civ. P. 34(a)(1)(A)',
          text: 'That reach extends to electronically stored information wherever it resides.',
        },
        {
          authority: 'Hickman v. Taylor, 329 U.S. 495 (1947)',
          text: 'Since 1938 American litigation has proceeded from the premise that the facts of a dispute belong to the case rather than to the party that happens to hold them.',
        },
        {
          authority: 'Applied to an AI developer',
          text: 'That language may reach large portions of the engineering record, from prompts and model versions to classifier scores and red-team transcripts.',
        },
      ],
      consequence:
        'Privilege is the only exception, and the paper spends its second half on how narrow and how fragile that exception really is.',
    },
  ] as const satisfies readonly Force[],

  /** The bind, stated plainly. */
  bind: {
    label: 'The bind',
    body:
      'A structural tension now runs across the Atlantic, in which American litigation rules tend to reward less documentation while European regulatory obligations reward more. The same record that makes a failure intelligible to engineers may become evidence of notice, of defect, of an available precaution, or of an inadequate mitigation.',
    cite: 'Paper, §1.1',
  },
} as const
