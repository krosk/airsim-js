---
paths:
  - pse-tile.js
  - airsim-tile.js
  - airsim-tile-const.js
  - test/tile-generation.test.js
---

# Tile generation rules

Rules that apply when touching tile generation files. See `docs/decisions/003-tile-rendering.md` for the rationale.

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

## Icon tile canvas height

Icon tile libraries (e.g. `ASICON_TILE`) must pass `texSizeY` as the 6th `canvasHeight` argument to `PSETILE.createTexture`. This produces a canvas of height `texSizeY` (currently 32 px), which becomes the PIXI sub-texture `frameH`. Shape helper functions (`addSquare`, `addPlay`, etc.) must center geometry at `texSizeY / 2`, not at `PSETILE.C_TILE_CANVAS_HEIGHT / 2 = 50`. Using 50 draws shapes outside the visible canvas area.

## ASMAPUI icon crop dependency

`ASMAPUI.createSprite` in `airsim.js` branches on `texture.height > C_ICON_HEIGHT (48)`:
- `frameH <= 48`: sprite used as-is (icon tiles at 32 px).
- `frameH > 48`: cropped to the bottom `C_ICON_HEIGHT` px of the atlas frame (map tiles at 100 px).

Do not change map tile canvas heights below 48 without updating this branch. Do not change icon tile canvas heights above 48 without testing the toolbar appearance.

## var vs let in top-level IIFE declarations

Top-level module declarations that must be accessible as vm context properties (e.g., from test code after `runInContext`) must use `var`, not `let`. Currently: `ASTILE`, `ASICON_TILE` in `airsim-tile.js`, `PSETILE` in `pse-tile.js`, `ASTILE_ID` in `airsim-tile-const.js`. Do not change these to `let`. Do not change other `let` declarations inside the IIFEs to `var`.
