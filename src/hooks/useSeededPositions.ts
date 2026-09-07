import { useEffect, useMemo, useState } from 'react'
import type { Piece } from '../types'
import { seededRandom } from '../lib/random'

export interface FractionalPosition {
  fx: number
  fy: number
}

/** Minimum spacing between points, measured in aspect-corrected fractions. */
const MIN_DISTANCE = 0.2
const CANDIDATES = 60

/**
 * Deterministic scatter: each piece's position stream is seeded from its
 * token id, then best-candidate sampling keeps points off a grid while
 * holding a minimum distance from one another and from the edges.
 */
export function scatter(pieces: Piece[], aspect: number): Map<string, FractionalPosition> {
  const placed: FractionalPosition[] = []
  const out = new Map<string, FractionalPosition>()
  for (const piece of pieces) {
    const rand = seededRandom(piece.tokenId)
    let best: FractionalPosition = { fx: 0.5, fy: 0.5 }
    let bestScore = -1
    for (let i = 0; i < CANDIDATES; i++) {
      const candidate = { fx: 0.08 + rand() * 0.84, fy: 0.14 + rand() * 0.7 }
      let nearest = Infinity
      for (const other of placed) {
        const dx = (candidate.fx - other.fx) * aspect
        const dy = candidate.fy - other.fy
        nearest = Math.min(nearest, Math.hypot(dx, dy))
      }
      if (nearest > bestScore) {
        bestScore = nearest
        best = candidate
      }
      if (nearest >= MIN_DISTANCE) break
    }
    placed.push(best)
    out.set(piece.tokenId, best)
  }
  return out
}

export function useSeededPositions(pieces: Piece[]): Map<string, FractionalPosition> {
  const [aspect, setAspect] = useState(() => window.innerWidth / window.innerHeight)

  useEffect(() => {
    let timer: number | undefined
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setAspect(window.innerWidth / window.innerHeight), 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(timer)
    }
  }, [])

  return useMemo(() => scatter(pieces, aspect), [pieces, aspect])
}
