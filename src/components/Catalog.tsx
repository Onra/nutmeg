import { useEffect, useRef, useState } from 'react'
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
  const stateRef = useRef({ pieces, selected, onSelect, onClose })
  stateRef.current = { pieces, selected, onSelect, onClose }

  useEffect(() => {
    listRef.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      const { pieces, selected, onSelect, onClose } = stateRef.current
      const step = (delta: number) => {
        e.preventDefault()
        setSelected((current) => (current + delta + pieces.length) % pieces.length)
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
          onSelect(pieces[selected])
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
        {pieces.map((piece, i) => (
          <div
            key={piece.tokenId}
            id={`catalog-item-${i}`}
            role="option"
            aria-selected={i === selected}
            className={i === selected ? 'catalog-item is-selected' : 'catalog-item'}
            onClick={() => onSelect(piece)}
            onMouseEnter={() => setSelected(i)}
          >
            <span className="catalog-item-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="catalog-item-name">
              {piece.projectName} <em>#{piece.editionNumber}</em>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
