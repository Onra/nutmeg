export type Rarity = 'legendary' | 'rare' | 'common'

export interface Piece {
  tokenId: string
  contract: string
  projectName: string
  artist: string
  editionNumber: number
  /**
   * Not part of raw Art Blocks metadata — a curatorial assignment stored
   * explicitly so the point-encoding logic has something to read. Optional:
   * pieces without it render at the quietest (common) presentation and the
   * plaque simply omits the rarity mention.
   */
  rarity?: Rarity
  /** Static snapshot; thumb/ and hd/ variants exist at media.artblocks.io. */
  imageUrl?: string
  /** Live generative view (iframe-able); heavier than an <img>, optional. */
  generatorUrl?: string
  externalUrl?: string
  features: Record<string, string>
  mintDate: string
}
