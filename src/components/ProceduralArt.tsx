import { useEffect, useRef } from 'react'
import type { Piece, Rarity } from '../types'
import { seededRandom } from '../lib/random'

/**
 * Seeded stand-in artwork for pieces with no image (or a broken one):
 * quiet geometric shapes under a central glow, tinted by rarity, fully
 * deterministic per token so a piece always looks like itself.
 */

const PALETTES: Record<Rarity, { tones: string[]; glow: string; ground: string }> = {
  legendary: {
    tones: ['#e0a860', '#c68a4b', '#9c5f2e', '#6b4423'],
    glow: 'rgba(224, 168, 96, 0.4)',
    ground: '#1a120a',
  },
  rare: {
    tones: ['#c68a4b', '#a8764a', '#7a5638', '#4d3a28'],
    glow: 'rgba(198, 138, 75, 0.32)',
    ground: '#171008',
  },
  common: {
    tones: ['#8a6f52', '#6e5741', '#544334', '#3a2f24'],
    glow: 'rgba(138, 111, 82, 0.28)',
    ground: '#141009',
  },
}

function draw(canvas: HTMLCanvasElement, piece: Piece, size: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const rand = seededRandom(piece.tokenId + ':art')
  const palette = PALETTES[piece.rarity]
  const pick = () => palette.tones[Math.floor(rand() * palette.tones.length)]

  ctx.fillStyle = palette.ground
  ctx.fillRect(0, 0, size, size)

  const shapeCount = 18 + Math.floor(rand() * 14)
  for (let i = 0; i < shapeCount; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 8 + rand() * size * 0.22
    ctx.globalAlpha = 0.1 + rand() * 0.3
    ctx.strokeStyle = pick()
    ctx.fillStyle = pick()
    ctx.lineWidth = 0.5 + rand() * 2
    const kind = rand()
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rand() * Math.PI * 2)
    if (kind < 0.3) {
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      if (rand() < 0.5) ctx.stroke()
      else ctx.fill()
    } else if (kind < 0.55) {
      ctx.beginPath()
      ctx.arc(0, 0, r, rand() * Math.PI, Math.PI + rand() * Math.PI)
      ctx.stroke()
    } else if (kind < 0.8) {
      const w = r * (0.4 + rand())
      const h = r * 0.25
      if (rand() < 0.5) ctx.strokeRect(-w / 2, -h / 2, w, h)
      else ctx.fillRect(-w / 2, -h / 2, w, h)
    } else {
      ctx.beginPath()
      ctx.moveTo(-r, 0)
      ctx.lineTo(r, 0)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Central glow, then a soft vignette to seat everything in the dark.
  ctx.globalAlpha = 1
  const cx = size * (0.42 + rand() * 0.16)
  const cy = size * (0.42 + rand() * 0.16)
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45)
  glow.addColorStop(0, palette.glow)
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.72)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(6, 4, 2, 0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, size, size)
}

export function ProceduralArt({ piece, size = 520 }: { piece: Piece; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) draw(ref.current, piece, size)
  }, [piece, size])

  return (
    <canvas
      ref={ref}
      className="procedural-art"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Generative placeholder for ${piece.projectName} #${piece.editionNumber}`}
    />
  )
}
