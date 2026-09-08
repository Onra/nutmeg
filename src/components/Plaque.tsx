import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Piece } from '../types'
import { mediaVariant } from '../data/loader'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
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
  const reducedMotion = usePrefersReducedMotion()
  /** The artwork's rect captured just before a fullscreen toggle (FLIP). */
  const flipFromRef = useRef<DOMRect | null>(null)

  const artEl = () =>
    stageRef.current?.querySelector<HTMLElement>('img, canvas, iframe') ?? null

  // Live pieces don't glide — the room fades to black, the generator is
  // remounted (restarting from its first frame) at the new size, and the
  // black lifts again.
  const [veil, setVeil] = useState(false)
  const [liveEpoch, setLiveEpoch] = useState(0)
  const veilTimers = useRef<number[]>([])
  useEffect(() => {
    const timers = veilTimers.current
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  // Both directions animate: static artwork FLIPs from where it was to its
  // new home (see the layout effect below); live artwork goes through the
  // veil. Reduced motion swaps instantly either way.
  const requestExpand = (next: boolean) => {
    if (live) {
      if (reducedMotion) {
        setLiveReady(false)
        setLiveEpoch((epoch) => epoch + 1)
        setExpanded(next)
        return
      }
      setVeil(true)
      veilTimers.current.push(
        window.setTimeout(() => {
          setLiveReady(false)
          setLiveEpoch((epoch) => epoch + 1)
          setExpanded(next)
          veilTimers.current.push(window.setTimeout(() => setVeil(false), 200))
        }, 340),
      )
      return
    }
    if (!reducedMotion) flipFromRef.current = artEl()?.getBoundingClientRect() ?? null
    setExpanded(next)
  }

  useLayoutEffect(() => {
    const first = flipFromRef.current
    flipFromRef.current = null
    const art = artEl()
    if (!first || !art) return
    const last = art.getBoundingClientRect()
    if (last.width === 0 || last.height === 0) return
    const dx = first.left + first.width / 2 - (last.left + last.width / 2)
    const dy = first.top + first.height / 2 - (last.top + last.height / 2)
    // Only the artwork glides; its plinth shadow fades rather than scales
    // (out quickly on the way up, back just before landing on the way down).
    const shadowTiming = expanded ? 'box-shadow 0.2s ease' : 'box-shadow 0.25s ease 0.4s'
    art.style.willChange = 'transform'
    art.style.transition = 'none'
    art.style.transform = `translate(${dx}px, ${dy}px) scale(${first.width / last.width}, ${first.height / last.height})`
    // Force a style flush so the inverse transform is the transition's
    // start state, then release it in the same tick.
    void art.getBoundingClientRect()
    art.style.transition = `transform 0.5s cubic-bezier(0.22, 0.7, 0.3, 1), ${shadowTiming}`
    art.style.transform = ''
    const timer = window.setTimeout(() => {
      art.style.transition = ''
      art.style.willChange = ''
    }, 700)
    return () => window.clearTimeout(timer)
  }, [expanded])

  // Escape steps back: out of fullscreen first, then out of the plaque.
  useFocusTrap(dialogRef, () => {
    if (expandedRef.current) requestExpand(false)
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

  // Touch: dragging downward anywhere on the plaque slides it with the
  // finger and closes past a small threshold. Uses raw touch events with a
  // claim step: a mostly-vertical downward pull while the backdrop sits at
  // its scroll top claims the gesture (preventDefault stops the scroll);
  // anything else is left to native scrolling — pointer events were no
  // good here, since a scroll fires pointercancel and killed the drag on
  // tall plaques (exactly the audio piece's). In fullscreen the artwork
  // itself slides — a transform on the dialog would re-anchor it.
  useEffect(() => {
    const stage = stageRef.current
    const dialog = dialogRef.current
    const backdrop = dialog?.parentElement
    if (!stage || !dialog || !backdrop) return
    let startX = 0
    let startY = 0
    let dy = 0
    let active = false
    let claimed = false
    const target = () =>
      expandedRef.current
        ? (stage.querySelector<HTMLElement>('img, canvas, iframe') ?? stage)
        : dialog
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      // Links and buttons keep their taps.
      if ((e.target as HTMLElement).closest('a, button')) return
      active = true
      claimed = false
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      dy = 0
      draggedRef.current = false
    }
    const onMove = (e: TouchEvent) => {
      if (!active) return
      const touch = e.touches[0]
      const dxAbs = Math.abs(touch.clientX - startX)
      dy = touch.clientY - startY
      if (!claimed) {
        if (dy > 6 && dy > dxAbs && backdrop.scrollTop <= 0) claimed = true
        else if (dy < -6 || dxAbs > 12) {
          active = false
          return
        } else return
      }
      e.preventDefault()
      if (dy > 8) draggedRef.current = true
      target().style.transform = dy > 0 ? `translateY(${dy}px)` : ''
    }
    const onEnd = () => {
      if (!active) return
      active = false
      if (!claimed) return
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
    dialog.addEventListener('touchstart', onStart, { passive: true })
    dialog.addEventListener('touchmove', onMove, { passive: false })
    dialog.addEventListener('touchend', onEnd)
    dialog.addEventListener('touchcancel', onEnd)
    return () => {
      dialog.removeEventListener('touchstart', onStart)
      dialog.removeEventListener('touchmove', onMove)
      dialog.removeEventListener('touchend', onEnd)
      dialog.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const onStageClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    // Sounding pieces never expand — their clicks start the music.
    if (piece.audio) return
    requestExpand(!expandedRef.current)
  }

  const year = piece.mintDate.slice(0, 4)
  const featureEntries = Object.entries(piece.features)

  return (
    <div
      className={expanded ? 'plaque-backdrop is-expanded' : 'plaque-backdrop'}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        // While fullscreen, a click beside the artwork steps back to the
        // plaque rather than closing the room's door entirely.
        if (expandedRef.current) requestExpand(false)
        else onClose()
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
                  key={liveEpoch}
                  className={liveReady ? 'is-loaded' : undefined}
                  allow="autoplay"
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
      <div className={veil ? 'plaque-veil is-on' : 'plaque-veil'} aria-hidden="true" />
    </div>
  )
}
