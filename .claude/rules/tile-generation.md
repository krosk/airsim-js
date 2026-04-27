---
paths:
  - pse-tile.js
  - airsim-tile.js
  - airsim-tile-const.js
  - test/tile-generation.test.js
---

# Tile generation rules

Rules that apply when touching tile generation files. See `docs/decisions/002-tile-rendering.md` for the rationale.

## createTexture return type

Every `createTexture(id)` method in a tile library must return a canvas — an object with `getContext`, `width`, and `height`. Never return a PIXI object. `PSETILE.initializeTextureFor` passes the return value directly to `atlasCtx.drawImage`. A non-canvas return causes a silent failure at draw time.

## Canvas factory

Never call `document.createElement('canvas')` directly inside `pse-tile.js` or `airsim-tile.js`. Always go through `PSETILE.createCanvas(w, h)` or `PSETILE.createTexture(...)`. The factory is injectable for testing via `PSETILE.setCanvasFactory(fn)`.

## Atlas registration order

The sequence in `ASTILE.initializeTexture` must be:
1. `PSETILE.initializeTextureFor(library)` for every library, in any order.
2. `PSETILE.buildAtlas(tileW)` exactly once, after all libraries are registered.

Never call `buildAtlas` mid-sequence. Tiles added after `buildAtlas` are silently lost.

## Atlas column count

`buildAtlas` uses a fixed 16-column grid (`cols = 16`). The atlas canvas width is always `16 * tileW`. Do not change this without updating the corresponding assertion in `test/tile-generation.test.js`.

## Tile ID uniqueness

Do not assign the same integer to two keys in the same `C_TILE_*` object. Duplicate IDs cause `initializeTextureFor` to push redundant entries into `m_pendingTiles`, wasting atlas slots and overwriting `TextureCache` entries. The existing `DEFAULT`/`DIRT` = `10` duplicate in `C_TILE_ZONE` is a known issue; do not introduce new ones.

## var vs let in top-level IIFE declarations

Top-level module declarations that must be accessible as vm context properties (e.g., from test code after `runInContext`) must use `var`, not `let`. Currently: `ASTILE` in `airsim-tile.js`, `PSETILE` in `pse-tile.js`, `ASTILE_ID` in `airsim-tile-const.js`. Do not change these to `let`. Do not change other `let` declarations inside the IIFEs to `var`.
