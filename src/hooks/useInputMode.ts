import { useSyncExternalStore } from 'react'

const QUERY = '(pointer: coarse)'

export type InputMode = 'pointer' | 'touch'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * The lantern needs a hovering cursor; coarse pointers get the ambient-glow
 * and tap-bloom treatment instead.
 */
export function useInputMode(): InputMode {
  return useSyncExternalStore(subscribe, () =>
    window.matchMedia(QUERY).matches ? 'touch' : 'pointer',
  )
}
