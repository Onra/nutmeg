import { useCallback, useEffect, useState } from 'react'
import { Field } from './components/Field'
import { Lantern } from './components/Lantern'
import { Plaque } from './components/Plaque'
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
  const reducedMotion = usePrefersReducedMotion()
  const inputMode = useInputMode()
  const positions = useSeededPositions(pieces)

  useEffect(() => {
    loadCollection().then(setPieces)
  }, [])

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
      <Wordmark visible={wordmarkVisible} />
      {active && <Plaque piece={active} onClose={() => setActive(null)} />}
      <div className="grain" aria-hidden="true" />
    </main>
  )
}
