import { useCallback, useEffect, useRef, useState } from 'react'
import { a11y } from '../content/ui'

/**
 * THE SEAM — the signature element.
 *
 * Not a divider. The one-way valve. Facts cross inward; causal conclusions,
 * fault characterisations and litigation assessments do not cross outward.
 *
 * Three states:
 *   idle    — the boundary exists and is quiet
 *   live    — an inward flow is being accepted
 *   refuse  — an outward flow is being refused, and says why
 *
 * Optionally a draggable splitter, which is how the hero lets a reader give
 * either document system more of the same record.
 */

export type SeamState = 'idle' | 'live' | 'refuse'

export interface SeamSplit {
  /** Position of the seam as a fraction of the container, 0–1. */
  readonly value: number
  readonly onChange: (value: number) => void
  /** Accessible name. Says exactly what dragging does. */
  readonly label: string
  readonly min?: number
  readonly max?: number
  /** Keyboard step, as a fraction. */
  readonly step?: number
}

export interface SeamProps {
  readonly orientation?: 'vertical' | 'horizontal'
  readonly state?: SeamState
  /** Shown inside the seam while refusing. The doctrinal reason. */
  readonly reason?: string | null
  readonly split?: SeamSplit
  readonly className?: string
}

export function Seam({
  orientation = 'vertical',
  state = 'idle',
  reason = null,
  split,
  className = '',
}: SeamProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const horizontal = orientation === 'horizontal'

  const min = split?.min ?? 0.18
  const max = split?.max ?? 0.82
  const step = split?.step ?? 0.02

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max])

  // Pointer drag. Measures the parent, so the seam works wherever it is placed.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!split) return
      const parent = ref.current?.parentElement
      if (!parent) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      setDragging(true)
    },
    [split],
  )

  useEffect(() => {
    if (!dragging || !split) return
    const parent = ref.current?.parentElement
    if (!parent) return

    const move = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect()
      const size = horizontal ? r.height : r.width
      if (size <= 0) return
      const pos = horizontal ? e.clientY - r.top : e.clientX - r.left
      split.onChange(clamp(pos / size))
    }
    const up = () => setDragging(false)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [dragging, split, horizontal, clamp])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!split) return
      const back = horizontal ? 'ArrowUp' : 'ArrowLeft'
      const fwd = horizontal ? 'ArrowDown' : 'ArrowRight'
      let next: number | null = null
      if (e.key === back) next = split.value - step
      else if (e.key === fwd) next = split.value + step
      else if (e.key === 'Home') next = min
      else if (e.key === 'End') next = max
      else if (e.key === 'PageUp') next = split.value - step * 4
      else if (e.key === 'PageDown') next = split.value + step * 4
      if (next === null) return
      e.preventDefault()
      split.onChange(clamp(next))
    },
    [split, horizontal, step, min, max, clamp],
  )

  const classes = [
    'seam',
    horizontal ? 'seam--horizontal' : '',
    split ? 'seam--draggable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const shown: SeamState = dragging && state === 'idle' ? 'live' : state

  return (
    <div
      ref={ref}
      className={classes}
      data-state={shown}
      {...(split
        ? {
            role: 'separator',
            tabIndex: 0,
            'aria-orientation': orientation,
            'aria-label': split.label,
            'aria-valuenow': Math.round(split.value * 100),
            'aria-valuemin': Math.round(min * 100),
            'aria-valuemax': Math.round(max * 100),
            'aria-valuetext': a11y.seamValue(Math.round(split.value * 100)),
            onPointerDown,
            onKeyDown,
          }
        : { 'aria-hidden': true })}
    >
      {split ? (
        <span className="seam__grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : null}

      {state === 'refuse' && reason ? (
        <p className="seam__reason" role="status">
          {reason}
        </p>
      ) : null}
    </div>
  )
}
