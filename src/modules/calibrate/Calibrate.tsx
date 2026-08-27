import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { Scaffold } from '../../components/Scaffold'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Prov } from '../../components/Provenance'
import { StreamChart } from './StreamChart'
import {
  dimensions,
  recommended,
  stream,
  readouts,
  calibrateCopy as copy,
  calibrateSteps,
  calibrateArgues,
  type DimensionId,
} from '../../content/thresholds'
import { a11y } from '../../content/ui'
import { evaluate, type Settings } from '../../lib/tripwire'
import { settingsFromLocation, writeSettingsToLocation } from '../../lib/calibration-url'
import './calibrate.css'

/**
 * 05 — Calibrate the tripwire.
 *
 * Four readouts that cannot all be made good at once. The tiered structure is
 * the only move that improves two without worsening a third, and the reader is
 * meant to find that themselves: the paper's recommended configuration stays
 * locked until they have moved some bands.
 */

const levelsAt = (v: number) =>
  Object.fromEntries(dimensions.map((d) => [d.id, v])) as Record<DimensionId, number>

/** Each guided step moves the instrument, rather than describing it. */
const STEP_SETTINGS: readonly (Settings | null)[] = [
  { levels: levelsAt(92), loggingTier: false, loggingOffset: 22 },
  { levels: levelsAt(56), loggingTier: false, loggingOffset: 22 },
  { levels: levelsAt(56), loggingTier: true, loggingOffset: 22 },
  { levels: levelsAt(56), loggingTier: false, loggingOffset: 22 },
  null,
]

const INITIAL: Settings = {
  levels: Object.fromEntries(dimensions.map((d) => [d.id, d.defaultLevel])) as Record<
    DimensionId,
    number
  >,
  loggingTier: false,
  loggingOffset: 22,
}

export function Calibrate() {
  // A shared link carries a whole configuration. The stream is seeded, so the
  // reader who opens it sees the same quarter of events and the same readouts.
  const [settings, setSettings] = useState<Settings>(() =>
    typeof window === 'undefined'
      ? INITIAL
      : (settingsFromLocation(window.location.search) ?? INITIAL),
  )
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState(0)
  const [touches, setTouches] = useState(0)
  const [showingRecommended, setShowingRecommended] = useState(false)
  const beforeRecommended = useRef<Settings | null>(null)

  const readout = useMemo(() => evaluate(settings), [settings])

  // Reflect the configuration in the address bar, replacing rather than
  // pushing so the back button still leaves the page.
  useEffect(() => {
    writeSettingsToLocation(settings)
    setCopied(false)
  }, [settings])

  // The paper's shape stays locked until the reader has actually explored.
  const unlocked = touches >= 4 || step >= STEP_SETTINGS.length - 1

  const onStep = useCallback((i: number) => {
    setStep(i)
    const preset = STEP_SETTINGS[i]
    if (preset) {
      setSettings(preset)
      setShowingRecommended(false)
    }
  }, [])

  const setLevel = useCallback((id: DimensionId, value: number) => {
    setTouches((n) => n + 1)
    setShowingRecommended(false)
    setSettings((s) => ({ ...s, levels: { ...s.levels, [id]: value } }))
  }, [])

  const toggleTier = useCallback(() => {
    setTouches((n) => n + 1)
    setShowingRecommended(false)
    setSettings((s) => ({ ...s, loggingTier: !s.loggingTier }))
  }, [])

  const setOffset = useCallback((value: number) => {
    setTouches((n) => n + 1)
    setShowingRecommended(false)
    setSettings((s) => ({ ...s, loggingOffset: value }))
  }, [])

  const applyRecommended = useCallback(() => {
    beforeRecommended.current = settings
    setSettings({
      levels: recommended.levels,
      loggingTier: recommended.loggingTier,
      loggingOffset: recommended.loggingOffset,
    })
    setShowingRecommended(true)
  }, [settings])

  const restore = useCallback(() => {
    if (beforeRecommended.current) setSettings(beforeRecommended.current)
    setShowingRecommended(false)
  }, [])

  return (
    <section className="sect page" id="calibrate" aria-labelledby="cal-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={6}
        titleId="cal-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />

      <Scaffold
        steps={calibrateSteps}
        current={step}
        onChange={onStep}
        label={copy.scaffoldLabel}
        hint={copy.scaffoldHint}
        className="cal__scaffold"
      />

      <div className="cal">
        {/* The controls. */}
        <div className="cal__controls">
          <div className="cal__controlsHead">
            <p className="cal__panelLabel">{copy.bandsLabel}</p>
            <Prov kind="illustrative" label={copy.bandsProv} />
          </div>

          <ul className="cal__sliders">
            {dimensions.map((d) => {
              const level = settings.levels[d.id]
              return (
                <li className="slider" key={d.id}>
                  <div className="slider__head">
                    <label className="slider__label" htmlFor={`lv-${d.id}`}>
                      {d.label}
                    </label>
                    <span className="slider__value" data-figure>
                      {d.unit(level)}
                    </span>
                  </div>
                  <input
                    id={`lv-${d.id}`}
                    className="slider__input"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={level}
                    aria-describedby={`hint-${d.id}`}
                    aria-valuetext={a11y.bandValue(copy.levelLabel, level, d.unit(level))}
                    onChange={(e) => setLevel(d.id, Number(e.target.value))}
                  />
                  <p className="slider__hint" id={`hint-${d.id}`}>
                    {d.meaning}
                  </p>
                </li>
              )
            })}
          </ul>

          {/* The tiered structure. One control, and it is the finding. */}
          <div className="tier" data-on={settings.loggingTier}>
            <div className="tier__head">
              <p className="cal__panelLabel">{copy.tierLabel}</p>
              <button
                type="button"
                className="tier__toggle"
                role="switch"
                aria-checked={settings.loggingTier}
                onClick={toggleTier}
              >
                <span className="tier__track" aria-hidden="true">
                  <span className="tier__knob" />
                </span>
                {settings.loggingTier ? copy.tierOn : copy.tierOff}
              </button>
            </div>
            <p className="tier__hint">{copy.tierHint}</p>
            <div className="tier__offset">
              <label htmlFor="tier-offset">{copy.offsetLabel}</label>
              <input
                id="tier-offset"
                type="range"
                className="slider__input"
                min={6}
                max={40}
                step={1}
                value={settings.loggingOffset}
                disabled={!settings.loggingTier}
                onChange={(e) => setOffset(Number(e.target.value))}
              />
              <span data-figure>{settings.loggingOffset}</span>
            </div>
          </div>

          <div className="cal__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={showingRecommended ? restore : applyRecommended}
              disabled={!unlocked}
              title={unlocked ? undefined : copy.showRecommendedLocked}
            >
              {showingRecommended ? copy.reset : copy.showRecommended}
            </button>
            {!unlocked ? <span className="cal__lockHint">{copy.showRecommendedLocked}</span> : null}
            <button
              type="button"
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                } catch {
                  // Clipboard access can be refused; selecting the address bar
                  // is the fallback, and the URL is already correct there.
                  setCopied(false)
                }
              }}
            >
              {copied ? copy.shareCopied : copy.shareLabel}
            </button>
          </div>
          <p className="cal__shareNote">{copy.shareNote}</p>

          {showingRecommended ? (
            <p className="cal__recNote">
              <Prov kind="paper" cite="§3.2.2" label={copy.recommendedProv} />
              {recommended.note}
            </p>
          ) : null}
        </div>

        {/* The stream and the readouts. */}
        <div className="cal__output">
          <div className="cal__streamHead">
            <p className="cal__panelLabel">{copy.streamLabel}</p>
            <Prov kind="simulated" />
          </div>
          <StreamChart readout={readout} settings={settings} />
          <p className="cal__streamNote">
            {stream.count} events across {stream.quarterLabel}. {copy.streamNote}
          </p>

          <ul className="cal__legend">
            {(['signal', 'near', 'noise', 'esc', 'log', 'un'] as const).map((k, i) => (
              <li key={k}>
                <span className={`lg lg--${k}`} aria-hidden="true" /> {copy.legend[i]}
              </li>
            ))}
          </ul>

          <div className="cal__readouts" aria-live="polite">
            <Readout
              label={readouts.escalations.label}
              sub={readouts.escalations.sub}
              value={String(readout.escalations)}
              note={readouts.escalations.note}
              tone={readout.escalations > 35 ? 'bad' : 'ok'}
            />
            <Readout
              label={readouts.nearMisses.label}
              sub={readouts.nearMisses.sub}
              value={`${readout.nearMissCaptured}/${readout.nearMissTotal}`}
              note={readouts.nearMisses.note}
              tone={readout.nearMissCaptured < readout.nearMissTotal / 2 ? 'bad' : 'ok'}
            />
            <Readout
              label={readouts.missed.label}
              sub={readouts.missed.sub}
              value={`${readout.signalsMissed}/${readout.signalTotal}`}
              note={readouts.missed.note}
              tone={readout.signalsMissed > 0 ? 'bad' : 'ok'}
            />
            <div className="ro ro--band" data-band={readout.band}>
              <p className="ro__label">
                {readouts.defensibility.label}
                <span className="ro__sub">{readouts.defensibility.sub}</span>
              </p>
              <p className="ro__bandLabel">{readout.bandCopy.label}</p>
              <p className="ro__bandBody">{readout.bandCopy.body}</p>
              {readout.bandCopy.authority ? (
                <p className="ro__authority">{readout.bandCopy.authority}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ArguesBlock label={calibrateArgues.label} body={calibrateArgues.body} />
    </section>
  )
}

function Readout({
  label,
  sub,
  value,
  note,
  tone,
}: {
  readonly label: string
  readonly sub: string
  readonly value: string
  readonly note: string
  readonly tone: 'ok' | 'bad'
}) {
  return (
    <div className="ro" data-tone={tone}>
      <p className="ro__label">
        {label}
        <span className="ro__sub">{sub}</span>
      </p>
      <p className="ro__value" data-figure>
        {value}
      </p>
      <p className="ro__note">{note}</p>
    </div>
  )
}
