import type { RefObject } from 'react'

interface LanternProps {
  glowRef: RefObject<HTMLDivElement | null>
  /** Becomes true on the first mouse movement — triggers the entrance bloom. */
  lit: boolean
  /** While a plaque is open the lantern pulls back to a small ember. */
  dimmed: boolean
}

export function Lantern({ glowRef, lit, dimmed }: LanternProps) {
  const className = ['lantern', lit && 'is-lit', dimmed && 'is-ember'].filter(Boolean).join(' ')
  return (
    <div ref={glowRef} className={className} aria-hidden="true">
      <div className="lantern-glow" />
    </div>
  )
}
