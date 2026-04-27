# ADR 002 — Rendering strategy and known improvements

## Context

The rendering layer uses PIXI v4.7.0 (2018). The map is currently hardcoded at 16×16. The goal is to understand the performance ceiling and what changes are needed to support larger maps.

## Current architecture

`MMAPBATCH` groups tiles into 8×8 `PIXI.Container` batches with `cacheAsBitmap = true` (render-to-texture). This is a chunked render-to-texture strategy: static batches cost one draw call each, and only dirty batches are re-rendered. Off-screen batches are evicted via a lifetime counter (60 frames) and pooled for reuse. Viewport culling is implemented in `getBatchIndexInScreen2()`.

`C_MAX_BATCH_COUNT = 300` is declared but never enforced. The batch, `MMAPDATA`, and `ASSTATE` all accept arbitrary map dimensions. The only hardcoded size is `ASMAP.initialize(16, 16)` in `airsim.js:197`.

## Known performance constraint

Procedural tile textures (zones, congestion, density, icons) are stored as individual GPU textures — one per tile ID. Road display tiles are atlas-backed (`cityTiles_sheet.json`). When a batch re-renders after a tile change, PIXI issues one draw call per unique texture present in that batch. This is the main cost at scale: many tile types in a batch means many GPU state switches per re-render.

## PIXI version

PIXI v4 lacks the automatic batch renderer introduced in v5 (which can batch mixed-texture sprites in one draw call using a unified shader). Upgrading to PIXI v7 is the most compatible path — the Graphics API (`beginFill`/`lineStyle`) still exists in v7 as deprecated aliases. PIXI v8 rewrote the Graphics API entirely and would require rewriting `pse-tile.js`. The interaction plugin and `PIXI.loader` also need updating for v5+.

Upgrading PIXI does not help testability — any PIXI version requires WebGL.

## Alternatives to PIXI considered

**Vanilla Canvas 2D.** The drawing code in `pse-tile.js` (`drawBlock`, `createTexture`) maps directly to Canvas 2D calls (`beginPath`, `moveTo`, `lineTo`, `fill`). Decoupling tile texture generation from PIXI — generating textures via Canvas 2D and handing the resulting bitmap to PIXI — would make generation testable in Node.js via `node-canvas`. The display layer (sprite rendering) would stay in PIXI.

**Konva.js.** Canvas 2D based with a Node.js backend. Solves testability. Full library replacement; architecture differs significantly from PIXI's texture-cache model.

Both alternatives were ruled out for now: the rendering is not the active bottleneck at 16×16 and the refactor cost is high relative to current benefit.

## Known better strategies (for large maps)

**Pack procedural tiles into one atlas.** Generate all tile textures at startup, blit them into a single `RenderTexture`, record UV offsets per tile ID. Every sprite in every batch then references one GPU texture. Per-batch re-render drops to one draw call regardless of how many tile types are present. This is a contained change to `PSETILE.initializeTextureFor` with no architectural change. Sufficient for maps up to ~256×256.

**Separate flat ground from buildings.** The ground layer (zones, roads, terrain) has no height overlap between tiles. A GPU-side tilemap shader — storing tile IDs in a texture, rendering the visible region in one draw call — would replace the entire batch system for ground tiles. Tile changes become `texSubImage2D` updates with no re-render cost. The building layer (RICO display, variable height, z-ordering requirement) keeps the sprite approach. This is the standard isometric city game architecture and the ceiling for large map performance.

## Decision

No rendering change at current map size (16×16). The `cacheAsBitmap` batch system is adequate and the bottleneck is not rendering.

When pushing map size:
1. First: pack procedural tiles into one atlas (contained change, high payoff).
2. If maps reach 512×512+: separate flat ground layer to a GPU tilemap shader.

PIXI upgrade is deferred until a browser compatibility break forces it, or until the atlas approach is implemented (which makes v5+ automatic batching available as a second benefit).

## Constraints that flow from this decision

- Do not add new per-ID procedural textures without considering the atlas approach first.
- `C_MAX_BATCH_COUNT = 300` is unenforced. If batch eviction is ever needed as a hard cap, enforcement must be added to `MMAPBATCH`.
- The flat ground layer and building layer have different rendering requirements. Treat them as separate concerns in any future rendering refactor.
- Isometric z-ordering (painter's algorithm by tile Y) prevents a pure GPU tilemap approach for the building layer.
