import { objects, nodes, type NodeId } from '../content/channels'

/**
 * The one-way valve.
 *
 * Facts may flow inward and be consumed by analysis. Analysis may return only a
 * bounded operational instruction. Causal conclusions, fault characterisations
 * and litigation assessments do not cross outward, and nothing overwrites the
 * pre-remediation state.
 */

export interface ValveResult {
  readonly allowed: boolean
  readonly title: string
  readonly reason: string
  readonly authority: string | null
  readonly objectId: string
  readonly to: NodeId
  /** True when the flow closes the incident-to-regression-test loop. */
  readonly closesLoop: boolean
}

export function resolveFlow(objectId: string, to: NodeId): ValveResult {
  const object = objects.find((o) => o.id === objectId)
  if (!object) throw new Error(`Unknown object "${objectId}"`)

  const base = { objectId, to, closesLoop: object.id === 'regression' && to === 'one' }

  if (to === object.home) {
    return {
      ...base,
      allowed: true,
      title: 'Already there.',
      reason: 'This is where the object lives. Choose somewhere else to see what the valve does.',
      authority: null,
      closesLoop: false,
    }
  }

  const allowed = object.allow.find((r) => r.to === to)
  if (allowed) {
    return {
      ...base,
      allowed: true,
      title: allowed.title,
      reason: allowed.reason,
      authority: allowed.authority ?? null,
    }
  }

  const refused = object.refuse.find((r) => r.to === to)
  if (refused) {
    return {
      ...base,
      allowed: false,
      title: refused.title,
      reason: refused.reason,
      authority: refused.authority ?? null,
      closesLoop: false,
    }
  }

  return {
    ...base,
    allowed: false,
    title: object.defaultRefusal.title,
    reason: object.defaultRefusal.reason,
    authority: object.defaultRefusal.authority ?? null,
    closesLoop: false,
  }
}

export function nodeName(id: NodeId): string {
  return nodes.find((n) => n.id === id)?.name ?? id
}

/** Every refusal the architecture can produce, for the coverage check. */
export function allRefusals(): ValveResult[] {
  const out: ValveResult[] = []
  for (const o of objects) {
    for (const n of nodes) {
      if (n.id === o.home) continue
      const r = resolveFlow(o.id, n.id)
      if (!r.allowed) out.push(r)
    }
  }
  return out
}
