# ADR 002: Canvas 2D tile generation with atlas packing

**Date:** 2026-04-27  
**Status:** Decided

## Context

Previously, `PSETILE.createTexture` returned a `PIXI.Graphics` object. Each tile became a separate GPU texture when rendered, which defeats PIXI's sprite batching: sprites with different textures cannot be batched into a single draw call. On a 16×16 map with ~103 distinct tile types, every frame could issue up to 256 separate draw calls.

Additionally, PIXI.Graphics objects cannot be created or inspected outside a browser, making tile generation untestable.

## Options considered

**Keep PIXI.Graphics**  
Familiar API, no migration cost. Untestable outside a browser. Does not solve texture fragmentation.

**Canvas 2D with atlas packing (chosen)**  
Draw tiles onto `HTMLCanvasElement` via Canvas 2D API. After all tiles are drawn, pack them into one atlas canvas and register PIXI sub-textures via `new PIXI.Texture(baseTexture, new PIXI.Rectangle(x, y, w, h))`. One `PIXI.BaseTexture` for all procedural tiles — batching works across the whole map.

**Upgrade to PIXI v5+ (auto-batching)**  
PIXI v5 batches sprites with different textures via a multi-texture shader. Would solve fragmentation without an atlas. Requires a significant API migration (v4 → v5 is a breaking change: resource system, ticker API, display object changes). No clear win over the atlas approach for this codebase.

## Decision

Canvas 2D with atlas packing. `PSETILE.drawBlock` and `PSETILE.createTexture` use only Canvas 2D API. PIXI is touched only in `PSETILE.buildAtlas`. The canvas factory is injectable (`PSETILE.setCanvasFactory`) so tests can substitute `node-canvas`.

## Atlas layout

- Fixed 16-column grid. Atlas width = `16 * tileW`.
- Atlas rows are `C_TILE_CANVAS_HEIGHT = 100` px tall (the atlas canvas row pitch is uniform).
- Each tile carries its own `frameH` (canvas.height at the time it was pushed to `m_pendingTiles`). PIXI sub-texture rectangles use `frameH`, not the row pitch. This allows mixed canvas heights in one atlas: map tiles use `frameH = 100`, icon tiles use `frameH = texSizeY = 32`.
- Registration sequence: call `initializeTextureFor(library)` for each library, then `buildAtlas(tileW)` once.

## Mixed-height tiles and ASMAPUI icon sizing

Icon tile libraries (`ASICON_TILE`) create canvases of height `texSizeY` (currently 32 px) by passing `texSizeY` as the optional `canvasHeight` argument to `PSETILE.createTexture`. This keeps icon sprites compact.

Map tile libraries (`ASTILE`, `ASZONE_DISPLAY_TILE`, etc.) use the default `canvasHeight = C_TILE_CANVAS_HEIGHT = 100`. These tiles are intentionally tall so the isometric block extrusion is visible above the diamond base.

`ASMAPUI.createSprite` (`airsim.js`) assembles the toolbar. It enforces `C_ICON_HEIGHT = 48` px on every sprite:

- If `texture.height <= C_ICON_HEIGHT` (icon tiles, frameH = 32): sprite is used as-is; PIXI auto-sizes to 32 px.
- If `texture.height > C_ICON_HEIGHT` (map tiles, frameH = 100): a new `PIXI.Texture` is created that crops the bottom `C_ICON_HEIGHT` pixels of the atlas frame, showing the isometric diamond region without scaling distortion. The crop frame is:
  ```
  x = frame.x,  y = frame.y + frame.height - C_ICON_HEIGHT,
  w = C_ICON_WIDTH,  h = C_ICON_HEIGHT
  ```

Consequence: if you change `C_TILE_CANVAS_HEIGHT` or `texSizeY` in ASICON_TILE, the threshold comparison `texture.height > C_ICON_HEIGHT` in `createSprite` may need updating.

## Consequences

- All tile drawing is testable in Node.js without a browser or PIXI.
- One GPU texture for all procedural tiles; PIXI can batch the entire map in one draw call.
- Icon tile shape functions (`addSquare`, `addPlay`, etc.) must compute their canvas center as `texSizeY / 2`, not `PSETILE.C_TILE_CANVAS_HEIGHT / 2`. Using the wrong constant places shapes at pixel 50 on a 32 px canvas, drawing outside the visible area.
- `ASROAD_DISPLAY_TILE.createTexture` contains dead code that calls PIXI.Graphics methods (`.beginFill`, `.lineStyle`). It is never executed: all road display tile IDs have entries in `C_TILE_ROAD_DISPLAY_TEXTURE_MAP` and take the sprite-sheet path in `initializeTextureFor`. This code should be cleaned up if the road display system is revisited.
- `C_TILE_ZONE` has `DEFAULT` and `DIRT` both equal to `10`. This causes `initializeTextureFor` to push two entries for tile ID 10, resulting in one redundant atlas slot and one overwritten `TextureCache` entry.
