/**
 * Integration point for populating src/data/collection.json automatically.
 *
 * There is currently no API key available, so this script only documents the
 * seam. When a key exists, run it with:
 *
 *   NUTMEG_API_KEY=... npx tsx scripts/fetch-collection.ts 0xYourWallet
 *
 * Implementation sketch (kept out of the app bundle on purpose):
 *  1. Query an indexer for Art Blocks tokens held by the wallet, e.g.
 *     Alchemy `getNFTsForOwner` filtered to the Art Blocks contracts, or the
 *     Art Blocks public token API (token.artblocks.io/{tokenId}) which needs
 *     no key for metadata and features.
 *  2. Map each token onto the Piece shape in src/types.ts. The `features`
 *     object comes straight from the token metadata's `features` field.
 *  3. Assign `rarity` (legendary / rare / common) — this is curatorial, not
 *     on-chain data. A reasonable automatic rule: edition size < 500 or
 *     historically significant project => legendary; < 1200 => rare;
 *     otherwise common. Hand-tune afterwards.
 *  4. Write the array to src/data/collection.json. The rendering layer only
 *     reads through loadCollection() in src/data/loader.ts, so nothing else
 *     changes.
 */

const key = process.env.NUTMEG_API_KEY

if (!key) {
  console.error(
    'No NUTMEG_API_KEY set — nothing fetched. collection.json remains hand-curated.\n' +
      'See the comment block in this file for how to wire in an indexer.',
  )
  process.exit(1)
}

console.error('Indexer integration not implemented yet — see the sketch above.')
process.exit(1)
