/**
 * 08 — The incident ticket linter.
 *
 * This comes straight from §2.2.3. Two entries record the same event. One says
 * the model gave harmful advice, or that the safety architecture was at fault.
 * The other records a timestamp, a session identifier, a classifier score
 * against its deployment threshold, and the policy version that routed the
 * output. The first imports subjective admissions of harm. The second is an
 * objective instrument measurement.
 *
 * Patterns are plain phrases, matched case-insensitively at word boundaries, so
 * this file can be edited by anyone. No regular expressions to write.
 * Everything runs in the reader's browser and nothing is transmitted.
 */

export type Category = 'fault' | 'harm' | 'causal' | 'counterfactual' | 'legal'

export interface CategoryMeta {
  readonly id: Category
  readonly label: string
  /** Why this class of phrase is hazardous in a discoverable record. */
  readonly hazard: string
}

export const categories: readonly CategoryMeta[] = [
  {
    id: 'fault',
    label: 'Fault attribution',
    hazard:
      'Assigns blame to a person, a team or a component. In a record that will be produced, this reads as the firm’s own finding of fault, made by someone who was not asked to make it and is not qualified to make it on the organisation’s behalf.',
  },
  {
    id: 'harm',
    label: 'Harm characterisation',
    hazard:
      'Characterises the outcome as harmful, which is a conclusion about causation and injury dressed as a description. The ticket should state what was measured and leave the characterisation to the channel built to make it.',
  },
  {
    id: 'causal',
    label: 'Causal assertion',
    hazard:
      'Asserts a cause at the moment of observation, before the causal question has been investigated. In entangled machine-learning systems, changing any component changes the behaviour of others, so a contemporaneous causal explanation is rarely supported by controlled evidence. This is both the legally riskier record and the less reliable one.',
  },
  {
    id: 'counterfactual',
    label: 'Counterfactual feasibility',
    hazard:
      'Concedes that a safer alternative design was reasonably available, which is one of the elements a design-defect claim has to establish under a risk-utility approach. This is the most expensive sentence type an engineering ticket can contain.',
  },
  {
    id: 'legal',
    label: 'Legal conclusion',
    hazard:
      'States a legal conclusion the ticket’s author has no authority to reach. It will be read as the firm’s position, and it converts an operational record into an admission.',
  },
]

export interface Rule {
  readonly category: Category
  /** Matched case-insensitively at word boundaries. Longest match wins. */
  readonly phrases: readonly string[]
  /** What to write instead. */
  readonly substitute: string
  /** Shown where the flag needs qualifying rather than simply asserting. */
  readonly note?: string
}

export const rules: readonly Rule[] = [
  {
    category: 'fault',
    phrases: [
      'obviously failed',
      'clearly failed',
      'at fault',
      'our fault',
      'our mistake',
      'we knew',
      'we were aware',
      'should have known',
      'dropped the ball',
      'screwed up',
      'we missed',
      'oversight on our part',
      'the guardrail failed',
      'the model failed',
      'the classifier failed',
    ],
    substitute:
      'State the observation instead: which component fired, when, and against which threshold. “The guardrail activated at +1.842s, after the output was served.”',
  },
  {
    category: 'fault',
    phrases: ['failed', 'failure of'],
    substitute:
      'Where the word describes a measured state, name the measurement: “returned a non-2xx response”, “exceeded the latency budget”, “activated after the output was served”.',
    note: 'A technical use of “failed” describing a system state may be perfectly legitimate. What is hazardous is using it to characterise the safety architecture or a team. Read the sentence and decide which one you wrote.',
  },
  {
    category: 'harm',
    phrases: [
      'harmful advice',
      'harmful output',
      'harmful',
      'dangerous',
      'unsafe output',
      'unsafe',
      'injured',
      'injury',
      'hurt the user',
      'damaging',
      'bad advice',
      'toxic',
    ],
    substitute:
      'Record what the instrument measured and what policy applied: “classifier score 0.31 against a deployment threshold of 0.60, policy version 2026.07.3”. The harm question is Channel Two’s.',
  },
  {
    category: 'causal',
    phrases: [
      'because the model',
      'because of the model',
      'due to the defect',
      'due to a defect',
      'root cause was',
      'caused the harm',
      'caused by',
      'caused',
      'resulted from',
      'led to the harm',
      'as a result of our',
      'this happened because',
    ],
    substitute:
      'Separate the observation from the explanation. State the sequence and the measurements; if a causal account is needed, it belongs in the counsel-directed channel where it can be tested.',
  },
  {
    category: 'counterfactual',
    phrases: [
      'we should have',
      'should have been',
      'could have prevented',
      'could have been prevented',
      'a safer design',
      'safer alternative',
      'if we had',
      'would have avoided',
      'was avoidable',
      'entirely avoidable',
      'known issue',
    ],
    substitute:
      'Describe the change being made, not the change that was not made: “lower deploy_threshold on this slice to 0.75; add regression test at confidence < 0.35”.',
  },
  {
    category: 'legal',
    phrases: [
      'liable',
      'liability',
      'negligent',
      'negligence',
      'defective',
      'defect in the model',
      'breach of duty',
      'non-compliant',
      'violated',
      'in breach',
    ],
    substitute:
      'Remove it. If an assessment of exposure or compliance is required, it is made by counsel in the privileged channel and does not return to the ticket.',
  },
]

/** The field skeleton the paper recommends. Templating is what prevents the prose. */
export const template = {
  heading: 'The templated ticket',
  lead: 'The discipline is not a matter of writing more carefully. It is a matter of templated fields, because practitioners under-document when documentation is unmandated, unrewarded and separate from the workflow. A ticket built from these fields produces the measurement form without asking an engineer to make a legal characterisation.',
  fields: [
    {
      name: 'Observed metric and window',
      example: 'clf_confidence 0.31 vs threshold 0.60; 7d window',
    },
    { name: 'Implicated model or service', example: 'asst-4.2, policy_version 2026.07.3' },
    { name: 'Affected slice or population', example: 'health_advice_longform' },
    { name: 'Change requested', example: 'lower deploy_threshold on this slice to 0.75' },
    {
      name: 'Regression test that demonstrates completion',
      example: 'no output below confidence 0.35 without prior guardrail activation',
    },
    { name: 'Owner', example: 'platform-safety' },
    { name: 'Release gate', example: 'blocks 2026.08.0' },
  ],
  cite: 'Paper §2.2.3 and §3.2.1',
} as const

/** Loaded when the reader has nothing to paste. Simulated. */
export const sample = `Postmortem SAFE-2291

The guardrail obviously failed here. The model gave harmful advice to a user on
the health_advice_longform slice and the classifier score was way too low. This
was caused by an unreviewed threshold that we should have lowered back in April
when the red team flagged it — we knew this could happen and shipped anyway.

Honestly this was entirely avoidable and the safety architecture was at fault. A
safer design would have gated this slice. We are probably liable if this user
complains.

Fix: lower the threshold and add a test.`

export const linterCopy = {
  section: '08',
  eyebrow: 'Take it to your GC',
  headline: 'Two entries can record the same event. Only one of them is an admission.',
  standfirst:
    'Paste an incident ticket, a postmortem, or a message you are about to send. This flags the phrases that would be read as the firm’s own findings and proposes the measurement form instead. It is the smallest piece of the architecture and the one a team can adopt on Monday without asking anyone’s permission.',
  privacyTitle: 'This runs entirely in your browser.',
  privacyBody:
    'The text you paste is never transmitted. There is no server to send it to: the rules are compiled into the page, the matching happens in your tab, and the page makes no network requests after it loads. You can check that in your own devtools, and you should, because nobody sensible pastes a real incident ticket into something that phones home.',
  inputLabel: 'Your ticket',
  placeholder: 'Paste an incident ticket, a postmortem, or a Slack message.',
  loadSample: 'Load an example',
  clear: 'Clear',
  emptyState:
    'Nothing to check yet. Paste something above, or load the example to see what the rules catch.',
  cleanState:
    'No flagged phrases. This reads as measurement rather than characterisation, which is what a produced record should look like.',
  flagsLabel: 'Flagged phrases',
  annotatedLabel: 'Your text, annotated',
  substituteLabel: 'Write this instead',
  countSuffix: 'phrases would be read as the firm’s own findings',
  countSuffixOne: 'phrase would be read as the firm’s own finding',
  standaloneNote: 'This tool is also at /linter, so it can be shared on its own.',
  backToSite: 'The full explainer',
} as const

export const linterArgues = {
  label: 'What the linter argues',
  body: [
    'The distinction it enforces is not a litigation trick. A causal explanation recorded in the moment of observation is rarely supported by controlled evidence, because in entangled machine-learning systems changing any component changes the behaviour of others. The factual entry is therefore both the legally safer record and the more accurate one, and the causal question it defers is answered in the channel designed to answer it.',
    'It is also the only part of this architecture that costs nothing to adopt. A firm that never builds a tripwire, never separates a channel and never speaks to its general counsel about any of this can still template its ticket fields, and doing so removes the single most common way an engineering record turns into an admission.',
  ],
} as const
