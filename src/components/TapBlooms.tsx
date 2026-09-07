import { useEffect, useState } from 'react'

interface Bloom {
  id: number
  x: number
  y: number
}

/**
 * A brief lantern-colored bloom at each touch point — the same
 * light-reveals-the-room language as the desktop lantern, in tap form.
 */
export function TapBlooms() {
  const [blooms, setBlooms] = useState<Bloom[]>([])

  useEffect(() => {
    let counter = 0
    const timers = new Set<number>()
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      const id = ++counter
      setBlooms((current) => [...current, { id, x: e.clientX, y: e.clientY }])
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        setBlooms((current) => current.filter((b) => b.id !== id))
      }, 1200)
      timers.add(timer)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  return (
    <>
      {blooms.map((bloom) => (
        <span
          key={bloom.id}
          className="tap-bloom"
          style={{ left: bloom.x, top: bloom.y }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}
