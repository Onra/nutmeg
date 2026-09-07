import raw from './collection.json'
import type { Piece } from '../types'

/**
 * Single seam between the data source and the rendering layer.
 *
 * Today the collection is a hand-curated JSON file (no on-chain fetching).
 * When an indexer key becomes available (Alchemy / OpenSea / Art Blocks
 * token API), either swap this implementation for a fetch, or run
 * scripts/fetch-collection.ts to regenerate collection.json — no component
 * needs to change either way.
 */
export async function loadCollection(): Promise<Piece[]> {
  // The JSON import infers a union of literal feature keys per entry, which
  // is not directly comparable to Record<string, string> — widen through
  // unknown; the shape is guaranteed by hand-curation (or the fetch script).
  return raw as unknown as Piece[]
}

/**
 * Art Blocks serves resized snapshots alongside the full render:
 * media.artblocks.io/thumb/{id}.png and media.artblocks.io/hd/{id}.png.
 * Falls through untouched for non-Art-Blocks image hosts.
 */
export function mediaVariant(imageUrl: string, variant: 'thumb' | 'hd'): string {
  const m = imageUrl.match(/^https:\/\/media\.artblocks\.io\/(\d+\.png)$/)
  return m ? `https://media.artblocks.io/${variant}/${m[1]}` : imageUrl
}
