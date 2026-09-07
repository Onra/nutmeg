# nutmeg

A personal Art Blocks gallery designed like a small museum room after hours.

The page loads black, with no title and no navigation — that is intentional.
On desktop, a warm lantern glow follows the cursor and faintly reveals about
a dozen breathing points scattered through the dark; each one is a piece in
the collection. Point size and intensity quietly encode rarity. Clicking a
point raises the piece on a pedestal with a museum plaque (title, catalog
number, rarity, traits). Escape or a click outside returns you to the dark.
On touch devices the lantern is replaced by a soft fixed ambient glow,
slightly brighter points, and a small bloom of light at each tap.

## Running

```sh
npm install
npm run dev      # local development
npm run build    # type-check + production build
```

## Data

The collection lives in `src/data/collection.json` — one object per piece,
exported/curated by hand (there is no API key, so no live on-chain
fetching). Both `media.artblocks.io/{tokenId}.png` URLs (where `thumb/` and
`hd/` variants load progressively) and `media-proxy.artblocks.io/...` URLs
are supported.

One field deserves a note: **`rarity`** (`legendary` / `rare` / `common`)
is *not* Art Blocks metadata — it is an optional curatorial assignment.
Pieces that carry it get the size/intensity point encoding and a rarity
mention on the plaque; pieces without it render at the quietest tier and
the plaque omits the mention (the console lists unranked tokens as a
reminder).

Incomplete data never breaks the gallery: an entry with no `imageUrl` (or a
broken one) falls back to seeded procedural stand-in art — geometric shapes
under a central glow.

### Populating automatically later

Rendering only reads through `loadCollection()` in `src/data/loader.ts`.
`scripts/fetch-collection.ts` documents the integration point: given an
indexer key (Alchemy / OpenSea) or the keyless Art Blocks token API, it
should regenerate `collection.json` in the same shape — no component changes
needed. Each piece also carries its `generatorUrl` (the live, iframe-able
generative view) for an eventual "shown alive" mode.

## Accessibility

- Points are real buttons: Tab reaches them, Enter opens the plaque, Escape
  closes it, and focus returns to the point you came from.
- Plaque text sits on its own panel at ≥ 4.5:1 contrast.
- `prefers-reduced-motion` disables point breathing, the lantern lerp trail,
  the grain flicker, ambient drift, and tap blooms.
