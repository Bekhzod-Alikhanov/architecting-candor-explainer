import { useCountdown, pad2 } from '../../lib/countdown'
import { commencement } from '../../content/timeline'

/**
 * The countdown to 9 December 2026.
 *
 * Not a gimmick here. The date is the moment the incentive inverts, so the
 * clock is the argument. It degrades to a "now in force" state after the date
 * rather than disappearing or going negative.
 *
 * The ticking digits are hidden from assistive technology and a plain sentence
 * carries the same fact, so a screen reader is not read a new number every
 * second.
 */
export function Countdown() {
  const r = useCountdown(commencement.isoUTC)

  if (r.passed) {
    return (
      <div className="countdown" data-state="in-force">
        <p className="countdown__kicker">{commencement.passedHeading}</p>
        <p className="countdown__inforce">{commencement.passedBody}</p>
        <p className="countdown__scope">{commencement.scope}</p>
      </div>
    )
  }

  const units = [
    { v: String(r.days), label: r.days === 1 ? 'day' : 'days' },
    { v: pad2(r.hours), label: 'hrs' },
    { v: pad2(r.minutes), label: 'min' },
    { v: pad2(r.seconds), label: 'sec' },
  ]

  return (
    <div className="countdown" data-state="counting">
      <p className="countdown__kicker">
        {commencement.label} <strong>{commencement.displayDate}</strong>
      </p>

      <div className="countdown__row">
        <p className="countdown__digits" aria-hidden="true">
          {units.map((u, i) => (
            <span className="countdown__unit" key={u.label}>
              <span className="countdown__value">{u.v}</span>
              <span className="countdown__label">{u.label}</span>
              {i < units.length - 1 ? <span className="countdown__sep">:</span> : null}
            </span>
          ))}
        </p>

        <p className="sr-only">
          {r.days} days, {r.hours} hours and {r.minutes} minutes remain until{' '}
          {commencement.displayDate}, when {commencement.label.replace(' applies from', '')}{' '}
          applies.
        </p>

        <p className="countdown__scope">
          {commencement.scope} {commencement.zoneNote}
        </p>
      </div>
    </div>
  )
}
