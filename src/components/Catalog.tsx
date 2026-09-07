import { useEffect, useMemo, useRef, useState } from 'react'
import type { Piece } from '../types'

interface CatalogProps {
  pieces: Piece[]
  /** 'panel' — small centered frame (desktop); 'sheet' — bottom sheet (touch). */
  variant: 'panel' | 'sheet'
  onSelect: (piece: Piece) => void
  onClose: () => void
}

type CatalogNode =
  | { kind: 'header'; project: string }
  | { kind: 'item'; piece: Piece }

/**
 * The collection index: pieces grouped by project, summoned on demand.
 * Selection moves with the arrow keys or j/k over headers and editions
 * alike; Enter opens an edition or collapses/expands a project, Escape
 * (or a tap outside) returns to the dark. All groups start open.
 */
export function Catalog({ pieces, variant, onSelect, onClose }: CatalogProps) {
  const [selected, setSelected] = useState(0)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)

  // Pieces grouped by project in order of first appearance. Catalog numbers
  // are fixed per piece (grouped display order) and survive collapsing.
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

  // The navigable view: headers always present, items only while their
  // group is open. `flat` mirrors the on-screen order for key handling.
  const { view, flat } = useMemo(() => {
    const flat: CatalogNode[] = []
    const view = groups.map((group) => {
      const open = !collapsed.has(group.project)
      const headerIndex = flat.length
      flat.push({ kind: 'header', project: group.project })
      const items = group.items.map((piece, offset) => {
        const node = { piece, ordinal: group.start + offset + 1, index: -1 }
        if (open) {
          node.index = flat.length
          flat.push({ kind: 'item', piece })
        }
        return node
      })
      return { ...group, open, headerIndex, items }
    })
    return { view, flat }
  }, [groups, collapsed])

  const toggleGroup = (project: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(project)) next.delete(project)
      else next.add(project)
      return next
    })
  }

  const stateRef = useRef({ flat, selected, onSelect, onClose })
  stateRef.current = { flat, selected, onSelect, onClose }

  // Collapsing a group above the selection can shorten the list.
  useEffect(() => {
    setSelected((current) => Math.min(current, flat.length - 1))
  }, [flat.length])

  useEffect(() => {
    listRef.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      const { flat, selected, onSelect, onClose } = stateRef.current
      const step = (delta: number) => {
        e.preventDefault()
        setSelected((current) => (current + delta + flat.length) % flat.length)
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
        case 'Enter': {
          e.preventDefault()
          const node = flat[selected]
          if (node.kind === 'header') toggleGroup(node.project)
          else onSelect(node.piece)
          break
        }
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
    document.getElementById(`catalog-node-${selected}`)?.scrollIntoView({ block: 'nearest' })
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
        role="tree"
        aria-label="Collection index"
        aria-activedescendant={`catalog-node-${selected}`}
        tabIndex={-1}
      >
        {view.map((group) => (
          <div key={group.project} className="catalog-group">
            <div
              id={`catalog-node-${group.headerIndex}`}
              role="treeitem"
              aria-expanded={group.open}
              aria-selected={group.headerIndex === selected}
              className={
                group.headerIndex === selected
                  ? 'catalog-group-header is-selected'
                  : 'catalog-group-header'
              }
              onClick={() => toggleGroup(group.project)}
              onMouseEnter={() => setSelected(group.headerIndex)}
            >
              <span className="catalog-caret" aria-hidden="true">
                {group.open ? '▾' : '▸'}
              </span>
              <span className="catalog-group-name">{group.project}</span>
              <span className="catalog-group-artist">{group.artist}</span>
            </div>
            {group.open && (
              <div role="group">
                {group.items.map(({ piece, ordinal, index }) => (
                  <div
                    key={piece.tokenId}
                    id={`catalog-node-${index}`}
                    role="treeitem"
                    aria-selected={index === selected}
                    aria-label={`${piece.projectName} #${piece.editionNumber}`}
                    className={index === selected ? 'catalog-item is-selected' : 'catalog-item'}
                    onClick={() => onSelect(piece)}
                    onMouseEnter={() => setSelected(index)}
                  >
                    <span className="catalog-item-no">{String(ordinal).padStart(2, '0')}</span>
                    <span className="catalog-item-name">
                      <em>#{piece.editionNumber}</em>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
