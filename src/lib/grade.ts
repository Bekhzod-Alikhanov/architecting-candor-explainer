import {
  deck,
  privilegeRulings,
  recordFields,
  type Artifact,
  type Bin,
  type RecordField,
} from '../content/artifacts'
import {
  flags as flagCopy,
  rule407Caveat,
  spoliationAuthority,
  spoliationReason,
  strategies,
  type FlagKind,
  type Outcome,
} from '../content/grading'

/**
 * The grader.
 *
 * One pure function. The reader's routing and all four canned strategies go
 * through it, which is what makes the comparison honest: the strategies are not
 * described, they are run.
 */

export interface Flag {
  readonly kind: FlagKind
  readonly label: string
  readonly text: string
}

export interface Verdict {
  readonly artifact: Artifact
  readonly bin: Bin
  readonly outcome: Outcome
  /** Named authority. Every pierce and every survival has one. */
  readonly authority: string | null
  readonly reason: string
  readonly caveat: string | null
  readonly flags: readonly Flag[]
}

export interface FieldStatus {
  readonly id: RecordField
  readonly label: string
  readonly available: boolean
  /** Present only when the field is missing. */
  readonly consequence: string | null
}

export interface Grade {
  readonly verdicts: readonly Verdict[]
  readonly counts: Readonly<Record<Outcome, number>>
  readonly adverseCount: number
  readonly fields: readonly FieldStatus[]
  readonly remediationScore: number
  readonly remediationTotal: number
  readonly flagCount: number
}

export type Assignment = Readonly<Record<string, Bin>>

function flag(kind: FlagKind): Flag {
  const c = flagCopy[kind]
  return { kind, label: c.label, text: c.text }
}

/**
 * Channel Two has bounded membership and controlled distribution, so anything
 * filed there is out of engineering's reach. Channels One and Three are where
 * an engineer can actually find a record six months later.
 */
const ENGINEERING_REACH: readonly Bin[] = ['one', 'three']

function verdictFor(artifact: Artifact, bin: Bin): Verdict {
  const f: Flag[] = []

  if (bin === 'one') {
    if (artifact.legalAnalysis) f.push(flag('waiverRisk'))
    if (artifact.faultLanguage) f.push(flag('faultInDiscoverable'))
    return {
      artifact,
      bin,
      outcome: 'produced',
      authority: null,
      reason:
        'An ordinary-course business record. Produced, and under this architecture that is the intention rather than a failure.',
      caveat: null,
      flags: f,
    }
  }

  if (bin === 'two') {
    const ruling = privilegeRulings[artifact.id]
    if (!ruling) {
      throw new Error(`No privilege ruling for artifact "${artifact.id}". Add one to artifacts.ts.`)
    }
    // Facts routed into the privileged channel are pierced and simultaneously
    // removed from the people who need them. Both consequences are reported.
    if (!ruling.survives && artifact.supplies.length > 0) f.push(flag('factsRemoved'))
    return {
      artifact,
      bin,
      outcome: ruling.survives ? 'withheld' : 'pierced',
      authority: ruling.authority,
      reason: ruling.reason,
      caveat: ruling.caveat ?? null,
      flags: f,
    }
  }

  if (bin === 'three') {
    // The one-way valve: legal judgment must not travel outward into a
    // discoverable remediation record.
    if (artifact.legalAnalysis) {
      f.push(flag('valveViolation'))
      return {
        artifact,
        bin,
        outcome: 'produced',
        authority: null,
        reason:
          'Written into the remediation record, counsel’s assessment is an ordinary-course business document and is produced with the ticket.',
        caveat: null,
        flags: f,
      }
    }

    // A genuine engineering work order is a qualifying remedial measure.
    if (artifact.properBin === 'three') {
      if (artifact.faultLanguage) f.push(flag('admissionSurvives'))
      return {
        artifact,
        bin,
        outcome: 'excluded407',
        authority: 'Fed. R. Evid. 407',
        reason:
          'A qualifying subsequent remedial measure, barred from proving negligence, culpable conduct, product defect or a need for warning.',
        caveat: rule407Caveat,
        flags: f,
      }
    }

    // Everything else filed here is simply a business record in the wrong place.
    if (artifact.faultLanguage) f.push(flag('faultInDiscoverable'))
    return {
      artifact,
      bin,
      outcome: 'produced',
      authority: null,
      reason:
        'Not a remedial measure, so Rule 407 does not reach it. It remains an ordinary-course record, now filed where it is harder to find.',
      caveat: null,
      flags: f,
    }
  }

  // bin === 'none'
  if (artifact.suppression === 'impossible') {
    return {
      artifact,
      bin,
      outcome: 'produced',
      authority: null,
      reason:
        'Automatically captured. The record already existed when the decision was made, and it is produced regardless.',
      caveat: null,
      flags: [flag('autoCaptured')],
    }
  }

  if (artifact.suppression === 'spoliation') {
    return {
      artifact,
      bin,
      outcome: 'spoliation',
      authority: spoliationAuthority,
      reason: spoliationReason,
      caveat: null,
      flags: [],
    }
  }

  return {
    artifact,
    bin,
    outcome: 'notCreated',
    authority: null,
    reason:
      'Never written, so there is nothing to produce and nothing to withhold. The cost appears on the remediation scoreboard instead.',
    caveat: null,
    flags: [],
  }
}

export function grade(assignment: Assignment): Grade {
  const verdicts = deck
    .filter((a) => assignment[a.id] !== undefined)
    .map((a) => verdictFor(a, assignment[a.id] as Bin))

  const counts: Record<Outcome, number> = {
    produced: 0,
    withheld: 0,
    pierced: 0,
    excluded407: 0,
    spoliation: 0,
    notCreated: 0,
  }
  for (const v of verdicts) counts[v.outcome] += 1

  const reachable = new Set<RecordField>()
  for (const v of verdicts) {
    // Channels One and Three are where an engineer can find a record. So is an
    // auto-captured record the reader tried to suppress: instrumentation wrote
    // it to the append-only store, and the decision could not reach it.
    const inReach =
      ENGINEERING_REACH.includes(v.bin) ||
      (v.bin === 'none' && v.artifact.suppression === 'impossible')
    if (inReach) {
      for (const field of v.artifact.supplies) reachable.add(field)
    }
  }

  const fields: FieldStatus[] = recordFields.map((rf) => {
    const available = reachable.has(rf.id)
    return {
      id: rf.id,
      label: rf.label,
      available,
      consequence: available ? null : rf.missingConsequence,
    }
  })

  return {
    verdicts,
    counts,
    adverseCount: counts.pierced + counts.spoliation,
    fields,
    remediationScore: fields.filter((f) => f.available).length,
    remediationTotal: fields.length,
    flagCount: verdicts.reduce((n, v) => n + v.flags.length, 0),
  }
}

/** Route the whole deck by a strategy, then grade it. Same function, same rules. */
export function gradeStrategy(strategyId: string): Grade {
  const strategy = strategies.find((s) => s.id === strategyId)
  if (!strategy) throw new Error(`Unknown strategy "${strategyId}"`)
  const assignment: Record<string, Bin> = {}
  for (const a of deck) assignment[a.id] = strategy.assign(a.properBin)
  return grade(assignment)
}
