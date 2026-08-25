import { useId } from 'react'
import { dimensions } from '../../content/thresholds'
import type { Readout, Settings } from '../../lib/tripwire'

/**
 * The simulated quarter, plotted against the reader's own bands.
 *
 * The vertical axis is margin: how far an event's highest dimension sat above
 * or below that dimension's band. Zero is the review band exactly, so one line
 * is true for all seven dimensions at once rather than being an average of
 * them. The logging band sits a fixed distance below.
 */

const W = 900
const H = 260
const PAD = { top: 22, right: 16, bottom: 26, left: 72 }
const HI = 46
const LO = -64

export interface StreamChartProps {
  readonly readout: Readout
  readonly settings: Settings
}

export function StreamChart({ readout, settings }: StreamChartProps) {
  const uid = useId().replace(/:/g, '')
  const plotH = H - PAD.top - PAD.bottom
  const plotW = W - PAD.left - PAD.right

  const y = (margin: number) => {
    const clamped = Math.max(LO, Math.min(HI, margin))
    return PAD.top + ((HI - clamped) / (HI - LO)) * plotH
  }
  const x = (t: number) => PAD.left + t * plotW

  const marginOf = (values: Readonly<Record<string, number>>) =>
    Math.max(...dimensions.map((d) => values[d.id]! - settings.levels[d.id]))

  const reviewY = y(0)
  const logY = y(-settings.loggingOffset)

  return (
    <svg
      className="stream"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Simulated quarter of ${readout.events.length} events plotted against your bands. ${readout.escalations} escalated to counsel, ${readout.nearMissCaptured} of ${readout.nearMissTotal} near misses captured, ${readout.signalsMissed} of ${readout.signalTotal} signals missed. The figures are repeated below the chart.`}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} />
        </clipPath>
      </defs>

      {/* The band the logging tier occupies, when it is open at all. */}
      {settings.loggingTier ? (
        <rect
          x={PAD.left}
          y={reviewY}
          width={plotW}
          height={Math.max(0, logY - reviewY)}
          className="stream__logBand"
        />
      ) : null}

      <g clipPath={`url(#clip-${uid})`}>
        {readout.events.map(({ event, disposition }) => {
          const cx = x(event.t)
          const cy = y(marginOf(event.values))
          if (event.klass === 'noise') {
            return (
              <circle
                key={event.i}
                cx={cx}
                cy={cy}
                r={1.6}
                className="stream__dot"
                data-disposition={disposition}
              />
            )
          }
          if (event.klass === 'nearMiss') {
            return (
              <circle
                key={event.i}
                cx={cx}
                cy={cy}
                r={3.4}
                className="stream__near"
                data-disposition={disposition}
              />
            )
          }
          return (
            <rect
              key={event.i}
              x={cx - 3.4}
              y={cy - 3.4}
              width={6.8}
              height={6.8}
              className="stream__signal"
              data-disposition={disposition}
            />
          )
        })}
      </g>

      {/* The review band. Everything above it engages counsel. */}
      <line x1={PAD.left} y1={reviewY} x2={W - PAD.right} y2={reviewY} className="stream__review" />
      <text x={PAD.left - 8} y={reviewY + 4} className="stream__axisLabel" textAnchor="end">
        review
      </text>

      {settings.loggingTier ? (
        <>
          <line x1={PAD.left} y1={logY} x2={W - PAD.right} y2={logY} className="stream__log" />
          <text x={PAD.left - 8} y={logY + 4} className="stream__axisLabel" textAnchor="end">
            logging
          </text>
        </>
      ) : null}

      <text x={PAD.left - 8} y={PAD.top + 8} className="stream__axisLabel" textAnchor="end">
        over
      </text>
      <text x={PAD.left - 8} y={H - PAD.bottom} className="stream__axisLabel" textAnchor="end">
        under
      </text>
      <text x={PAD.left} y={H - 6} className="stream__axisLabel">
        one quarter →
      </text>
    </svg>
  )
}
