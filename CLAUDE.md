# airsim-js

SimCity-style city simulation running in the browser. Rust/WASM owns the authoritative state; JavaScript orchestrates rendering, UI, and game logic on top of it.

## Git workflow

Always work directly on `master`. Do not create feature branches. Commit and push to `master`.

Every commit must use `--author="Alexis He <alexis.yuhe@gmail.com>"` and include a `Co-authored-by: Claude <noreply@anthropic.com>` trailer in the message body. Do not append a session URL to commit messages.

## Running

```bash
python3 server.py   # required — plain file:// breaks WASM loading due to CORS
# open http://localhost:8000
```

`server.py` also writes `version.txt` (git short hash + commit date) to the project root on startup. The file is gitignored and served as a static file by `SimpleHTTPRequestHandler`. The deployed Pages build generates it via a step in `.github/workflows/deploy.yml` before uploading the artifact.

No build step for JS. To rebuild WASM after editing `rust/src/jsentry.rs`:

```bash
cd rust
cargo build --target wasm32-unknown-unknown --release
sh build.sh   # runs wasm-bindgen, overwrites asengine.js and asengine_bg.wasm
```

The compiled `.wasm` and generated `.js` are committed to the repo so the project runs without a Rust toolchain.

## Architecture

### Layers and responsibilities

Three layers. Each layer only calls downward.

**Layer 1 — State (Rust/WASM, `rust/src/jsentry.rs`)**
`ASSTATE` is the only source of truth for all simulation state. It is a flat `Vec<i16>` with no knowledge of the browser, rendering, or JS. `ASROAD` (the Rust portion) lives here too. Nothing in this layer calls JS.

**Layer 2 — Engine (JS modules, `airsim-module.js`)**
`ASZONE`, `ASROAD`, `ASRICO`, `ASWENGINE` implement simulation logic by reading and writing `ASSTATE` through its scalar accessor API. `ASWENGINE` is the sequencer: each tick it calls `ASZONE.update` → `ASROAD.updateRoad` → `ASRICO.updateRico` in that order. These modules have no direct PIXI dependency.

**Layer 3 — Rendering + UI (JS + PIXI, `airsim.js`, `airsim-tile.js`, `pse-tile.js`)**
`MMAPRENDER` owns the camera, hit-testing, and the PIXI render loop. `ASTILE`/`PSETILE` generate tile canvases via Canvas 2D and pack them into a single atlas texture handed to PIXI. `ASMAPUI` renders the toolbar. `MMAPDATA` maintains a JS-side dirty-cell list so only changed tiles are re-queried each frame. This layer never writes simulation state directly — it goes through `PSEENGINE`.

**The bridge — `PSEENGINE` (`pse-engine.js`)**
A JS `Proxy` between layer 3 and layer 2. Intercepts every method call and dispatches it to either a Web Worker (production) or WASM directly on the main thread (debug). The caller is unaware of which path is active. Callbacks are identified by `[moduleName, methodName, arg]` tuples so responses route back to the right JS module.

### Data flow: user click to screen update

```
User taps tile (x, y)
  └─ MMAPRENDER hit-test → grid coords
  └─ ASMAPUI.isZoneMode() → PSEENGINE.setZone(x, y, zoneId)
       └─ Proxy dispatch → [ASWENGINE, setZone, x, y, zoneId]
            └─ ASSTATE.setZoneRequest(index, zoneId)   ← write is deferred

Next tick (ASZONE.updateZone):
  └─ reads ZONE_REQUEST per cell
  └─ calls paintZone(x, y, zone)
       └─ ASSTATE.setZoneId, clearProperties
       └─ ASROAD.addRoad OR ASRICO.addRicoInitial (depending on zone type)
       └─ ASSTATE.notifyChange(index)   ← marks cell dirty

Next frame (ASMAP.retrieveAllDisplayChange):
  └─ PSEENGINE.retrieveAllChangedTileId()
       └─ returns flat [x, y, tileId, x, y, tileId, ...] for all dirty cells
  └─ MMAPDATA.refreshTileResponse(x, y, t) updates JS tile cache
  └─ MMAPRENDER renders changed tiles via PIXI sprites
```

### Initialization order

`ASMAP.initialize(w, h)` in `airsim.js:252` must call these in order — each depends on the previous:

1. `PSEENGINE.initializeModule(w, h)` — creates `ASSTATE` and `ASROAD` Rust structs, initializes `ASZONE` and `ASRICO`
2. `MMAPDATA.initializeMapTableSize(w, h)` — allocates JS tile cache sized to match
3. `MMAPDATA.initialize(tileView)` — populates initial tile view state
4. `ASTILE.initializeTexture()` — creates PIXI textures; **requires `MMAPRENDER` already initialized** to get texture base dimensions
5. `MMAPRENDER.initialize(...)` — sets up camera and PIXI containers
6. `ASMAPUI.initialize()` — creates toolbar sprites; requires PIXI stage to exist

Steps 4 and 5 are ordered counter-intuitively: `MMAPRENDER.initialize` must run before `ASTILE.initializeTexture` because texture creation calls `MMAPRENDER.getTextureBaseSizeX/Y()`. Swapping them produces zero-dimension textures with no error.

### The two execution paths

`PSEENGINE` is a JS `Proxy` that transparently routes engine calls to one of two backends depending on `G_WORKER` in `pse-edit-modules.js`:

- **Worker path** (`G_WORKER = true`): calls are serialised and posted to `pse-worker.js` via `postMessage`. Responses arrive asynchronously and trigger a callback.
- **No-worker path** (`G_WORKER = false`): calls execute synchronously on the main thread against WASM directly.

Any function registered with `EXPORT` must work correctly on both paths. The no-worker path is the easier one to debug. Switching `G_WORKER` to `false` in `pse-edit-modules.js` is the fastest way to get synchronous stack traces.

### Module registration

Every engine module must have `C_NAME` (string) and `EXPORT` (object). `G_MODULE_INT` in `pse-edit-modules.js` is the authoritative registry. Adding a new engine module means adding it there.

### ASSTATE memory layout

`ASSTATE` is a flat `Vec<i16>` in Rust. The layout is:

```
[0 .. ASSTATE_G::END)              global fields (30 slots)
[ASSTATE_G::END .. )               per-cell fields, ASSTATE_C::END (11) slots per cell
```

Cell index is 1-based. Index 0 is invalid and panics on access (`rc`/`wc` check this). `getIndex(x, y)` returns -1 for out-of-bounds coordinates — callers must check before using the result as a cell index.

`getIndex` uses **column-major order**: `index = x * sizeY + y + 1`. Cells with smaller x are processed first by `updateZone`, `updateRoad`, and `updateRico`. A building at (0, y) is always processed before one at (1, y'), regardless of y and y'. This matters for same-tick demand fulfillment: if a supplier has a lower index than its consumer, supply is dispatched and the consumer can level up within the same tick.

The `ASSTATE_C` fields 5–10 are **aliased**: the same slots serve as road traversal fields (`ROAD_CAR_FLOW`, `ROAD_TRAVERSAL_*`) and RICO demand fields (`RICO_DEMAND_OFFER_R/I/C/P`). This works because only one subsystem is active on a given cell at a time (a cell is either a road or a RICO building, not both). If you add a system that needs to coexist with both, you must extend `ASSTATE_C::END` and resize the cell layout.

### Performance constraint: prefer scalar calls over TypedArray returns

Returning a `Box<[i16]>` from Rust is slower than making N individual scalar calls and assembling the array in JS. This was measured and documented in `wasm_notes.txt` during development. The entire Rust API surface follows the scalar pattern as a result. Do not change this without re-benchmarking.

### RICO level system

Each RICO building has a density level (0–5) stored in `ASSTATE_C::RICO_DENSITY_LEVEL`. Level 0 is the initial unpowered state. Levels 1–5 represent growth stages. `POWLOW` is the exception: it has only level 0 and never levels up.

Each zone+level combination has a property row in `C_RICOPROPERTY` (in `airsim-module.js`) with the shape `[level, traffic, R, I, C, P]`. The sign convention: **negative value = offer** (supply dispatched outward); **positive value = demand** (supply must be received from outside). At level 0, all zones have all R/I/C/P slots at 0 except P=1 — every zone requires power to leave level 0.

Resource flow between zone types at level 1+:

| Zone | Offers | Demands |
|---|---|---|
| RESLOW/RESHIG | R (workers) | C (commercial), P (power) |
| INDLOW/INDHIG | I (industrial goods) | R (workers), P (power) |
| COMLOW/COMHIG | C (commercial supply) | R (workers), I (industrial goods), P (power) |
| POWLOW | P (power, −200) | — |

`canLevelUp(index)` returns true when: (1) the next level code exists, (2) `isDemandRicoFilled` — all demand slots ≤ 0, and (3) `isOfferRicoFilled` — all offer slots ≥ 0. Both conditions must hold simultaneously: incoming resources must be fully received and outgoing supply must be fully absorbed.

`canLevelDown(index)` fires when the parent level's demand/offer balance would be unsatisfied at the current state — a building shrinks if it can no longer be supported.

`setInitial(code, index)` is called at the start of each tick for every building (step 0 of `updateRicoTile`). It resets `RICO_DEMAND_OFFER_*` to the property row values for the current level. Demand/offer state therefore does not persist across ticks; it is refilled each tick by traversal.

**All zones require P=1 at level 0.** Changing any zone's level-0 P value to 0 allows it to level up without infrastructure, which is unintended.

### RICO traversal performance

`identifyNextNode` in `ASROAD` previously scanned the road node list linearly — O(R²) per building traversal, superlinear tick scaling. Replaced first with a JS binary min-heap (`m_openHeap`), then with a full Rust Dijkstra loop using `std::collections::BinaryHeap` in `ASROAD.runTraversal`. Pre-migration benchmark: K≈140ms on 16×16, K≈1400ms on 32×32, K≈14000ms on 64×64. See `docs/decisions/004-rico-traversal-performance.md` for full analysis.

`ASROAD.runTraversal(state, fromX, fromY)` runs the complete Dijkstra for one building atomically and returns a flat `Box<[i32]>` of traversed road node indices. `ASROAD.resetTraversal(state)` clears traversal state for all visited nodes. Both are single WASM calls. The JS `updateRicoTile` step 1 calls `runTraversal`, loops over the returned nodes to dispatch offers, then calls `resetTraversal` — no JS↔WASM crossings inside the traversal loop itself.

`RICO_STEP` in `ASSTATE_G` now has two values: 0 (level-up/down check and demand initialisation) and 1 (traversal and dispatch). The previous four-state machine (including per-road-tile interruption) is removed.

### Tick and frame

The simulation runs on ticks. A tick advances when all three subsystems (`updateZone`, `updateRoad`, `updateRico`) have fully processed every cell in the current tick within the time budget. If time runs out mid-tick, `ASSTATE_G::FRAME` increments and processing resumes next frame from where it left off (progress is tracked in `ASSTATE_G::TICK_PROGRESS`). A tick is never skipped; it just spans multiple frames under load.

`tickSpeed = -1` pauses the simulation (zone update returns immediately).

The debug overlay shows per-phase timing as `P(zX/rY/cZ)` — cumulative milliseconds spent in zone, road, and rico updates over the last completed tick. Values accumulate across frames and are snapshotted when the tick advances. Rico updates dominate on non-trivial maps.

### Tile ID namespaces

Tile IDs are integers partitioned by range — different ranges mean different things and must not overlap:

| Range | System |
|---|---|
| 0–99 | Zone IDs (`C_TILE_ZONE`) |
| 100–199 | Road congestion display |
| 200–399 | RICO density display |
| 900–999 | UI icons |
| 1000–1399 | Terrain display |
| 1400–1499 | Road connection display (16 variants, bitmask N/E/S/W) |
| 2100+ | RICO building display (formula: zone×100 + level×10 + variant) |

`C_TILE_DISPLAY_BASE_MODULO = 100` is used to extract the zone from a RICO display ID.

Road display IDs encode the 4-neighbour connection as a bitmask in the name: `NE_W` means connected North, East, West but not South.

## Key invariants

**`setZone` is not immediate.** `ASZONE.setZone(x, y, zone)` writes a zone request into `ASSTATE_C::ZONE_REQUEST`. The request is applied during `updateZone` in the next tick cycle. Never read back the zone immediately after writing it and expect to see the new value.

**`ASSTATE` is replaced on reinit, not reset.** `ASWENGINE.initializeModule()` calls `ASSTATE.new()` and `ASROAD.new()`. These are Rust structs; calling `new()` again creates a second independent instance and discards the old one. `ASMAP.reinitialize(w, h)` intentionally calls `initializeModule` again to replace the engine with a new map — this is the supported path for runtime size changes. Do not call `initializeModule` in any other context.

**`ASMAP.reinitialize` vs `ASMAP.initialize`.** `ASMAP.initialize` is for startup only — it sets up the PIXI renderer, atlas textures, and toolbar UI. `ASMAP.reinitialize(w, h)` is for runtime map replacement — it calls `PSEENGINE.initializeModule`, `MMAPDATA.initializeMapTableSize`, and `MMAPDATA.setTileView`. Never call `ASMAP.initialize` at runtime to resize the map; it will recreate the PIXI renderer and texture atlas, breaking the running session.

**LOAD must extract map size from the serialized array before calling `setSerializable`.** Positions 0 and 1 of the `ASSTATE` flat array are `ASSTATE_G::SIZE_X` and `ASSTATE_G::SIZE_Y`. When loading a saved map, parse the JSON array, read `stateArray[0]` and `stateArray[1]` as `w` and `h`, call `MMAPDATA.initializeMapTableSize(w, h)`, then call `PSEENGINE.setSerializable`. Skipping the resize step leaves `MMAPDATA` sized for the previous map, causing out-of-bounds tile lookups on maps of different sizes.

**Serialization resets road state.** `setSerializable` restores ASSTATE from JSON and then calls `ASROAD.resetInternal()` because road adjacency structures in JS are derived from zone data and must be rebuilt, not stored.

**All `fetch()` calls in JS must use relative paths, not absolute paths.** The site is deployed at `https://krosk.github.io/airsim-js/` (a subdirectory, not the domain root). An absolute path like `/version.txt` resolves to `https://krosk.github.io/version.txt`, which 404s. Use `fetch('version.txt')` (no leading slash). This applies to any resource fetched at runtime: WASM, JSON, text files.

## Testing

WASM artifacts (`rust/asengine.js`, `rust/asengine_bg.wasm`) are gitignored and built by CI. Rebuild them before running tests:

```bash
bash setup.sh   # builds WASM, checks wasm-bindgen-cli version, installs npm deps if absent
npm test        # vitest run — completes in under 500 ms, no browser required
```

Tests live in `test/`. The suite uses **vitest** and **node-canvas** (npm devDependencies).

**`test/tile-generation.test.js`** — loads tile code (`pse-tile.js`, `airsim-tile-const.js`, `airsim-tile.js`) into a Node.js `vm` context with `node-canvas` injected as the canvas factory via `PSETILE.setCanvasFactory`.

| Group | What it covers |
|---|---|
| Pure math | `getColor`, `colorToHex`, RICO display ID arithmetic and uniqueness |
| Canvas drawing | Pixel-level content of map tile canvases via `getImageData` |
| Atlas layout | UV grid positions, fixed dimensions, no overlapping entries |
| Icon tiles | Canvas height = 32, text visibility (colored rows), shape centering |
| Integration | `ASTILE.initializeTexture()` end-to-end with a recording PIXI stub |

**`test/simulation-tick.test.js`** — loads the full engine stack (WASM + `airsim-module.js`) into a Node.js `vm` context and verifies single-tick behavior.

| Group | What it covers |
|---|---|
| Zone request deferred | `setZone` writes request; zone reads as DIRT until tick fires |
| Tick counter | `getTick()` starts at 0, increments by 1 per `ASZONE.update(-1, t)` call |
| Road connectivity | Road-to-road connection sets `ROAD_CONNECT` bitmask; adjacent buildings inherit access |
| RICO traversal | Demand/offer slots non-zero after one tick (traversal ran) |
| Building level-up | Density advances when all demand/offer slots are satisfied; blocked without power source or unmet offer |
| Industry level-up | INDLOW/INDHIG level progression; INDHIG blocked without power; INDLOW blocked without worker supply |

**Not covered:** browser rendering correctness, PIXI WebGL texture upload, actual visual appearance, multi-zone supply chain level-up chains (e.g. RESLOW→INDLOW→COMLOW→RESLOW).

## Known bug

`adaptativeFetch` in `airsim.js:63` calls `reject(error)` inside a `.catch()` that is not inside a `Promise` constructor — `reject` is not in scope and will throw a `ReferenceError` if the fallback XHR also fails. The function is only used for WASM loading, so this only fires on double-failure (both fetch and XHR fail).

## Migration status

The JS-to-WASM migration is in progress. Current state:

| Module | Location |
|---|---|
| `ASSTATE` (grid cell storage) | Rust — complete |
| `ASROAD` (road adjacency, car flow, traversal) | Partially Rust — `hasRoad`, `getRoadMaximumCarFlow`, `runTraversal`, `resetTraversal` migrated; road update loop (`updateRoad`) still JS |
| `ASZONE` (zone management, tick update) | JS |
| `ASRICO` (RCI demand/supply, density levels) | JS |

When migrating a JS function to Rust: remove it from `airsim-module.js`, add the `#[wasm_bindgen]` impl in `jsentry.rs`, rebuild, and verify the no-worker path first before testing the worker path.

**Next migration priority: scalar accessors for `getRicoDemandOffer`/`setRicoDemandOffer`, then single-call tick.** The traversal loop is now in Rust, but `dispatchOffer` still calls `getRicoDemandOffer`/`setRicoDemandOffer` O(R × buildings_per_node) times per tick — each call crosses the WASM boundary and allocates a `Box<[i16]>` on the WASM heap (the documented-slow path from `wasm_notes.txt`). Replacing them with four scalar field accessors (`getRicoDemandOfferR/I/C/P`, `setRicoDemandOfferR/I/C/P`) eliminates per-call allocation and is the next bottleneck to address.

The end goal is a single `tick(...)` WASM call per frame that runs all three phases internally, yielding when its budget is exhausted. This eliminates all JS↔WASM boundary crossings during the tick. Interruptibility shifts to per-building granularity — acceptable given Rust traversal speed. The time budget mechanism inside that single call is an open design question; see `docs/decisions/005-simulation-time-budget.md`.

## Map size

The map is initialized at 16×16 in `StartState()` in `airsim.js:197`. This is the only hardcoded size. `ASSTATE`, `MMAPDATA`, and the batch renderer all accept arbitrary `w`/`h` — the rendering layer has not been tested beyond small maps but the architecture supports it.

`ASZONE.setPreset()` (triggered by the B16/B32/B64 benchmark buttons) fills the grid using a repeating 15-column pattern so the layout tiles correctly at any map size. For each cell `(x, y)`: road at every column/row where `x % 5 == 0` or `y % 5 == 0`; `xMod = x % 15`; RESLOW where `xMod ∈ [1,4]`; COMLOW where `xMod ∈ [6,9]`; POWLOW where `(xMod == 11 || xMod == 12) && y == 1`; INDLOW where `xMod ∈ [11,14]` (excluding POWLOW positions). Two POWLOW tiles per 15-column repeat are required — power demand grows as buildings level up and one tile is insufficient for a fully developed block.

## Rendering architecture

`MMAPBATCH` groups map tiles into 8×8 `PIXI.Container` batches. The project uses PIXI v4.7.0. Static batches set `cacheAsBitmap = true`, collapsing all 64 child sprites into a single draw call. When a tile changes: `cacheAsBitmap = false`, swap the sprite texture, set `cacheAsBitmap = true` — the batch rebuilds its cached texture on the next render. Batches that leave the viewport expire after 60 frames (`C_BATCH_LIFETIME`) and return to a pool. `C_MAX_BATCH_COUNT = 300` is declared in `MMAPBATCH` but never enforced.

Viewport culling is implemented: `getBatchIndexInScreen2()` in `MMAPRENDER` (`airsim.js:2339`) enumerates only on-screen batches using isometric screen-to-tile mapping and `MMAPDATA.isValidCoordinates()`.

**Texture situation.** Road display tiles (16 variants) are atlas-backed via `cityTiles_sheet.json`. All other procedural tiles — zones, congestion, RICO density, RICO display, terrain, icons — are generated at startup by `ASTILE.initializeTexture()` using Canvas 2D drawing and packed into a single atlas texture registered with PIXI. One `PIXI.BaseTexture` covers all procedural tiles; PIXI can batch them automatically. See `docs/decisions/003-tile-rendering.md` for the full rationale.
