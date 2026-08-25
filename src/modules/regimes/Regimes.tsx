import { useMemo, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { ArguesBlock } from '../../components/ArguesBlock'
import {
  regimes,
  target,
  columns,
  channelNames,
  regimeCopy as copy,
  regimeArgues,
  type ChannelMap,
  type Regime,
} from '../../content/regimes'
import './regimes.css'

/**
 * 06 — Four regimes, one logic.
 *
 * A comparator, not a table of facts. The filter and the sort exist so a reader
 * can ask the question they came with: who receives, who enforces, what is
 * protected, what stays reachable, and which part of the architecture each
 * choice corresponds to.
 */

type SortKey = (typeof copy.sortable)[number]

export function Regimes() {
  const [filter, setFilter] = useState<ChannelMap | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [openId, setOpenId] = useState<string>(regimes[0]!.id)

  const rows = useMemo(() => {
    const filtered = regimes.filter((r) => filter === 'all' || r.maps.includes(filter))
    return [...filtered].sort((a, b) => String(a[sort]).localeCompare(String(b[sort])))
  }, [filter, sort])

  const open: Regime | undefined = [...regimes, target].find((r) => r.id === openId)

  return (
    <section className="sect page" id="regimes" aria-labelledby="reg-title">
      <SectionHead
        n={copy.section}
        eyebrow={copy.eyebrow}
        seq={7}
        titleId="reg-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
      />

      <p className="reg__note">{copy.note}</p>

      <div className="reg__controls">
        <div className="reg__control">
          <span className="reg__controlLabel" id="filter-label">
            {copy.filterLabel}
          </span>
          <div className="reg__chips" role="group" aria-labelledby="filter-label">
            {(['all', 'one', 'two', 'three'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className="chipbtn"
                data-active={filter === k}
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
              >
                {k === 'all' ? copy.filterAll : channelNames[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="reg__control">
          <label className="reg__controlLabel" htmlFor="reg-sort">
            {copy.sortLabel}
          </label>
          <select
            id="reg-sort"
            className="reg__select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {copy.sortable.map((k) => (
              <option value={k} key={k}>
                {k === 'name' ? copy.regimeColumn : columns.find((c) => c.id === k)?.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="reg__tableWrap">
        <table className="reg__table">
          <caption className="sr-only">
            {copy.captionTemplate} Filtered to{' '}
            {filter === 'all' ? copy.filterAll.toLowerCase() : channelNames[filter]}, sorted by {sort}.
          </caption>
          <thead>
            <tr>
              <th scope="col">{copy.regimeColumn}</th>
              {columns.map((c) => (
                <th scope="col" key={c.id}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <RegimeRow key={r.id} regime={r} open={openId === r.id} onOpen={() => setOpenId(r.id)} />
            ))}
          </tbody>
          <tbody className="reg__targetBody">
            <tr className="reg__targetHead">
              <td colSpan={columns.length + 1}>
                <span className="reg__targetLabel">{copy.targetLabel}</span>
                {copy.targetNote}
              </td>
            </tr>
            <RegimeRow
              regime={target}
              open={openId === target.id}
              onOpen={() => setOpenId(target.id)}
            />
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="reg__empty">
          {copy.emptyBefore} {channelNames[filter as ChannelMap]} {copy.emptyAfter}
        </p>
      ) : null}

      {open ? (
        <article className="lesson doc-object doc-object--scanned on-doc" aria-live="polite">
          <header className="lesson__head">
            <p className="lesson__domain">{open.domain}</p>
            <p className="lesson__cite">{open.citation}</p>
          </header>
          <h3 className="lesson__name">{open.name}</h3>
          <p className="lesson__label">{copy.lessonLabel}</p>
          <p className="lesson__body">{open.lesson}</p>
        </article>
      ) : null}

      <ArguesBlock label={regimeArgues.label} body={regimeArgues.body} />
    </section>
  )
}

function RegimeRow({
  regime,
  open,
  onOpen,
}: {
  readonly regime: Regime
  readonly open: boolean
  readonly onOpen: () => void
}) {
  return (
    <tr className="reg__row" data-open={open} data-proposed={regime.proposed}>
      <th scope="row" data-label={copy.regimeColumn}>
        <button type="button" className="reg__rowBtn" onClick={onOpen} aria-expanded={open}>
          <span className="reg__rowName">{regime.name}</span>
          <span className="reg__rowDomain">{regime.domain}</span>
        </button>
      </th>
      {columns.map((c) => (
        <td key={c.id} data-label={c.label}>
          {c.id === 'maps' ? (
            <span className="reg__maps">
              {regime.maps.map((m) => (
                <span className="reg__map" key={m} data-ch={m}>
                  {m === 'one' ? '1' : m === 'two' ? '2' : '3'}
                </span>
              ))}
            </span>
          ) : (
            <>
              {String(regime[c.id as keyof typeof regime] ?? '')}
              {c.id === 'recipient' && regime.separated ? (
                <span className="reg__sep" title={copy.separatedTitle}>
                  {copy.separatedMark}
                </span>
              ) : null}
            </>
          )}
        </td>
      ))}
    </tr>
  )
}
