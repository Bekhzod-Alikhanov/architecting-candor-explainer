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
 *
 * The first frame — the one the build prerenders, and the one React hydrates —
 * shows the same furniture with unread digits, because the interval depends on
 * the reader's clock and the build's clock is not it.
 */
/** Stands in for a figure the prerendered HTML cannot know: the reader's own
 *  clock has not been read yet. Not prose, so it stays here. */
const UNREAD = '—'

export function Countdown() {
  const r = useCountdown(commencement.isoUTC)

  if (r?.passed) {
    return (
      <div className="countdown" data-state="in-force">
        <p className="countdown__kicker">{commencement.passedHeading}</p>
        <p className="countdown__inforce">{commencement.passedBody}</p>
        <p className="countdown__scope">{commencement.scope}</p>
      </div>
    )
  }

  const units = r
    ? [
        { v: String(r.days), label: r.days === 1 ? 'day' : 'days' },
        { v: pad2(r.hours), label: 'hrs' },
        { v: pad2(r.minutes), label: 'min' },
        { v: pad2(r.seconds), label: 'sec' },
      ]
    : [
        { v: UNREAD, label: 'days' },
        { v: UNREAD, label: 'hrs' },
        { v: UNREAD, label: 'min' },
        { v: UNREAD, label: 'sec' },
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

        {/* Only once the clock has actually been read. Before that the kicker
            above already carries the instrument, the authority and the date,
            which is the fact; the interval is the only part missing. */}
        {r ? (
          <p className="sr-only">
            {r.days} days, {r.hours} hours and {r.minutes} minutes remain until{' '}
            {commencement.displayDate}, when {commencement.label.replace(' applies from', '')}{' '}
            applies.
          </p>
        ) : null}

        <p className="countdown__scope">
          {commencement.scope} {commencement.zoneNote}
        </p>
      </div>
    </div>
  )
}
