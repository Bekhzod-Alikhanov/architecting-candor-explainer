import { useCallback } from 'react'

/**
 * The scaffold stepper.
 *
 * Every heavy instrument on this site runs guided steps before it hands over
 * control. Each step moves the instrument's own state, and the final step
 * releases it. Nobody should ever face a blank instrument.
 *
 * Controlled: the consumer owns `current` and reacts to it by driving the
 * instrument. Include the release step as the last entry in `steps`.
 */

export interface ScaffoldStep {
  readonly heading: string
  readonly body: string
}

export interface ScaffoldProps {
  readonly steps: readonly ScaffoldStep[]
  readonly current: number
  readonly onChange: (index: number) => void
  /** Accessible name for the stepper as a whole. Says what it steps through. */
  readonly label: string
  /** Shown next to the controls once the last step is reached. */
  readonly hint?: string
  readonly className?: string
}

export function Scaffold({ steps, current, onChange, label, hint, className = '' }: ScaffoldProps) {
  const last = steps.length - 1
  const released = current >= last
  const step = steps[Math.min(Math.max(current, 0), last)]

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft' && current > 0) {
        e.preventDefault()
        onChange(current - 1)
      } else if (e.key === 'ArrowRight' && current < last) {
        e.preventDefault()
        onChange(current + 1)
      }
    },
    [current, last, onChange],
  )

  if (!step) return null

  return (
    <div
      className={`scaffold ${className}`.trim()}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className="scaffold__meta" data-released={released}>
        <span>
          {released
            ? 'Released'
            : `Step ${String(current + 1).padStart(2, '0')} of ${String(last).padStart(2, '0')}`}
        </span>
        {released && hint ? <span>{hint}</span> : null}
      </div>

      {/* One live region, so a step change is announced once and completely. */}
      <div aria-live="polite">
        <h3 className="scaffold__heading">{step.heading}</h3>
        <p className="scaffold__body">{step.body}</p>
      </div>

      <div className="scaffold__controls">
        <div className="scaffold__dots">
          {steps.map((s, i) => (
            <button
              key={s.heading}
              type="button"
              className="scaffold__dot"
              data-done={i < current}
              {...(i === current ? { 'aria-current': 'step' as const } : {})}
              aria-label={`Step ${i + 1}: ${s.heading}`}
              onClick={() => onChange(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => onChange(current - 1)}
          disabled={current === 0}
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onChange(current + 1)}
          disabled={released}
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
