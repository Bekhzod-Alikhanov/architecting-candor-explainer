import { useCallback, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { Scaffold } from '../../components/Scaffold'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Seam } from '../../components/Seam'
import {
  nodes,
  objects,
  arrows,
  plainly,
  architectureCopy as copy,
  architectureSteps,
  architectureArgues,
  type NodeId,
} from '../../content/channels'
import { resolveFlow, nodeName, type ValveResult } from '../../lib/valve'
import './architecture.css'

/**
 * 04 — The architecture, operable.
 *
 * Figure 1 as a machine. The reader selects an object and a destination; the
 * valve answers and states its reason. Refusals are physical: the object is
 * pushed back and the seam flashes with the refusal in it.
 *
 * Every attempt, permitted or refused, is appended to a log that cannot be
 * cleared, which is the architecture's own rule applied to the reader.
 */

interface Attempt extends ValveResult {
  readonly seq: number
}

/** Which step preselects which object, so the guided walk moves the machine. */
const STEP_OBJECT: readonly (string | null)[] = [
  'fact',
  'causal',
  'instruction',
  'verification',
  null,
]

export function Architecture() {
  const [selectedId, setSelectedId] = useState<string>('fact')
  const [result, setResult] = useState<ValveResult | null>(null)
  const [log, setLog] = useState<readonly Attempt[]>([])
  const [step, setStep] = useState(0)
  const [pulse, setPulse] = useState(0)

  const selected = objects.find((o) => o.id === selectedId) ?? objects[0]!
  const seamState = result ? (result.allowed ? 'live' : 'refuse') : 'idle'

  // Only the seam adjacent to the boundary being crossed carries the refusal
  // text. Showing it on both covers the very channel description the reader
  // needs in order to understand the refusal.
  const reasonSeam = !result || result.allowed ? -1 : result.to === 'three' ? 1 : 0

  const onStep = useCallback((i: number) => {
    setStep(i)
    const preset = STEP_OBJECT[i]
    if (preset) {
      setSelectedId(preset)
      setResult(null)
    }
  }, [])

  /** Which object is mid-drag, and which destination it is hovering over. */
  const [dragId, setDragId] = useState<string | null>(null)
  const [overNode, setOverNode] = useState<NodeId | null>(null)

  const attempt = useCallback(
    // A drop names its own object; a click uses whatever is selected.
    (to: NodeId, objectId?: string) => {
      const id = objectId ?? selectedId
      if (objectId) setSelectedId(objectId)
      const r = resolveFlow(id, to)
      setResult(r)
      setLog((prev) => [{ ...r, seq: prev.length + 1 }, ...prev])
      // Re-trigger the push-back animation even on a repeated identical attempt.
      setPulse((n) => n + 1)
      setDragId(null)
      setOverNode(null)
    },
    [selectedId],
  )

  const channels = nodes.filter((n) => n.side === 'channel' && n.id !== 'one-overwrite')
  const outward = nodes.filter((n) => n.side === 'outward')
  const overwrite = nodes.find((n) => n.id === 'one-overwrite')!

  return (
    <section className="sect page" id="architecture" aria-labelledby="arch-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={5}
        titleId="arch-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />

      <Scaffold
        steps={architectureSteps}
        current={step}
        onChange={onStep}
        label={copy.scaffoldLabel}
        hint={copy.scaffoldHint}
        className="arch__scaffold"
      />

      {/* The objects. */}
      <div className="arch__tray">
        <p className="arch__trayLabel">{copy.objectsLabel}</p>
        <div className="arch__objects" role="radiogroup" aria-label={copy.chooseObject}>
          {objects.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === selectedId}
              className="obj"
              data-kind={o.kind}
              data-selected={o.id === selectedId}
              data-refused={
                o.id === selectedId && result && !result.allowed ? String(pulse) : undefined
              }
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', o.id)
                e.dataTransfer.effectAllowed = 'move'
                setDragId(o.id)
                setSelectedId(o.id)
                setResult(null)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverNode(null)
              }}
              onClick={() => {
                setSelectedId(o.id)
                setResult(null)
              }}
            >
              <span className="obj__home">{nodeName(o.home)}</span>
              <span className="obj__label">{o.label}</span>
            </button>
          ))}
        </div>
        <p className="arch__objText">{selected.text}</p>
      </div>

      {/* The machine. */}
      <div className="arch__machine">
        <p className="arch__targetsLabel">
          {copy.targetsLabel} <span>{copy.chooseTarget}</span>
        </p>

        <div className="arch__channels">
          {channels.map((n, i) => (
            <div className="arch__slot" key={n.id}>
              <ChannelBox
                node={n}
                isHome={selected.home === n.id}
                onAttempt={() => attempt(n.id)}
                onDropObject={(objectId) => attempt(n.id, objectId)}
                isOver={overNode === n.id}
                onOver={() => setOverNode(n.id)}
                onLeave={() => setOverNode((c) => (c === n.id ? null : c))}
                lastResult={result?.to === n.id ? result : null}
              >
                {n.id === 'one' ? (
                  <button
                    type="button"
                    className="arch__overwrite"
                    onClick={() => attempt('one-overwrite')}
                    data-last={result?.to === 'one-overwrite' ? 'refused' : undefined}
                    data-over={overNode === 'one-overwrite' ? 'true' : undefined}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.dataTransfer.dropEffect = 'move'
                      setOverNode('one-overwrite')
                    }}
                    onDragLeave={() => setOverNode((c) => (c === 'one-overwrite' ? null : c))}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const id = e.dataTransfer.getData('text/plain') || dragId
                      if (id) attempt('one-overwrite', id)
                      setOverNode(null)
                      setDragId(null)
                    }}
                  >
                    <span className="arch__overwriteName">{overwrite.name}</span>
                    <span className="arch__overwriteSub">{copy.overwriteAction}</span>
                    <span className="arch__overwriteStatus">{overwrite.status}</span>
                  </button>
                ) : null}
              </ChannelBox>

              {i < channels.length - 1 ? (
                <Seam
                  state={seamState}
                  reason={reasonSeam === i ? result?.title ?? null : null}
                  className="arch__seam"
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* The arrows. Each one explains itself. */}
        <ul className="arch__arrows" aria-label={copy.arrowsLabel}>
          {arrows.map((a) => (
            <li key={a.id}>
              <details className="arrow">
                <summary className="arrow__summary">
                  <span className="arrow__route">
                    {nodeName(a.from as NodeId)} <span aria-hidden="true">→</span>{' '}
                    {nodeName(a.to as NodeId)}
                  </span>
                  <span className="arrow__label">{a.label}</span>
                </summary>
                <div className="arrow__body">
                  <p className="arrow__title">{a.title}</p>
                  <p className="arrow__reason">{a.reason}</p>
                  {'authority' in a && a.authority ? (
                    <p className="arrow__authority">{a.authority}</p>
                  ) : null}
                </div>
              </details>
            </li>
          ))}
        </ul>

        <p className="arch__outwardLabel">{copy.outwardLabel}</p>
        <div className="arch__outward">
          {outward.map((n) => (
            <ChannelBox
              key={n.id}
              node={n}
              isHome={false}
              onAttempt={() => attempt(n.id)}
              onDropObject={(objectId) => attempt(n.id, objectId)}
              isOver={overNode === n.id}
              onOver={() => setOverNode(n.id)}
              onLeave={() => setOverNode((c) => (c === n.id ? null : c))}
              lastResult={result?.to === n.id ? result : null}
            />
          ))}
        </div>
      </div>

      {/* The valve's answer. */}
      <div
        className="valve"
        data-state={result ? (result.allowed ? 'allowed' : 'refused') : 'idle'}
        aria-live="polite"
      >
        {result ? (
          <>
            <p className="valve__head">
              <span className="valve__badge">
                {result.allowed ? copy.allowedBadge : copy.refusedBadge}
              </span>
              <span className="valve__route">
                {selected.label} <span aria-hidden="true">→</span> {nodeName(result.to)}
              </span>
            </p>
            <p className="valve__title">{result.title}</p>
            <p className="valve__reason">{result.reason}</p>
            {result.authority ? <p className="valve__authority">{result.authority}</p> : null}
            {result.closesLoop ? (
              <p className="valve__loop">
                <span aria-hidden="true">↻</span> {copy.loopNote}
              </p>
            ) : null}
          </>
        ) : (
          <p className="valve__idle">{copy.valveIdle}</p>
        )}
      </div>

      {/* Stated plainly, because these are the load-bearing claims. */}
      <ul className="arch__plainly">
        {plainly.map((p) => (
          <li key={p.slice(0, 24)}>{p}</li>
        ))}
      </ul>

      {/* The attempt log. Append-only, like everything else here. */}
      <div className="arch__log">
        <div className="arch__logHead">
          <h3 className="arch__logTitle">{copy.logLabel}</h3>
          <p className="arch__logNote">{copy.logNote}</p>
        </div>
        {log.length === 0 ? (
          <p className="arch__logEmpty">{copy.logEmpty}</p>
        ) : (
          <ol className="arch__logList">
            {log.map((a) => (
              <li className="arch__logItem" key={a.seq} data-allowed={a.allowed}>
                <span className="arch__logSeq" data-figure>
                  {String(a.seq).padStart(3, '0')}
                </span>
                <span className="arch__logVerdict">{a.allowed ? 'permitted' : 'refused'}</span>
                <span className="arch__logRoute">
                  {objects.find((o) => o.id === a.objectId)?.label} → {nodeName(a.to)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ArguesBlock label={architectureArgues.label} body={architectureArgues.body} />
    </section>
  )
}

function ChannelBox({
  node,
  isHome,
  onAttempt,
  onDropObject,
  isOver,
  onOver,
  onLeave,
  lastResult,
  children,
}: {
  readonly node: (typeof nodes)[number]
  readonly isHome: boolean
  readonly onAttempt: () => void
  readonly onDropObject: (objectId: string) => void
  readonly isOver: boolean
  readonly onOver: () => void
  readonly onLeave: () => void
  readonly lastResult: ValveResult | null
  readonly children?: React.ReactNode
}) {
  return (
    <div
      className="cbox"
      data-node={node.id}
      data-side={node.side}
      data-home={isHome}
      data-over={isOver ? 'true' : undefined}
      data-last={lastResult ? (lastResult.allowed ? 'allowed' : 'refused') : undefined}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onOver()
      }}
      onDragLeave={onLeave}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDropObject(id)
        onLeave()
      }}
    >
      <button
        type="button"
        className="cbox__hit"
        onClick={onAttempt}
        aria-label={`${copy.sendTo} ${node.name}`}
      >
        <span className="cbox__name">{node.name}</span>
        <span className="cbox__sub">{node.sub}</span>
      </button>
      <p className="cbox__body">{node.body}</p>
      <p className="cbox__status">{node.status}</p>
      {node.authority ? <p className="cbox__authority">{node.authority}</p> : null}
      {isHome ? <p className="cbox__home">{copy.homeNote}</p> : null}
      {children}
    </div>
  )
}
