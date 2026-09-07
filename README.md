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
hand-curated (there is no API key, so no live on-chain fetching). All pieces
are real Art Blocks tokens and their `imageUrl`s were verified against
`media.artblocks.io`; the site loads the `thumb/` variant first and swaps in
`hd/` once cached.

Two fields deserve a note:

- **`rarity`** (`legendary` / `rare` / `common`) is *not* Art Blocks
  metadata. It is a curatorial assignment stored explicitly so the
  point-encoding logic has something to read — guided by edition size and
  project stature, tuned by hand.
- **`features`** are hand-curated approximations of each token's traits
  (plausible per project, not fetched from the token API). Replace them with
  real values whenever the data is regenerated.

One entry (*Fragments of an Infinite Field #512*) deliberately has no
`imageUrl`, so the seeded procedural fallback (geometric shapes under a
central glow, tinted by rarity) stays a living code path — the gallery never
breaks on incomplete data.

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
