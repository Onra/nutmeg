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
  const stageRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  /** Set while a touch drag is in flight, so its final click is swallowed. */
  const draggedRef = useRef(false)

  // Escape steps back: out of fullscreen first, then out of the plaque.
  useFocusTrap(dialogRef, () => {
    if (expandedRef.current) setExpanded(false)
    else onClose()
  })

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

  // Touch: dragging the artwork downward slides the plaque with the finger
  // and closes it past a small threshold (in fullscreen, the stage itself
  // slides — a transform on the dialog would re-anchor the fixed stage).
  useEffect(() => {
    const stage = stageRef.current
    const dialog = dialogRef.current
    if (!stage || !dialog) return
    let startY = 0
    let dy = 0
    let pointerId = -1
    let tracking = false
    const target = () => (expandedRef.current ? stage : dialog)
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      tracking = true
      pointerId = e.pointerId
      startY = e.clientY
      dy = 0
      draggedRef.current = false
    }
    const onMove = (e: PointerEvent) => {
      if (!tracking || e.pointerId !== pointerId) return
      dy = Math.max(0, e.clientY - startY)
      if (dy > 8) draggedRef.current = true
      target().style.transform = dy > 0 ? `translateY(${dy}px)` : ''
    }
    const onEnd = (e: PointerEvent) => {
      if (!tracking || e.pointerId !== pointerId) return
      tracking = false
      if (dy > 90) {
        closeRef.current()
        return
      }
      const el = target()
      el.style.transition = 'transform 0.25s ease'
      el.style.transform = ''
      window.setTimeout(() => {
        el.style.transition = ''
      }, 300)
    }
    stage.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      stage.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [])

  const onStageClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    // A sounding generator owns its clicks (they start the music).
    if (live && piece.audio) return
    setExpanded((current) => !current)
  }

  const year = piece.mintDate.slice(0, 4)
  const featureEntries = Object.entries(piece.features)

  return (
    <div
      className={expanded ? 'plaque-backdrop is-expanded' : 'plaque-backdrop'}
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
          <div ref={stageRef} className="plaque-stage" onClick={onStageClick}>
            {live ? (
              <>
                <iframe
                  className={liveReady ? 'is-loaded' : undefined}
                  src={piece.generatorUrl}
                  title={`${piece.projectName} #${piece.editionNumber} — live generative view`}
                  onLoad={() => setLiveReady(true)}
                />
                {/* Silent generators get a transparent click-catcher so a
                    click can reach the fullscreen toggle; sounding ones
                    keep their clicks (the gesture starts the audio). */}
                {!piece.audio && <span className="plaque-stage-catcher" aria-hidden="true" />}
              </>
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
          {piece.audio && live && (
            <figcaption className="plaque-audio-hint">
              ♪ &nbsp;click the piece to hear it
            </figcaption>
          )}
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
