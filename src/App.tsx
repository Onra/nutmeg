import { useCallback, useState } from 'react'
import { Lantern } from './components/Lantern'
import { useInputMode } from './hooks/useInputMode'
import { useLantern } from './hooks/useLantern'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

export default function App() {
  const [hasInteracted, setHasInteracted] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const inputMode = useInputMode()

  const onFirstMove = useCallback(() => setHasInteracted(true), [])
  const { glowRef } = useLantern({
    enabled: inputMode === 'pointer',
    reducedMotion,
    onFirstMove,
  })

  return (
    <main className={`room mode-${inputMode}`} aria-label="nutmeg — a small gallery in the dark">
      {inputMode === 'pointer' && <Lantern glowRef={glowRef} lit={hasInteracted} dimmed={false} />}
    </main>
  )
}
