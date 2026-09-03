/**
 * biome-ignore-all lint/a11y/noRedundantRoles: below 68rem regimes.css sets
 *   display:block on table/thead/tbody/tr/th/td for the card layout, which
 *   strips their implicit table/rowgroup/row/columnheader/rowheader/cell
 *   roles in Chrome, Firefox and Safari. These roles are only "redundant" at
 *   the default table display Biome assumes; at the card breakpoint they are
 *   what keeps row/column association available to screen readers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { ArguesBlock } from '../../components/ArguesBlock'
import { Scaffold } from '../../components/Scaffold'
import {
  regimes,
  target,
  columns,
  channelNames,
  regimeCopy as copy,
  regimeArgues,
  regimeSteps,
  type ChannelMap,
  type Regime,
} from '../../content/regimes'
import { defineTerms } from '../../lib/defineTerms'
import { useStatus } from '../../lib/useStatus'
import type { GlossaryId } from '../../content/glossary'
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
  const [step, setStep] = useState(0)

  // The wrapper only needs to be in the tab order when it actually scrolls.
  // Server-rendered markup has no measurements, so it renders with no
  // tabIndex; the client measures after mount (and on resize) and adds it
  // only once scrollWidth exceeds clientWidth, keeping wide-screen layouts
  // free of a focusable no-op.
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollable, setTableScrollable] = useState(false)

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const measure = () => setTableScrollable(el.scrollWidth > el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /**
   * Each step drives the comparator, in the same controlled pattern the other
   * interactives use. The last entry sets nothing: it releases control, leaving
   * whatever the reader is looking at in place.
   */
  const onStep = useCallback((i: number) => {
    setStep(i)
    const preset = [
      { filter: 'all', sort: 'name', open: regimes[0]!.id },
      { filter: 'all', sort: 'recipient', open: regimes[0]!.id },
      { filter: 'two', sort: 'recipient', open: regimes[0]!.id },
      { filter: 'all', sort: 'name', open: target.id },
    ][i]
    if (!preset) return
    setFilter(preset.filter as ChannelMap | 'all')
    setSort(preset.sort as SortKey)
    setOpenId(preset.open)
  }, [])

  const rows = useMemo(() => {
    const filtered = regimes.filter((r) => filter === 'all' || r.maps.includes(filter))
    return [...filtered].sort((a, b) => String(a[sort]).localeCompare(String(b[sort])))
  }, [filter, sort])

  const open: Regime | undefined = [...regimes, target].find((r) => r.id === openId)
  // Shared with the "Source of protection" cell on the target row below.
  const seen = new Set<GlossaryId>()
  // The lesson card is not live — reading domain, citation and lesson body on
  // every step is the flood the scaffold's own announcement already covers.
  // Only the regime's name, for row clicks the scaffold does not drive.
  const openStatus = useStatus(open?.name ?? '')
  // Both the table's accessible name (aria-label) and its sr-only <caption>
  // read this, so the filter/sort state that was already announced through
  // the caption is not lost now that an explicit label is also set.
  const tableDescription = `${copy.captionTemplate} Filtered to ${
    filter === 'all' ? copy.filterAll.toLowerCase() : channelNames[filter]
  }, sorted by ${sort}.`

  return (
    <section className="sect page" id="regimes" aria-labelledby="reg-title">
      <SectionHead
        id="regimes"
        titleId="reg-title"
        headline={copy.headline}
        standfirst={copy.standfirst}
        terms={copy.terms}
        seen={seen}
        aside={
          <Scaffold
            steps={regimeSteps}
            current={step}
            onChange={onStep}
            label={copy.scaffoldLabel}
            hint={copy.scaffoldHint}
            className="reg__scaffold"
          />
        }
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

      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role and aria-label share the tableScrollable condition, so the label never appears without role="region"; Biome cannot correlate the two conditionals. */}
      <div
        className="reg__tableWrap"
        ref={tableWrapRef}
        // Keyboard access to the scroll region, only when there is
        // something to scroll — see the measuring effect above.
        tabIndex={tableScrollable ? 0 : undefined}
        role={tableScrollable ? 'region' : undefined}
        aria-label={tableScrollable ? copy.scrollHint : undefined}
      >
        {/* Below 68rem the card layout sets display:block on every table
            element (regimes.css), which strips their implicit table/row/cell
            roles in Chrome, Firefox and Safari alike. The roles below are
            explicit so row and column association survives that switch;
            scope attributes stay for browsers/AT that still read them. */}
        <table className="reg__table" role="table" aria-label={tableDescription}>
          <caption className="sr-only">{tableDescription}</caption>
          <thead role="rowgroup">
            <tr role="row">
              <th scope="col" role="columnheader">
                {copy.regimeColumn}
              </th>
              {columns.map((c) => (
                <th scope="col" role="columnheader" key={c.id}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map((r) => (
              <RegimeRow
                key={r.id}
                regime={r}
                open={openId === r.id}
                onOpen={() => setOpenId(r.id)}
                terms={copy.terms}
                seen={seen}
              />
            ))}
          </tbody>
          <tbody className="reg__targetBody" role="rowgroup">
            <tr className="reg__targetHead" role="row">
              <td colSpan={columns.length + 1} role="cell">
                <span className="reg__targetLabel">{copy.targetLabel}</span>
                {copy.targetNote}
              </td>
            </tr>
            <RegimeRow
              regime={target}
              open={openId === target.id}
              onOpen={() => setOpenId(target.id)}
              terms={copy.terms}
              seen={seen}
            />
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="reg__empty">
          {copy.emptyBefore} {channelNames[filter as ChannelMap]} {copy.emptyAfter}
        </p>
      ) : null}

      <p className="sr-only" role="status">
        {openStatus}
      </p>

      {open ? (
        <article className="lesson doc-object doc-object--scanned on-doc">
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
  terms,
  seen,
}: {
  readonly regime: Regime
  readonly open: boolean
  readonly onOpen: () => void
  readonly terms: readonly GlossaryId[]
  readonly seen: Set<GlossaryId>
}) {
  return (
    <tr className="reg__row" role="row" data-open={open} data-proposed={regime.proposed}>
      <th scope="row" role="rowheader" data-label={copy.regimeColumn}>
        <button type="button" className="reg__rowBtn" onClick={onOpen} aria-expanded={open}>
          <span className="reg__rowName">{regime.name}</span>
          <span className="reg__rowDomain">{regime.domain}</span>
        </button>
      </th>
      {columns.map((c) => (
        <td key={c.id} role="cell" data-label={c.label}>
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
              {c.id === 'source' || c.id === 'protects'
                ? defineTerms(String(regime[c.id] ?? ''), terms, seen)
                : String(regime[c.id as keyof typeof regime] ?? '')}
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
