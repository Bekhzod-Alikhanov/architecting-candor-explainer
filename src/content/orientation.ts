/**
 * 00 — The orientation block and the five-minute version.
 *
 * U2: ~12,300 words and eight instruments, with no "what this is / who it's
 * for / how long" and no summary path. This sits between the seam demo and
 * "What follows" (hero.ts's `memo.onward`) as a document object, so it reads
 * as the memo's own summary rather than as site chrome bolted on top of it.
 *
 * Every sentence in `express.steps` is one movement of the paper's executive
 * summary, in order, and each links to the section that makes it — so a
 * reader who has five minutes can read this block alone and be accurate about
 * the argument, not just aware of it.
 */

import type { SectionId } from './site'

export interface HowItem {
  readonly label: string
  readonly value: string
}

export interface ExpressStep {
  readonly text: string
  /** Section anchor the sentence links to. */
  readonly href: `#${string}`
  /** The section id, for deriving the "→ 01 The pincer" label from the
   *  section register rather than repeating the number and title here,
   *  where they could drift from it. */
  readonly ref: SectionId
  /** The paper citation shown in the provenance mono register. */
  readonly cite: string
}

export const orientation = {
  eyebrow: 'How to read this',

  what: {
    label: 'What this is',
    body: "A companion to Architecting Candor, a paper from the Arcadia Impact AI Governance Taskforce, August 2026. It does not summarise the paper's mechanism; it runs it. Every case, statute, date and figure on this page traces to the paper, and anything the paper does not supply is marked on the screen that shows it.",
  },

  who: {
    label: 'Who it is for',
    body: 'Engineers and safety leads who write incident records, the counsel who will be asked to defend them, and the boards whose oversight depends on them. Nothing here is legal advice.',
  },

  how: {
    label: 'How long it takes',
    items: [
      { label: 'Read it end to end', value: 'about an hour' },
      { label: 'Run the mechanism, sections 03 to 05', value: 'about fifteen minutes' },
      { label: 'Watch the explainer', value: 'nine and a half minutes' },
      { label: 'Read the five-minute version', value: 'below' },
    ] as const satisfies readonly HowItem[],
  },

  express: {
    label: 'The five-minute version',
    intro:
      'Five sentences, one per movement of the argument. Each one links to the section that makes it.',
    steps: [
      {
        text: 'Regulation and fiduciary duty now compel AI developers to write their systems’ failures down, and American civil discovery lets a plaintiff compel production of exactly those documents. The paper calls the bind the Documentation Paradox.',
        href: '#pincer',
        ref: 'pincer',
        cite: 'Paper, executive summary I',
      },
      {
        text: "Courts are reclassifying AI systems as products, and under products liability a firm's own safety records become the central evidence of defect, of notice and of a feasible alternative design.",
        href: '#pincer',
        ref: 'pincer',
        cite: 'Paper, executive summary II',
      },
      {
        text: 'Inside a firm the response is predictable: the signal degrades as it moves between engineers, counsel and the board, anomalies are normalised, and people stop writing things down.',
        href: '#signal',
        ref: 'signal',
        cite: 'Paper, executive summary III and §2',
      },
      {
        text: "The paper's answer is a three-channel Safety Translation Layer: a factual record that is discoverable by design, a privileged channel for counsel's causal analysis that opens only when a pre-committed telemetry tripwire is crossed, and a remediation record written in engineering language.",
        href: '#architecture',
        ref: 'architecture',
        cite: 'Paper, executive summary V',
      },
      {
        text: 'Aviation and healthcare resolved the same paradox by statute. The paper asks legislatures to give AI incident reporting the same protection, and asks firms to build the architecture now, because existing law already permits it.',
        href: '#regimes',
        ref: 'regimes',
        cite: 'Paper, executive summary VI',
      },
    ] as const satisfies readonly ExpressStep[],
    outro: 'That is the whole argument. The sections below earn it.',
  },
} as const
