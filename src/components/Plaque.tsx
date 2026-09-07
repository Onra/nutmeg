import { useEffect, useRef, useState } from 'react'
import type { Piece } from '../types'
import { mediaVariant } from '../data/loader'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { ProceduralArt } from './ProceduralArt'

interface PlaqueProps {
  piece: Piece
  onClose: () => void
}

export function Plaque({ piece, onClose }: PlaqueProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, onClose)

  const [hdReady, setHdReady] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const thumb = piece.imageUrl ? mediaVariant(piece.imageUrl, 'thumb') : null
  const hd = piece.imageUrl ? mediaVariant(piece.imageUrl, 'hd') : null

  // The thumb renders immediately; the HD snapshot swaps in once cached.
  useEffect(() => {
    setHdReady(false)
    setImgFailed(false)
    if (!hd) return
    const img = new Image()
    img.onload = () => setHdReady(true)
    img.src = hd
    return () => {
      img.onload = null
    }
  }, [hd])

  const year = piece.mintDate.slice(0, 4)
  const featureEntries = Object.entries(piece.features)

  return (
    <div
      className="plaque-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plaque-title"
        className="plaque"
        tabIndex={-1}
      >
        <figure className="plaque-art">
          {thumb && !imgFailed ? (
            <img
              src={hdReady && hd ? hd : thumb}
              alt={`${piece.projectName} #${piece.editionNumber} by ${piece.artist}`}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <ProceduralArt piece={piece} />
          )}
        </figure>
        <div className="plaque-panel">
          <h2 id="plaque-title" className="plaque-title">
            {piece.projectName} <span className="plaque-edition">#{piece.editionNumber}</span>
          </h2>
          <p className="plaque-meta">
            No. {piece.tokenId} — {piece.artist}, {year}
          </p>
          <p className={`plaque-rarity rarity--${piece.rarity}`}>{piece.rarity}</p>
          {featureEntries.length > 0 && (
            <dl className="plaque-features">
              {featureEntries.map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {piece.externalUrl && (
            <a className="plaque-link" href={piece.externalUrl} target="_blank" rel="noreferrer">
              view on art blocks
            </a>
          )}
        </div>
        <button type="button" className="plaque-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  )
}
