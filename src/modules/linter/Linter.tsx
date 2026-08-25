import { useMemo, useState } from 'react'
import { lint } from '../../lib/lint'
import {
  sample,
  template,
  linterCopy as copy,
  type Category,
} from '../../content/linter-rules'
import './linter.css'

/**
 * The incident ticket linter.
 *
 * Entirely local, and the interface says so, because nobody sensible pastes a
 * real incident ticket into something that phones home. The same component
 * serves the section on the main page and the standalone /linter route.
 */
export function Linter({ standalone = false }: { readonly standalone?: boolean }) {
  const [text, setText] = useState('')
  const result = useMemo(() => lint(text), [text])
  const has = text.trim().length > 0

  return (
    <div className="lint">
      <div className="lint__privacy">
        <p className="lint__privacyTitle">{copy.privacyTitle}</p>
        <p className="lint__privacyBody">{copy.privacyBody}</p>
      </div>

      <div className="lint__grid">
        <div className="lint__inputSide">
          <div className="lint__inputHead">
            <label className="lint__label" htmlFor="lint-input">
              {copy.inputLabel}
            </label>
            <div className="lint__inputActions">
              <button type="button" className="btn" onClick={() => setText(sample)}>
                {copy.loadSample}
              </button>
              {has ? (
                <button type="button" className="btn" onClick={() => setText('')}>
                  {copy.clear}
                </button>
              ) : null}
            </div>
          </div>

          <textarea
            id="lint-input"
            className="lint__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={copy.placeholder}
            spellCheck={false}
            rows={standalone ? 18 : 12}
            aria-describedby="lint-count"
          />

          {has ? (
            <>
              <p className="lint__annotatedLabel">{copy.annotatedLabel}</p>
              <p className="lint__annotated">
                {result.segments.map((s, i) =>
                  s.flag ? (
                    <mark
                      key={i}
                      className="lint__mark"
                      data-cat={s.flag.category}
                      title={`${s.flag.categoryLabel}: ${s.flag.hazard}`}
                    >
                      {s.text}
                    </mark>
                  ) : (
                    <span key={i}>{s.text}</span>
                  ),
                )}
              </p>
            </>
          ) : null}
        </div>

        <div className="lint__outputSide">
          <p className="lint__count" id="lint-count" aria-live="polite">
            {!has ? (
              <span className="lint__empty">{copy.emptyState}</span>
            ) : result.total === 0 ? (
              <span className="lint__clean">{copy.cleanState}</span>
            ) : (
              <>
                <span className="lint__countN" data-figure>
                  {result.total}
                </span>
                <span className="lint__countLabel">
                  {result.total === 1 ? copy.countSuffixOne : copy.countSuffix}
                </span>
              </>
            )}
          </p>

          {result.byCategory.length > 0 ? (
            <ul className="lint__tally">
              {result.byCategory.map((c) => (
                <li key={c.category} data-cat={c.category}>
                  <span data-figure>{c.count}</span> {c.label}
                </li>
              ))}
            </ul>
          ) : null}

          {result.flags.length > 0 ? (
            <>
              <p className="lint__flagsLabel">{copy.flagsLabel}</p>
              <ol className="lint__flags">
                {dedupe(result.flags).map((f) => (
                  <li className="flag" key={`${f.category}-${f.text.toLowerCase()}`} data-cat={f.category}>
                    <p className="flag__head">
                      <span className="flag__phrase">{f.text}</span>
                      <span className="flag__cat">{f.categoryLabel}</span>
                      {f.count > 1 ? (
                        <span className="flag__count">×{f.count}</span>
                      ) : null}
                    </p>
                    <p className="flag__hazard">{f.hazard}</p>
                    {f.note ? <p className="flag__note">{f.note}</p> : null}
                    <p className="flag__subLabel">{copy.substituteLabel}</p>
                    <p className="flag__sub">{f.substitute}</p>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </div>
      </div>

      {/* The template is the real remedy. The linter only catches what the
          template would have prevented. */}
      <div className="tmpl">
        {/* On the standalone route the page's own h1 is directly above this, so
            an h3 would skip a level. Inside section 08 there is an h2 already. */}
        {standalone ? (
          <h2 className="tmpl__heading">{template.heading}</h2>
        ) : (
          <h3 className="tmpl__heading">{template.heading}</h3>
        )}
        <p className="tmpl__lead">{template.lead}</p>
        <dl className="tmpl__fields">
          {template.fields.map((f) => (
            <div className="tmpl__field" key={f.name}>
              <dt>{f.name}</dt>
              <dd>{f.example}</dd>
            </div>
          ))}
        </dl>
        <p className="tmpl__cite">{template.cite}</p>
      </div>
    </div>
  )
}

/** One entry per distinct phrase, with a count, so a repeated phrase is not repeated advice. */
function dedupe(flags: ReturnType<typeof lint>['flags']) {
  const map = new Map<string, { -readonly [K in keyof (typeof flags)[number]]: (typeof flags)[number][K] } & { count: number }>()
  for (const f of flags) {
    const key = `${f.category}|${f.text.toLowerCase()}`
    const existing = map.get(key)
    if (existing) existing.count += 1
    else map.set(key, { ...f, count: 1 })
  }
  return [...map.values()]
}

export const linterCategories: readonly Category[] = [
  'fault',
  'harm',
  'causal',
  'counterfactual',
  'legal',
]
