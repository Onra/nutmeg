import { useCallback, useEffect, useState } from 'react'
import { AmbientGlow } from './components/AmbientGlow'
import { Catalog } from './components/Catalog'
import { Field } from './components/Field'
import { Lantern } from './components/Lantern'
import { Plaque } from './components/Plaque'
import { TapBlooms } from './components/TapBlooms'
import { Wordmark } from './components/Wordmark'
import { loadCollection } from './data/loader'
import { useInputMode } from './hooks/useInputMode'
import { useLantern } from './hooks/useLantern'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { useSeededPositions } from './hooks/useSeededPositions'
import type { Piece } from './types'

export default function App() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [active, setActive] = useState<Piece | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [wordmarkVisible, setWordmarkVisible] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const inputMode = useInputMode()
  const positions = useSeededPositions(pieces)

  useEffect(() => {
    loadCollection().then(setPieces)
  }, [])

  // `i` summons the collection index (while no plaque is up).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'i' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (active) return
      setCatalogOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  // On touch devices the first tap counts as "starting to explore".
  useEffect(() => {
    if (inputMode !== 'touch') return
    const onPointerDown = () => setHasInteracted(true)
    window.addEventListener('pointerdown', onPointerDown, { once: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [inputMode])

  // The wordmark is never shown on load — only a few beats after the
  // visitor starts exploring.
  useEffect(() => {
    if (!hasInteracted) return
    const timer = window.setTimeout(() => setWordmarkVisible(true), 3200)
    return () => window.clearTimeout(timer)
  }, [hasInteracted])

  const onFirstMove = useCallback(() => setHasInteracted(true), [])
  const { glowRef, registerPoint } = useLantern({
    enabled: inputMode === 'pointer',
    reducedMotion,
    onFirstMove,
  })

  return (
    <main className={`room mode-${inputMode}`} aria-label="nutmeg — a small gallery in the dark">
      <Field pieces={pieces} positions={positions} registerPoint={registerPoint} onOpen={setActive} />
      {inputMode === 'pointer' && (
        <Lantern glowRef={glowRef} lit={hasInteracted} dimmed={active !== null} />
      )}
      {inputMode === 'touch' && <AmbientGlow />}
      {inputMode === 'touch' && !reducedMotion && <TapBlooms />}
      <Wordmark visible={wordmarkVisible} />
      {inputMode === 'pointer' && (
        <div className={wordmarkVisible ? 'shortcut-hint is-visible' : 'shortcut-hint'} aria-hidden="true">
          i — index
        </div>
      )}
      {inputMode === 'touch' && (
        <button
          type="button"
          className={wordmarkVisible ? 'catalog-handle is-visible' : 'catalog-handle'}
          aria-label="Open collection index"
          onClick={() => setCatalogOpen(true)}
        />
      )}
      {catalogOpen && (
        <Catalog
          pieces={pieces}
          variant={inputMode === 'touch' ? 'sheet' : 'panel'}
          onSelect={(piece) => {
            setCatalogOpen(false)
            setActive(piece)
          }}
          onClose={() => setCatalogOpen(false)}
        />
      )}
      {active && (
        <Plaque key={active.tokenId} piece={active} onClose={() => setActive(null)} />
      )}
      <div className="grain" aria-hidden="true" />
    </main>
  )
}
