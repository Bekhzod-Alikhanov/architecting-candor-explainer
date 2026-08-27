/**
 * biome-ignore-all lint/a11y/noNoninteractiveElementToInteractiveRole: an option
 *   inside a listbox is `<li role="option">` per the ARIA authoring practices,
 *   and that is what this is.
 * biome-ignore-all lint/a11y/useFocusableInteractive: options in an
 *   aria-activedescendant listbox must NOT be individually tabbable. Focus stays
 *   on the container and the active option is named by aria-activedescendant.
 *   Adding tabindex here would break the pattern rather than improve it.
 * biome-ignore-all lint/a11y/useKeyWithClickEvents: the keyboard path lives on
 *   the container for the same reason. Arrow keys move the active option and
 *   1–4 route it. See RouteTheRecord's onKeyDown, and the listbox assertions in
 *   scripts/check-keyboard.mjs which fail if any of this is lost again.
 */

import type { Artifact, Bin } from '../../content/artifacts'
import { routeCopy } from '../../content/grading'

/**
 * One artifact in the deck.
 *
 * Selection is the primary interaction on every input: click, tap or arrow
 * keys select, then 1–4 routes. Dragging is an enhancement on top of that, not
 * the only way in.
 */

export interface ArtifactCardProps {
  readonly artifact: Artifact
  readonly selected: boolean
  readonly bin: Bin | null
  readonly onSelect: () => void
  readonly onDragStart: () => void
  readonly onDragEnd: () => void
}

export function ArtifactCard({
  artifact,
  selected,
  bin,
  onSelect,
  onDragStart,
  onDragEnd,
}: ArtifactCardProps) {
  return (
    <li
      role="option"
      id={`card-${artifact.id}`}
      aria-selected={selected}
      className="acard"
      data-selected={selected}
      data-routed={bin !== null}
      draggable
      onClick={onSelect}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', artifact.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      <div className="acard__head">
        <span className="acard__kind">{artifact.kind}</span>
        {artifact.autoCaptured ? (
          <span className="acard__auto" title={routeCopy.autoTitle}>
            auto
          </span>
        ) : null}
      </div>

      <p className="acard__title">{artifact.title}</p>

      {selected ? (
        <>
          <p className="acard__text">{artifact.text}</p>
          <p className="acard__meta">
            <span>{artifact.source}</span>
            <span>{artifact.timestamp}</span>
            <span>{artifact.author}</span>
          </p>
        </>
      ) : (
        <p className="acard__meta">
          <span>{artifact.source}</span>
          <span>{artifact.timestamp}</span>
        </p>
      )}
    </li>
  )
}
