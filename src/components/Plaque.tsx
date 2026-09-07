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

  const [thumbReady, setThumbReady] = useState(false)
  const [hdReady, setHdReady] = useState(false)
  const [liveReady, setLiveReady] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const live = Boolean(piece.renderGenerator && piece.generatorUrl)
  const thumb = piece.imageUrl ? mediaVariant(piece.imageUrl, 'thumb') : null
  const hd = piece.imageUrl ? mediaVariant(piece.imageUrl, 'hd') : null

  // The thumb renders immediately; the HD snapshot swaps in once cached.
  // Pieces shown alive skip the snapshot pipeline entirely.
  useEffect(() => {
    setThumbReady(false)
    setHdReady(false)
    setLiveReady(false)
    setImgFailed(false)
    if (!hd || live) return
    const img = new Image()
    img.onload = () => setHdReady(true)
    img.src = hd
    return () => {
      img.onload = null
    }
  }, [hd, live])

  // `o` opens the piece on Art Blocks while its plaque is up.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'o' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (piece.externalUrl) window.open(piece.externalUrl, '_blank', 'noopener,noreferrer')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [piece.externalUrl])

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
          {/* Fixed-size stage: the artwork fades in over its spotlight, so
              loading never reflows the plaque or spawns scrollbars. */}
          <div className="plaque-stage">
            {live ? (
              <iframe
                className={liveReady ? 'is-loaded' : undefined}
                src={piece.generatorUrl}
                title={`${piece.projectName} #${piece.editionNumber} — live generative view`}
                onLoad={() => setLiveReady(true)}
              />
            ) : thumb && !imgFailed ? (
              <img
                className={thumbReady ? 'is-loaded' : undefined}
                src={hdReady && hd ? hd : thumb}
                alt={`${piece.projectName} #${piece.editionNumber} by ${piece.artist}`}
                onLoad={() => setThumbReady(true)}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <ProceduralArt piece={piece} />
            )}
          </div>
        </figure>
        <div className="plaque-panel">
          <h2 id="plaque-title" className="plaque-title">
            {piece.projectName} <span className="plaque-edition">#{piece.editionNumber}</span>
          </h2>
          <p className="plaque-meta">
            No. {piece.tokenId} — {piece.artist}, {year}
          </p>
          {piece.rarity && (
            <p className={`plaque-rarity rarity--${piece.rarity}`}>{piece.rarity}</p>
          )}
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
