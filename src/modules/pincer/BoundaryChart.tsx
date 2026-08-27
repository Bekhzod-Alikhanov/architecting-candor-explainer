import { useId } from 'react'
import { scaleLinear } from 'd3-scale'
import { area as d3area, line as d3line, curveStepAfter } from 'd3-shape'
import { axis, type TimelineEntry } from '../../content/timeline'
import { a11y } from '../../content/ui'

/**
 * The reclassification boundary.
 *
 * The line is not an illustration laid over the argument: it *is* the
 * classification, drawn through the decisions that moved it. Everything on the
 * far side of it is territory where a firm's internal records are the central
 * evidence of defect, and that territory grows as the reader advances.
 *
 * Horizontal on wide screens, transposed to vertical on narrow ones, from one
 * set of points and one projection.
 */

export interface BoundaryChartProps {
  readonly entries: readonly TimelineEntry[]
  /** Entries up to and including this index are drawn. */
  readonly current: number
  readonly onSelect: (index: number) => void
  readonly vertical: boolean
}

const H = { w: 900, h: 340, padX: 78, padY: 54 }
const V = { w: 360, h: 780, padX: 92, padY: 40 }

/** Space reserved between the plotted field and the time axis. */
const AXIS_GAP = 38

export function BoundaryChart({ entries, current, onSelect, vertical }: BoundaryChartProps) {
  const uid = useId().replace(/:/g, '')
  const { w, h, padX, padY } = vertical ? V : H

  // Time runs along the long axis; classification across the short one.
  const timeScale = scaleLinear()
    .domain([axis.from, axis.to])
    .range(vertical ? [padY, h - padY] : [padX, w - padX])
  // The field stops short of the axis, so the lowest entry never lands on it.
  const classScale = scaleLinear()
    .domain([0, 1])
    .range(vertical ? [w - padX, padX] : [h - padY - AXIS_GAP, padY])

  const px = (e: { t: number; classification: number }) =>
    vertical ? classScale(e.classification) : timeScale(e.t)
  const py = (e: { t: number; classification: number }) =>
    vertical ? timeScale(e.t) : classScale(e.classification)

  const drawn = entries.slice(0, current + 1)
  const first = drawn[0]

  // The line begins at the left edge rather than at the first dot, so a single
  // drawn entry still produces a visible boundary instead of a lone point.
  const points: { t: number; classification: number }[] = first
    ? [
        { t: axis.from, classification: first.classification },
        ...drawn.map((e) => ({ t: e.t, classification: e.classification })),
      ]
    : []

  // And it runs out to the far edge once everything is drawn, so the boundary
  // reads as continuing rather than as stopping at the last decision.
  const lastDrawn = drawn[drawn.length - 1]
  if (lastDrawn && current >= entries.length - 1) {
    points.push({ t: axis.to, classification: lastDrawn.classification })
  }

  // Decade marks, so horizontal position means something before any dot lands.
  const ticks = [1990, 2000, 2010, 2020]
  const axisPos = vertical ? padX - AXIS_GAP : h - padY

  // Time is plotted linearly and deliberately so: thirty flat years and then a
  // three-year collapse is the finding, and rescaling would soften it. That
  // crowds the tail, so a node only carries a date label when it has room, or
  // when it is the current one. Every date is listed under the chart regardless.
  const labelSide = (i: number) => (i % 2 === 0 ? -1 : 1)
  const CROWD = 42
  const hasRoom = (i: number) =>
    drawn.every((other, j) => {
      if (j === i) return true
      const a = drawn[i]
      if (!a) return true
      return Math.abs(timeScale(other.t) - timeScale(a.t)) > CROWD
    })

  // The hatched band is the territory the boundary has swept through: bounded
  // by where the line started in 1991 and by where it now sits. It is empty at
  // the first step and grows monotonically, which is the finding.
  const startLevel = entries[0]?.classification ?? 1
  const closeAt = classScale(startLevel)

  const lineGen = d3line<{ t: number; classification: number }>().x(px).y(py).curve(curveStepAfter)

  const areaGen = vertical
    ? d3area<{ t: number; classification: number }>().y(py).x0(closeAt).x1(px).curve(curveStepAfter)
    : d3area<{ t: number; classification: number }>().x(px).y0(closeAt).y1(py).curve(curveStepAfter)

  const linePath = points.length ? lineGen(points) : null
  const areaPath = points.length > 0 ? areaGen(points) : null

  const activeEntry = entries[current]

  return (
    <svg
      className="bchart"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={a11y.boundarySummary(
        axis.from,
        Math.floor(axis.to),
        activeEntry ? `${activeEntry.date}: ${activeEntry.title}` : null,
      )}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Hatching, so the two territories differ by pattern as well as fill. */}
        <pattern
          id={`hatch-${uid}`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="7"
            stroke="var(--color-instrument)"
            strokeWidth="1.4"
            opacity="0.32"
          />
        </pattern>
      </defs>

      {/* The time axis. Present from the start, so the instrument always has a
          visible domain rather than opening as an empty rectangle. */}
      <line
        className="bchart__axis"
        x1={vertical ? axisPos : padX}
        y1={vertical ? padY : axisPos}
        x2={vertical ? axisPos : w - padX}
        y2={vertical ? h - padY : axisPos}
      />
      {ticks.map((yr) => {
        const p = timeScale(yr)
        return (
          <g key={yr}>
            <line
              className="bchart__tick"
              x1={vertical ? axisPos - 4 : p}
              y1={vertical ? p : axisPos}
              x2={vertical ? axisPos + 4 : p}
              y2={vertical ? p : axisPos + 5}
            />
            <text
              className="bchart__tickLabel"
              x={vertical ? axisPos - 9 : p}
              y={vertical ? p + 4 : axisPos + 20}
              textAnchor={vertical ? 'end' : 'middle'}
            >
              {yr}
            </text>
          </g>
        )
      })}

      {/* Entries not yet drawn are marked on the axis only. The reader can see
          the instrument's full span without being shown the finding early. */}
      {entries.slice(current + 1).map((e) => {
        const p = timeScale(e.t)
        return (
          <line
            key={`pending-${e.id}`}
            className="bchart__pending"
            x1={vertical ? axisPos - 3 : p}
            y1={vertical ? p : axisPos - 7}
            x2={vertical ? axisPos + 7 : p}
            y2={vertical ? p : axisPos}
          />
        )
      })}

      {/* The product territory. It grows. */}
      {areaPath ? <path d={areaPath} fill={`url(#hatch-${uid})`} className="bchart__area" /> : null}

      {/* Span entries get a bracket showing they cover a period, not a moment. */}
      {drawn
        .filter((e) => e.tEnd !== undefined)
        .map((e) => {
          const a = { t: e.t, classification: e.classification }
          const b = { t: e.tEnd as number, classification: e.classification }
          return (
            <line
              key={`span-${e.id}`}
              x1={px(a)}
              y1={py(a)}
              x2={px(b)}
              y2={py(b)}
              className="bchart__span"
            />
          )
        })}

      {linePath ? <path d={linePath} className="bchart__line" fill="none" /> : null}

      {/* Region labels sit inside the territories they name. */}
      <text
        className="bchart__region"
        x={vertical ? padX - 6 : padX - 8}
        y={vertical ? padY - 14 : padY - 16}
        textAnchor={vertical ? 'start' : 'start'}
      >
        {axis.topLabel}
      </text>
      <text
        className="bchart__region bchart__region--product"
        x={vertical ? w - padX + 6 : padX - 8}
        y={vertical ? padY - 14 : h - padY - AXIS_GAP + 4}
        textAnchor="start"
      >
        {axis.bottomLabel}
      </text>

      {drawn.map((e, i) => {
        const cx = px(e)
        const cy = py(e)
        const isCurrent = i === current
        return (
          <g
            key={e.id}
            className="bchart__node"
            data-current={isCurrent}
            data-future={e.future ? 'true' : undefined}
            onClick={() => onSelect(i)}
          >
            {isCurrent ? <circle cx={cx} cy={cy} r={11} className="bchart__halo" /> : null}
            <circle cx={cx} cy={cy} r={5.5} className="bchart__dot" />
            {isCurrent || i < 2 || hasRoom(i) ? (
              <text
                className="bchart__date"
                x={vertical ? cx + 14 : cx}
                y={vertical ? cy + 4 : cy + labelSide(i) * 15 + (labelSide(i) < 0 ? 0 : 5)}
                textAnchor={
                  vertical
                    ? 'start'
                    : cx > w - padX - 60
                      ? 'end'
                      : cx < padX + 40
                        ? 'start'
                        : 'middle'
                }
              >
                {shortDate(e)}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

/** Chart labels stay terse; the full date is in the entry detail. */
function shortDate(e: TimelineEntry): string {
  if (e.tEnd !== undefined) return '1991–2022'
  if (e.t > 2026.9) return 'Dec 2026'
  if (e.t > 2026) return 'Jun 2026'
  if (e.t > 2025) return 'May 2025'
  return String(Math.floor(e.t))
}
