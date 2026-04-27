# ADR 003: Canvas 2D tile generation with atlas packing

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
- All tile canvases share the fixed height `PSETILE.C_TILE_CANVAS_HEIGHT = 100`.
- Registration sequence: call `initializeTextureFor(library)` for each library, then `buildAtlas(tileW)` once.

## Consequences

- All tile drawing is testable in Node.js without a browser or PIXI.
- One GPU texture for all procedural tiles; PIXI can batch the entire map in one draw call.
- Icon tiles draw in flat canvas space by resetting the isometric transform (`ctx.setTransform(1,0,0,1,0,0)`) before drawing shapes.
- `ASROAD_DISPLAY_TILE.createTexture` contains dead code that calls PIXI.Graphics methods (`.beginFill`, `.lineStyle`). It is never executed: all road display tile IDs have entries in `C_TILE_ROAD_DISPLAY_TEXTURE_MAP` and take the sprite-sheet path in `initializeTextureFor`. This code should be cleaned up if the road display system is revisited.
- `C_TILE_ZONE` has `DEFAULT` and `DIRT` both equal to `10`. This causes `initializeTextureFor` to push two entries for tile ID 10, resulting in one redundant atlas slot and one overwritten `TextureCache` entry.
