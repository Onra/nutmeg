import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { seededRandom } from '../lib/random'

const DUST_COUNT = 190
/** Tilt of the galactic band. */
const BAND_TILT = -0.32
const BAND_THICKNESS = 0.17
const BULGE_LENGTH = 0.4
const BULGE_THICKNESS = 0.13

interface Speck {
  fx: number
  fy: number
  size: number
  opacity: number
  duration: number
  delay: number
}

/**
 * Likelihood of dust at a fractional viewport coordinate: a tilted band with
 * a brighter core, so the far field reads as a galaxy rather than a scatter.
 */
function density(fx: number, fy: number): number {
  const u = fx - 0.5
  const v = fy - 0.5
  const along = u * Math.cos(BAND_TILT) + v * Math.sin(BAND_TILT)
  const across = -u * Math.sin(BAND_TILT) + v * Math.cos(BAND_TILT)
  const band = Math.exp(-((across / BAND_THICKNESS) ** 2))
  const bulge = Math.exp(-((along / BULGE_LENGTH) ** 2 + (across / BULGE_THICKNESS) ** 2))
  return Math.min(1, 0.16 + 0.6 * band + 0.45 * bulge)
}

function buildDust(): Speck[] {
  const rand = seededRandom('nutmeg-stardust')
  const dust: Speck[] = []
  // Rejection sampling against the density field. The loop is bounded so a
  // run of unlucky draws can never spin.
  for (let i = 0; dust.length < DUST_COUNT && i < DUST_COUNT * 40; i++) {
    const fx = rand()
    const fy = rand()
    const local = density(fx, fy)
    if (rand() > local) continue
    // Apparent magnitude, biased faint: a few specks carry the field and the
    // rest are barely there.
    const magnitude = rand() ** 1.6
    const duration = 5 + rand() * 8
    dust.push({
      fx,
      fy,
      size: 0.9 + magnitude * 1.4,
      opacity: (0.11 + magnitude * 0.19) * (0.45 + 0.55 * local),
      duration,
      delay: -rand() * duration,
    })
  }
  return dust
}

/**
 * The far field behind the collection: dust too faint and too small to
 * compete with the pieces, and deliberately inert — the lantern reveals only
 * what is actually in the collection, so brightening under it stays the
 * signal that a point can be opened.
 */
export function Starfield() {
  const dust = useMemo(() => buildDust(), [])

  return (
    <div className="stardust" aria-hidden="true">
      {dust.map((speck, i) => (
        <span
          key={i}
          className="speck"
          style={
            {
              left: `${(speck.fx * 100).toFixed(2)}%`,
              top: `${(speck.fy * 100).toFixed(2)}%`,
              '--speck-size': `${speck.size.toFixed(2)}px`,
              '--speck-opacity': speck.opacity.toFixed(3),
              '--twinkle-dur': `${speck.duration.toFixed(2)}s`,
              '--twinkle-delay': `${speck.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
