import { useCallback, useMemo, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { Scaffold } from '../../components/Scaffold'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Prov } from '../../components/Provenance'
import { ArtifactCard } from './ArtifactCard'
import { Scoreboards } from './Scoreboards'
import { Ledger } from './Ledger'
import { Reveal } from './Reveal'
import { deck, bins, scenario, type Bin } from '../../content/artifacts'
import {
  routeCopy,
  routeSteps,
  routeArgues,
  runLabel,
  replayLabel,
  revealLabel,
  bestRun,
} from '../../content/grading'
import { a11y } from '../../content/ui'
import { grade, type Assignment } from '../../lib/grade'
import './route.css'

/**
 * 03 — Route the record.
 *
 * The reader is handed an unfolding incident and decides where each piece of
 * knowledge goes, including into the fourth bin, which is the strategy most
 * readers arrive believing in. Two scoreboards grade the result and pull in
 * opposite directions. Only after the reader has run their own routing does the
 * four-strategy comparison appear.
 *
 * Interaction model, in this order of primacy:
 *   1. select a card, then press 1–4, or activate a bin
 *   2. click or tap a card, then click or tap a bin
 *   3. drag a card onto a bin, where the pointer supports it
 * The first two work identically on keyboard, mouse and touch.
 */

/** The three instrumentation records are pre-routed: nobody chose to create them. */
const PRESET: Assignment = {
  'tel-inference': 'one',
  'tel-guardrail': 'one',
  'tel-drift': 'one',
}

export function RouteTheRecord() {
  const [assignment, setAssignment] = useState<Assignment>(PRESET)
  // A listbox using aria-activedescendant must always have an active option,
  // and an instrument should never open with nothing selected.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => deck.find((a) => PRESET[a.id] === undefined)?.id ?? null,
  )
  const [step, setStep] = useState(0)
  const [hasRun, setHasRun] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overBin, setOverBin] = useState<Bin | null>(null)
  const [announcement, setAnnouncement] = useState('')
  /**
   * The reader's best run, in component state only. A run beats another on the
   * record an engineer could still reconstruct, then on adverse outcomes, then
   * on warnings — which is the order the two scoreboards are meant to be read in.
   */
  const [best, setBest] = useState<BestRun | null>(null)

  const unrouted = useMemo(() => deck.filter((a) => assignment[a.id] === undefined), [assignment])
  const routedCount = deck.length - unrouted.length
  const complete = unrouted.length === 0
  const result = useMemo(() => grade(assignment), [assignment])

  const selected = selectedId ? (deck.find((a) => a.id === selectedId) ?? null) : null

  const route = useCallback(
    (id: string, bin: Bin) => {
      const artifact = deck.find((a) => a.id === id)
      if (!artifact) return
      setAssignment((prev) => ({ ...prev, [id]: bin }))
      const binName = bins.find((b) => b.id === bin)?.name ?? bin
      setAnnouncement(`${artifact.kind} routed to ${binName}.`)
      // Keep the queue moving. Select whatever now occupies the position the
      // routed card just left, so working down the list stays continuous
      // instead of throwing the reader back to the top each time.
      const before = deck.filter((a) => assignment[a.id] === undefined)
      const at = before.findIndex((a) => a.id === id)
      const remaining = before.filter((a) => a.id !== id)
      const next = remaining[Math.min(at, remaining.length - 1)]
      setSelectedId(next?.id ?? null)
      setHasRun(false)
      setShowReveal(false)
    },
    [assignment],
  )

  const unroute = useCallback((id: string) => {
    const artifact = deck.find((a) => a.id === id)
    setAssignment((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelectedId(id)
    setAnnouncement(a11y.returnedAnnouncement(artifact?.kind ?? 'Artifact'))
    setHasRun(false)
    setShowReveal(false)
  }, [])

  const reset = useCallback(() => {
    setAssignment(PRESET)
    setSelectedId(deck.find((a) => PRESET[a.id] === undefined)?.id ?? null)
    setHasRun(false)
    setShowReveal(false)
    setStep(0)
    setAnnouncement(routeCopy.resetAnnouncement)
  }, [])

  const runRequest = useCallback(() => {
    setHasRun(true)
    const run: BestRun = {
      remediation: result.remediationScore,
      total: result.remediationTotal,
      adverse: result.adverseCount,
      flags: result.flagCount,
    }
    setBest((prev) => (prev === null || beats(run, prev) ? run : prev))
  }, [result])

  /** Keyboard: 1–4 route the selection, Backspace returns it, arrows move it. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key >= '1' && e.key <= '4') {
        if (!selectedId) return
        const bin = bins[Number(e.key) - 1]
        if (!bin) return
        e.preventDefault()
        route(selectedId, bin.id)
        return
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId && assignment[selectedId]) {
        e.preventDefault()
        unroute(selectedId)
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const pool = unrouted.length > 0 ? unrouted : deck
        if (pool.length === 0) return
        e.preventDefault()
        const at = pool.findIndex((a) => a.id === selectedId)
        const next =
          e.key === 'ArrowDown'
            ? pool[at < 0 ? 0 : Math.min(at + 1, pool.length - 1)]
            : pool[at < 0 ? 0 : Math.max(at - 1, 0)]
        if (next) setSelectedId(next.id)
      }
    },
    [selectedId, assignment, unrouted, route, unroute],
  )

  return (
    <section className="sect page" id="route" aria-labelledby="route-title">
      <SectionHead
        n={routeCopy.section}
        eyebrow={routeCopy.eyebrow}
        seq={4}
        titleId="route-title"
        headline={routeCopy.headline}
        standfirst={routeCopy.standfirst}
      />

      <div className="rt__scenario">
        <div className="rt__scenarioHead">
          <h3 className="rt__scenarioTitle">{scenario.heading}</h3>
          <Prov kind="simulated" label={routeCopy.scenarioProv} />
        </div>
        <ul className="rt__scenarioLines">
          {scenario.lines.map((l) => (
            <li key={l.slice(0, 20)}>{l}</li>
          ))}
        </ul>
        <p className="rt__scenarioNote">{scenario.note}</p>
      </div>

      <Scaffold
        steps={routeSteps}
        current={step}
        onChange={setStep}
        label={routeCopy.scaffoldLabel}
        hint={routeCopy.keyboardHint}
        className="rt__scaffold"
      />

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="rt" onKeyDown={onKeyDown}>
        <div className="rt__work">
          <div className="rt__queue">
            <div className="rt__queueHead">
              <h3 className="rt__queueTitle">
                {routeCopy.unroutedLabel}{' '}
                <span data-figure>
                  {unrouted.length} of {deck.length}
                </span>
              </h3>
              <p className="rt__queueHint">{routeCopy.keyboardHint}</p>
            </div>

            {unrouted.length > 0 ? (
              <ul
                className="rt__cards"
                // A listbox is `<ul role="listbox">` with `<li role="option">` children per
                // the ARIA authoring practices. The rule's suggested div would lose the list
                // semantics for no gain, so the diagnostic is suppressed on the next line.
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA APG listbox
                role="listbox"
                tabIndex={0}
                aria-label={routeCopy.listboxLabel}
                {...(selectedId && assignment[selectedId] === undefined
                  ? { 'aria-activedescendant': `card-${selectedId}` }
                  : {})}
              >
                {unrouted.map((a) => (
                  <ArtifactCard
                    key={a.id}
                    artifact={a}
                    selected={a.id === selectedId}
                    bin={null}
                    onSelect={() => setSelectedId(a.id)}
                    onDragStart={() => setDragId(a.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverBin(null)
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="rt__queueDone">{routeCopy.queueDone}</p>
            )}
          </div>

          <div className="rt__bins" role="group" aria-label={routeCopy.binsLabel}>
            {bins.map((b, i) => {
              const held = deck.filter((a) => assignment[a.id] === b.id)
              return (
                <div
                  className="bin"
                  key={b.id}
                  data-bin={b.id}
                  data-over={overBin === b.id}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setOverBin(b.id)
                  }}
                  onDragLeave={() => setOverBin((cur) => (cur === b.id ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain') || dragId
                    if (id) route(id, b.id)
                    setOverBin(null)
                    setDragId(null)
                  }}
                >
                  <button
                    type="button"
                    className="bin__head"
                    onClick={() => {
                      if (selectedId) route(selectedId, b.id)
                    }}
                    disabled={!selectedId}
                    aria-label={a11y.routeToBin(b.name, i + 1)}
                  >
                    <span className="bin__key" aria-hidden="true">
                      {b.n}
                    </span>
                    <span className="bin__names">
                      <span className="bin__name">{b.name}</span>
                      <span className="bin__sub">{b.sub}</span>
                    </span>
                    <span className="bin__count" data-figure>
                      {held.length}
                    </span>
                  </button>

                  <p className="bin__hint">{b.hint}</p>

                  <ul className="bin__held">
                    {held.map((a) => (
                      <li className="chip" key={a.id} data-selected={a.id === selectedId}>
                        <button
                          type="button"
                          className="chip__select"
                          onClick={() => setSelectedId(a.id)}
                          aria-label={a11y.selectCard(a.kind, b.name)}
                        >
                          {a.kind}
                        </button>
                        <button
                          type="button"
                          className="chip__remove"
                          onClick={() => unroute(a.id)}
                          aria-label={a11y.returnToQueue(a.kind)}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {selected ? (
            <aside className="rt__selected doc-object doc-object--scanned on-doc">
              <p className="rt__selectedKind">{selected.kind}</p>
              <p className="rt__selectedTitle">{selected.title}</p>
              <p className="rt__selectedText">{selected.text}</p>
              <p className="rt__selectedMeta">
                {selected.source} · {selected.timestamp} · {selected.author}
              </p>
            </aside>
          ) : null}
        </div>

        <div className="rt__boards">
          <Scoreboards grade={result} routedCount={routedCount} total={deck.length} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="rt__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={runRequest}
          disabled={!complete}
        >
          {hasRun ? replayLabel : runLabel}
        </button>
        {!complete ? (
          <span className="rt__actionsHint">
            {unrouted.length} {routeCopy.actionsHint}
          </span>
        ) : null}
        {hasRun && !showReveal ? (
          <button type="button" className="btn" onClick={() => setShowReveal(true)}>
            {revealLabel}
          </button>
        ) : null}
        {routedCount > 3 ? (
          <button type="button" className="btn" onClick={reset}>
            {routeCopy.resetLabel}
          </button>
        ) : null}
      </div>

      {best ? (
        <div className="bestrun" aria-live="polite">
          <p className="bestrun__label">{bestRun.label}</p>
          <p className="bestrun__figures">
            <span data-figure>
              {best.remediation}/{best.total}
            </span>{' '}
            {bestRun.remediation}
            <span className="bestrun__sep" aria-hidden="true">
              ·
            </span>
            <span data-figure>{best.adverse}</span> {bestRun.adverse}
            <span className="bestrun__sep" aria-hidden="true">
              ·
            </span>
            <span data-figure>{best.flags}</span> {bestRun.warnings}
          </p>
          <p className="bestrun__verdict">
            {sameAs(currentRun(result), best) ? bestRun.atBest : bestRun.behind}
          </p>
          <p className="bestrun__note">{bestRun.note}</p>
        </div>
      ) : null}

      {hasRun ? <Ledger grade={result} /> : null}

      {showReveal ? (
        <Reveal readerGrade={result} readerRouted={routedCount} total={deck.length} />
      ) : null}

      {/* The argument closes the section only after the reader has run their own
          routing. Nobody gets lectured before they have played. */}
      {hasRun ? <ArguesBlock label={routeArgues.label} body={routeArgues.body} /> : null}
    </section>
  )
}

interface BestRun {
  readonly remediation: number
  readonly total: number
  readonly adverse: number
  readonly flags: number
}

function currentRun(g: ReturnType<typeof grade>): BestRun {
  return {
    remediation: g.remediationScore,
    total: g.remediationTotal,
    adverse: g.adverseCount,
    flags: g.flagCount,
  }
}

/** More of the record recoverable wins; then fewer adverse outcomes; then fewer warnings. */
function beats(a: BestRun, b: BestRun): boolean {
  if (a.remediation !== b.remediation) return a.remediation > b.remediation
  if (a.adverse !== b.adverse) return a.adverse < b.adverse
  return a.flags < b.flags
}

function sameAs(a: BestRun, b: BestRun): boolean {
  return a.remediation === b.remediation && a.adverse === b.adverse && a.flags === b.flags
}
