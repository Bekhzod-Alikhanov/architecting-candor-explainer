/**
 * 02 — Where the signal dies.
 *
 * Three mechanisms from the paper's Section 2.1, and the empirical finding that
 * anchors them. The handoff record below is illustrative: it shows what
 * translation loss does to a record, using the incident this site has been
 * following. The research findings and the five-percent figure are the paper's.
 */

export interface Handoff {
  readonly id: string
  readonly actor: string
  readonly role: string
  /** What survives the handoff, in the register that function speaks. */
  readonly fields: readonly string[]
  /** Carlile's boundary crossed to reach this actor. */
  readonly boundary: 'origin' | 'syntactic' | 'semantic' | 'pragmatic'
  readonly boundaryNote: string
  /** What this function dropped, and why it seemed reasonable. */
  readonly dropped: string
}

export const boundaries = {
  origin: { label: 'Observed', note: 'The record as it exists at the point of observation.' },
  syntactic: {
    label: 'Syntactic boundary',
    note: 'A shared lexicon is enough. Both sides use the same words for the same things.',
  },
  semantic: {
    label: 'Semantic boundary',
    note: 'The same term now means different things on each side, and the interpretations have to be reconciled.',
  },
  pragmatic: {
    label: 'Pragmatic boundary',
    note: 'The parties have different stakes. Words like risk, incident and safety imply different actions for engineers, lawyers, product teams and the board.',
  },
} as const

export const handoffs: readonly Handoff[] = [
  {
    id: 'engineer',
    actor: 'The engineer who noticed',
    role: 'Observation',
    boundary: 'origin',
    boundaryNote: 'Nothing has moved yet.',
    fields: [
      'clf_confidence 0.31 against deploy_threshold 0.60',
      'guardrail fired +1.842s, after the output was served',
      'slice health_advice_longform, PSI 0.24 week on week',
      'retrieval corpus kb-2026.05, top document 612 days old',
      'model asst-4.2, policy_version 2026.07.3',
      'red-team finding from April, still open',
    ],
    dropped: '',
  },
  {
    id: 'safety',
    actor: 'Safety review',
    role: 'Assessment',
    boundary: 'syntactic',
    boundaryNote:
      'Engineering and safety review share a vocabulary, so the numbers survive intact. This is the easy crossing, and it is the only easy one.',
    fields: [
      'clf_confidence 0.31 against deploy_threshold 0.60',
      'guardrail fired late on the affected slice',
      'slice health_advice_longform, drift elevated',
      'red-team finding from April, still open',
    ],
    dropped:
      'The retrieval corpus version and the age of the top document. Both looked like infrastructure detail rather than safety detail — and either could be the cause.',
  },
  {
    id: 'product',
    actor: 'Product and operations',
    role: 'Prioritisation',
    boundary: 'semantic',
    boundaryNote:
      'Both sides say risk and mean different things. Engineering means a measured departure from a baseline; product means an effect on users and on the release.',
    fields: [
      'elevated risk on a user-facing slice',
      'a guardrail timing issue',
      'a prior finding not yet closed',
    ],
    dropped:
      'Every number. The threshold, the score, the interval and the drift measure are gone, and with them any way to tell a recurring failure mode from expected variation.',
  },
  {
    id: 'counsel',
    actor: 'Counsel and compliance',
    role: 'Exposure',
    boundary: 'pragmatic',
    boundaryNote:
      'The stakes now differ, not just the vocabulary. What counsel needs from this record is not what product needed from it, and the record has already lost what would have answered either question.',
    fields: ['a potential incident on a user-facing feature', 'an open prior finding'],
    dropped:
      'The operational specifics that would let anyone decide whether this is one event or a pattern. What remains is a characterisation, which is the one thing the paper says should never have been the travelling form.',
  },
  {
    id: 'board',
    actor: 'The board or its risk committee',
    role: 'Oversight',
    boundary: 'pragmatic',
    boundaryNote:
      'The body with the oversight duty receives the thinnest version of the record, having crossed the most boundaries to get there.',
    fields: ['a safety matter, under review'],
    dropped:
      'Everything that would support a residual-risk determination expressed as a severity level, a likelihood of recurrence and an exposure denominator — which is precisely what the board is supposed to decide.',
  },
]

export const translation = {
  label: 'Translation loss',
  heading: 'A signal rarely disappears. It is edited, at every handoff, by people acting reasonably.',
  body: [
    'Carlile identifies three boundaries that knowledge has to cross inside an organisation, and they get harder in order. At a syntactic boundary a shared lexicon is enough. At a semantic boundary the same term has to be reconciled across different interpretations. At a pragmatic boundary the parties have different stakes, and words like risk, incident and safety imply different actions for engineers, lawyers, product teams and the board.',
    'Røvik describes knowledge transfer as a rule-governed process in which omission is a routine move rather than an act of concealment. Each function keeps what is salient to its own environment. The operational context that made the signal important is what gets left behind.',
    'Hansen adds the relational half. Weak ties are effective for locating knowledge, but transferring knowledge that is complex, tacit or hard to codify needs stronger and more recurrent working relationships. AI incident knowledge has exactly those properties, and the connections between front-line engineering, legal, compliance, executives and the board are frequently episodic. The signals that most need contextual explanation travel through the channel least able to carry it.',
  ],
  stepLabel: 'Advance the handoff',
  restartLabel: 'Back to the observation',
  trackLabel: 'Handoffs',
  fieldsLabel: 'What arrives',
  droppedLabel: 'What was left behind',
} as const

/** Mechanism two: the boundary of acceptable behaviour migrates outward. */
export const deviance = {
  label: 'Normalization of deviance',
  heading: 'The second mechanism is worse, because it works on the signals nobody edited.',
  body: [
    'Vaughan’s study of the Challenger disaster described how an anomaly accepted once becomes a precedent, and repeated success gradually expands the boundary of what an organisation treats as acceptable. The mechanism is statistical before it is cultural: each uneventful recurrence is read as evidence that the anomaly is benign.',
    'Rasmussen named the resulting drift a systematic migration of organisational behaviour toward the boundaries of safe behaviour under competitive pressure. AI development intensifies the pattern. Models are updated frequently, generate anomalies at scale, and behave probabilistically, which makes a genuine warning easier to classify as acceptable random variance.',
  ],
  initial: 'The anomaly has been observed once and the threshold still holds. Press the button.',
  runLabel: 'Another uneventful recurrence',
  resetLabel: 'Reset',
  observedLabel: 'Uneventful recurrences',
  acceptedLabel: 'Now treated as acceptable',
  originalLabel: 'The original limit',
  harmLabel: 'A harm occurs',
  harmBody:
    'Nothing about the system changed at the moment of harm. The boundary had been moving the whole time, and every step was locally reasonable. This is what makes the migration hard to see from inside: there is no decision to point at.',
  steps: [
    'The anomaly recurs. No harm follows.',
    'It recurs again. The absence of harm is read as evidence the anomaly is benign.',
    'The threshold that would have flagged it is quietly treated as conservative.',
    'The behaviour is now inside what the team considers normal operation.',
    'The boundary has moved far enough that the original limit looks excessive.',
    'Competitive pressure supplies the reason not to move it back.',
  ],
} as const

/** Mechanism three: the decision to record precedes every use of the record. */
export const recording = {
  label: 'The decision to record',
  heading: 'And none of it matters if the person who saw it decides not to write it down.',
  body: [
    'Edmondson describes psychological safety as a shared belief that people can raise questions, mistakes and concerns without interpersonal punishment. In an incident system it operates as a condition of the documentation process itself, because the decision to record precedes every downstream use of the record.',
    'A meta-analysis of 131 studies finds that employees who perceive threat do not merely fail to share knowledge, they actively withhold it. Casper and colleagues identify the consequence that matters most here: suppression removes the most diagnostically useful records first, because those are the ones that would be most damaging to possess.',
    'The countermeasure the paper recommends is a just culture with a written accountability standard distinguishing inadvertent error from wilful misconduct. In software teams the clarity of stated norms predicts performance substantially more strongly than psychological safety on its own, so a firm has to make explicit what is reportable, to whom, on what timeline, and with what protection.',
  ],
  studies: '131',
  studiesNote: 'studies in the meta-analysis on knowledge hiding',
} as const

/** The finding that anchors the section. */
export const anchor = {
  figure: 'Fewer than 5%',
  lead: 'of cybersecurity incidents had a formal written report requested by counsel.',
  body: 'One forensic investigator interviewed by Schwarcz, Wolff and Woods gave that estimate, and gave the reason: a written report would have to document the failures. Cybersecurity is this paper’s empirical proxy for AI, because it is the closest industry analog in litigation exposure and documentation culture. This is not a prediction about what suppression might do. It is a measurement of what the counsel-driven strategy already produced in the industry that adopted it first.',
  cite: 'Schwarcz, Wolff & Woods (2023), p. 450 · paper §2.1.3',
} as const

export const signalCopy = {
  section: '02',
  eyebrow: 'Where the signal dies',
  headline: 'The legal pressure acts on an organisation that was already losing the signal.',
  standfirst:
    'Section 01 described a bind created by law. This one is about the firm itself. Three mechanisms erode incident knowledge before any lawyer is involved, and the documentation paradox amplifies all three.',
} as const

export const signalArgues = {
  label: 'What this section argues',
  body: [
    'These three mechanisms make signal loss predictable rather than accidental, and none of them is a failure of individual diligence. Detail attrition, normalized anomalies and suppressed documentation each result from how authority, incentive and information access are allocated inside the firm, which means they are answerable to structural design and not to exhortation.',
    'The remedy is not to eliminate interpretation, which is impossible. It is to ensure that interpretation travels with a stable factual core: a structured, quantifiable record of the metric, the baseline, the system state, the time window and the deployment context, preserved once and then evaluated by each function without being rewritten at every handoff. That is what the first channel is for, and it is why the architecture has to start there.',
  ],
} as const
