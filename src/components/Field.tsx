import type { CSSProperties, Ref } from 'react'
import { useMemo } from 'react'
import type { Piece } from '../types'
import type { FractionalPosition } from '../hooks/useSeededPositions'
import { seededRandom } from '../lib/random'

interface FieldProps {
  pieces: Piece[]
  positions: Map<string, FractionalPosition>
  registerPoint: (id: string, fx: number, fy: number) => Ref<HTMLButtonElement>
  onOpen: (piece: Piece) => void
}

export function Field({ pieces, positions, registerPoint, onOpen }: FieldProps) {
  return (
    <div className="field">
      {pieces.map((piece) => {
        const position = positions.get(piece.tokenId)
        if (!position) return null
        return (
          <Point
            key={piece.tokenId}
            piece={piece}
            position={position}
            refCallback={registerPoint(piece.tokenId, position.fx, position.fy)}
            onOpen={onOpen}
          />
        )
      })}
    </div>
  )
}

interface PointProps {
  piece: Piece
  position: FractionalPosition
  refCallback: Ref<HTMLButtonElement>
  onOpen: (piece: Piece) => void
}

function Point({ piece, position, refCallback, onOpen }: PointProps) {
  // Desynchronized breathing: duration and phase are seeded per token.
  const breathing = useMemo(() => {
    const rand = seededRandom(piece.tokenId + ':breathe')
    const duration = 5 + rand() * 4
    return { duration, delay: -rand() * duration }
  }, [piece.tokenId])

  const style = {
    left: `${position.fx * 100}%`,
    top: `${position.fy * 100}%`,
    '--breathe-dur': `${breathing.duration.toFixed(2)}s`,
    '--breathe-delay': `${breathing.delay.toFixed(2)}s`,
  } as CSSProperties

  return (
    <button
      ref={refCallback}
      type="button"
      className={`point point--${piece.rarity}`}
      style={style}
      onClick={() => onOpen(piece)}
      aria-label={`${piece.projectName} #${piece.editionNumber} — ${piece.rarity}`}
      aria-haspopup="dialog"
    >
      <span className="point-core" aria-hidden="true" />
    </button>
  )
}
