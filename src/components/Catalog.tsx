import { useEffect, useMemo, useRef, useState } from 'react'
import type { Piece } from '../types'

interface CatalogProps {
  pieces: Piece[]
  /** 'panel' — small centered frame (desktop); 'sheet' — bottom sheet (touch). */
  variant: 'panel' | 'sheet'
  onSelect: (piece: Piece) => void
  onClose: () => void
}

/**
 * The collection index: a quiet list of every piece, summoned on demand.
 * Selection moves with the arrow keys or j/k, Enter opens the piece,
 * Escape (or a tap outside) returns to the dark.
 */
export function Catalog({ pieces, variant, onSelect, onClose }: CatalogProps) {
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Pieces grouped by project (in order of first appearance); selection and
  // the running catalog numbers follow the grouped display order.
  const groups = useMemo(() => {
    const byProject = new Map<string, { artist: string; items: Piece[] }>()
    for (const piece of pieces) {
      const group = byProject.get(piece.projectName)
      if (group) group.items.push(piece)
      else byProject.set(piece.projectName, { artist: piece.artist, items: [piece] })
    }
    let start = 0
    return [...byProject.entries()].map(([project, { artist, items }]) => {
      const group = { project, artist, items, start }
      start += items.length
      return group
    })
  }, [pieces])
  const ordered = useMemo(() => groups.flatMap((group) => group.items), [groups])

  const stateRef = useRef({ ordered, selected, onSelect, onClose })
  stateRef.current = { ordered, selected, onSelect, onClose }

  useEffect(() => {
    listRef.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      const { ordered, selected, onSelect, onClose } = stateRef.current
      const step = (delta: number) => {
        e.preventDefault()
        setSelected((current) => (current + delta + ordered.length) % ordered.length)
      }
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          step(1)
          break
        case 'ArrowUp':
        case 'k':
          step(-1)
          break
        case 'Enter':
          e.preventDefault()
          onSelect(ordered[selected])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.getElementById(`catalog-item-${selected}`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
      className={`catalog-backdrop catalog-backdrop--${variant}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={listRef}
        className="catalog"
        role="listbox"
        aria-label="Collection index"
        aria-activedescendant={`catalog-item-${selected}`}
        tabIndex={-1}
      >
        {groups.map((group) => (
          <div key={group.project} role="group" aria-label={group.project} className="catalog-group">
            <div className="catalog-group-header" aria-hidden="true">
              <span>{group.project}</span>
              <span className="catalog-group-artist">{group.artist}</span>
            </div>
            {group.items.map((piece, offset) => {
              const i = group.start + offset
              return (
                <div
                  key={piece.tokenId}
                  id={`catalog-item-${i}`}
                  role="option"
                  aria-selected={i === selected}
                  aria-label={`${piece.projectName} #${piece.editionNumber}`}
                  className={i === selected ? 'catalog-item is-selected' : 'catalog-item'}
                  onClick={() => onSelect(piece)}
                  onMouseEnter={() => setSelected(i)}
                >
                  <span className="catalog-item-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="catalog-item-name">
                    <em>#{piece.editionNumber}</em>
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
