/**
 * Touch-mode stand-in for the lantern: a soft fixed warm glow (slowly
 * drifting, static under reduced motion) so the room isn't pure black
 * when there is no hovering cursor to follow.
 */
export function AmbientGlow() {
  return <div className="ambient" aria-hidden="true" />
}
