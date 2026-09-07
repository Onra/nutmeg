import { useCallback, useEffect, useRef } from 'react'

/** Distance (px) within which the lantern starts to reveal a point. */
const REVEAL_RADIUS = 210

interface RegisteredPoint {
  el: HTMLElement
  /** Fractional viewport coordinates, so no layout reads are needed per frame. */
  fx: number
  fy: number
}

interface LanternOptions {
  enabled: boolean
  reducedMotion: boolean
  onFirstMove: () => void
}

/**
 * Drives the cursor-following glow and the per-point proximity reveal from a
 * single requestAnimationFrame loop. The glow position is lerped for a
 * lagging, lantern-like feel; each registered point gets a `--near` custom
 * property (0..1) that its CSS folds into its opacity — no React re-renders
 * on mouse movement.
 */
export function useLantern(options: LanternOptions) {
  const glowRef = useRef<HTMLDivElement | null>(null)
  const pointsRef = useRef(new Map<string, RegisteredPoint>())
  const optionsRef = useRef(options)
  optionsRef.current = options

  const registerPoint = useCallback(
    (id: string, fx: number, fy: number) => (el: HTMLElement | null) => {
      if (el) pointsRef.current.set(id, { el, fx, fy })
      else pointsRef.current.delete(id)
    },
    [],
  )

  useEffect(() => {
    if (!options.enabled) return

    const target = { x: -10000, y: -10000 }
    const pos = { x: -10000, y: -10000 }
    let moved = false
    let raf = 0
    const lastNear = new Map<string, number>()

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      if (!moved) {
        moved = true
        // The glow blooms in exactly where the cursor first appears.
        pos.x = target.x
        pos.y = target.y
        optionsRef.current.onFirstMove()
      }
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!moved) return
      const k = optionsRef.current.reducedMotion ? 1 : 0.09
      pos.x += (target.x - pos.x) * k
      pos.y += (target.y - pos.y) * k
      const glow = glowRef.current
      if (glow) glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`

      const w = window.innerWidth
      const h = window.innerHeight
      for (const [id, p] of pointsRef.current) {
        const d = Math.hypot(p.fx * w - pos.x, p.fy * h - pos.y)
        const near = Math.max(0, 1 - d / REVEAL_RADIUS)
        const prev = lastNear.get(id) ?? -1
        if (Math.abs(near - prev) > 0.008) {
          p.el.style.setProperty('--near', near.toFixed(3))
          lastNear.set(id, near)
        }
      }
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [options.enabled])

  return { glowRef, registerPoint }
}
