# airsim-js

SimCity-style city simulation running in the browser. Rust/WASM owns the authoritative state; JavaScript orchestrates rendering, UI, and game logic on top of it.

## Running

```bash
python3 server.py   # required — plain file:// breaks WASM loading due to CORS
# open http://localhost:8000
```

No build step for JS. The WASM artifacts (`asengine.js`, `asengine_bg.wasm`) are **not committed** — they are built in CI and must be built locally before `server.py` will work. To build:

```bash
cd rust
cargo build --target wasm32-unknown-unknown --release
sh build.sh   # runs wasm-bindgen, writes asengine.js and asengine_bg.wasm into rust/
```

`build.sh` calls `wasm-bindgen --out-dir . --no-typescript --target no-modules`. The CLI version must exactly match the crate version in `Cargo.lock` or wasm-bindgen aborts with a version mismatch error. Run `cargo update -p wasm-bindgen` before installing the CLI if you are unsure they are in sync.

## Architecture

### Layers and responsibilities

Three layers. Each layer only calls downward.

**Layer 1 — State (Rust/WASM, `rust/src/jsentry.rs`)**
`ASSTATE` is the only source of truth for all simulation state. It is a flat `Vec<i16>` with no knowledge of the browser, rendering, or JS. `ASROAD` (the Rust portion) lives here too. Nothing in this layer calls JS.

**Layer 2 — Engine (JS modules, `airsim-module.js`)**
`ASZONE`, `ASROAD`, `ASRICO`, `ASWENGINE` implement simulation logic by reading and writing `ASSTATE` through its scalar accessor API. `ASWENGINE` is the sequencer: each tick it calls `ASZONE.update` → `ASROAD.updateRoad` → `ASRICO.updateRico` in that order. These modules have no direct PIXI dependency.

**Layer 3 — Rendering + UI (JS + PIXI, `airsim.js`, `airsim-tile.js`, `pse-tile.js`)**
`MMAPRENDER` owns the camera, hit-testing, and the PIXI render loop. `ASTILE`/`PSETILE` create textures. `ASMAPUI` renders the toolbar. `MMAPDATA` maintains a JS-side dirty-cell list so only changed tiles are re-queried each frame. This layer never writes simulation state directly — it goes through `PSEENGINE`.

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

The dispatch message format is `[moduleName, methodName, arg0, arg1, arg2]` — hard-capped at three positional arguments. Adding a fourth argument to an engine function requires updating both the worker dispatcher (`pse-worker.js:43`) and the main-thread fallback in `pse-engine.js:132`.

### Module registration

Every engine module must have `C_NAME` (string) and `EXPORT` (object). Functions listed in `EXPORT` get registered in `G_METHOD_TO_MODULE_TABLE`, which is how the dispatcher resolves a method name to a module when no module name is given. Registering two modules that export a method with the same name silently overwrites the mapping — this has caused bugs before (`614441d`).

`G_MODULE_INT` in `pse-edit-modules.js` is the authoritative registry. Adding a new engine module means adding it there.

### ASSTATE memory layout

`ASSTATE` is a flat `Vec<i16>` in Rust. The layout is:

```
[0 .. ASSTATE_G::END)              global fields (30 slots)
[ASSTATE_G::END .. )               per-cell fields, ASSTATE_C::END (11) slots per cell
```

Cell index is 1-based. Index 0 is invalid and panics on access (`rc`/`wc` check this). `getIndex(x, y)` returns -1 for out-of-bounds coordinates — callers must check before using the result as a cell index.

The `ASSTATE_C` fields 5–10 are **aliased**: the same slots serve as road traversal fields (`ROAD_CAR_FLOW`, `ROAD_TRAVERSAL_*`) and RICO demand fields (`RICO_DEMAND_OFFER_R/I/C/P`). This works because only one subsystem is active on a given cell at a time (a cell is either a road or a RICO building, not both). If you add a system that needs to coexist with both, you must extend `ASSTATE_C::END` and resize the cell layout.

### Performance constraint: prefer scalar calls over TypedArray returns

Returning a `Box<[i16]>` from Rust is slower than making N individual scalar calls and assembling the array in JS. This was measured and documented in `wasm_notes.txt` during development. The entire Rust API surface follows the scalar pattern as a result. Do not change this without re-benchmarking.

### Tick and frame

The simulation runs on ticks. A tick advances when all three subsystems (`updateZone`, `updateRoad`, `updateRico`) have fully processed every cell in the current tick within the time budget. If time runs out mid-tick, `ASSTATE_G::FRAME` increments and processing resumes next frame from where it left off (progress is tracked in `ASSTATE_G::TICK_PROGRESS`). A tick is never skipped; it just spans multiple frames under load.

`tickSpeed = -1` pauses the simulation (zone update returns immediately).

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

## Deployment

The site is deployed to GitHub Pages via `.github/workflows/deploy.yml`. The pipeline builds WASM from source on every push to `master` and uploads the whole repo (plus the freshly generated `asengine.js`/`asengine_bg.wasm`) as a Pages artifact.

**GitHub Pages source must be set to "GitHub Actions".** The legacy "Deploy from branch" mode will not pick up artifacts uploaded by the workflow. This is a one-time repo setting under Settings → Pages. If the site goes blank after a push, check that setting before debugging the workflow.

**wasm-bindgen CLI version must exactly match the crate version.** The workflow pins the crate to `0.2.67` in `Cargo.toml` but immediately runs `cargo update -p wasm-bindgen` so both the crate and the downloaded CLI binary stay on the same latest `0.2.x` release. The version is read from `Cargo.lock` after the update using `awk`, then used to download the matching pre-built musl binary from GitHub Releases. Do not install `wasm-bindgen-cli` with `cargo install` in CI — compiling the 2020-era crate against a modern Rust toolchain fails due to OpenSSL and edition issues. The pre-built musl binary is static and has no system dependencies.

**Cargo build cache key includes `Cargo.lock`.** The `cargo update` step runs before the cache restore, which means the lock file is updated before the key is evaluated — the cache will miss after any `wasm-bindgen` update, which is intentional.

## Key invariants

**`setZone` is not immediate.** `ASZONE.setZone(x, y, zone)` writes a zone request into `ASSTATE_C::ZONE_REQUEST`. The request is applied during `updateZone` in the next tick cycle. Never read back the zone immediately after writing it and expect to see the new value.

**`ASSTATE` is created once.** `ASWENGINE.initializeModule()` calls `ASSTATE.new()` and `ASROAD.new()`. These are Rust structs; calling `new()` again creates a second independent instance and discards the old one. There is no global singleton guard — don't call `initializeModule` more than once.

**Serialization resets road state.** `setSerializable` restores ASSTATE from JSON and then calls `ASROAD.resetInternal()` because road adjacency structures in JS are derived from zone data and must be rebuilt, not stored.

**`MMAPRENDER` must be initialized before `ASTILE.initializeTexture()`.** Tile texture creation now reads texture base dimensions via `MMAPRENDER.getTextureBaseSizeX/Y()` (decoupled in `b31890b`). If render is not initialized first, those calls return undefined and textures are created with zero dimensions silently.

## Known bug

`adaptativeFetch` in `airsim.js:63` calls `reject(error)` inside a `.catch()` that is not inside a `Promise` constructor — `reject` is not in scope and will throw a `ReferenceError` if the fallback XHR also fails. The function is only used for WASM loading, so this only fires on double-failure (both fetch and XHR fail).

## Migration status

The JS-to-WASM migration is in progress. Current state:

| Module | Location |
|---|---|
| `ASSTATE` (grid cell storage) | Rust — complete |
| `ASROAD` (road adjacency, car flow, traversal) | Partially Rust — `hasRoad`, `getRoadMaximumCarFlow`, some utilities migrated; update loop still JS |
| `ASZONE` (zone management, tick update) | JS |
| `ASRICO` (RCI demand/supply, density levels) | JS |

When migrating a JS function to Rust: remove it from `airsim-module.js`, add the `#[wasm_bindgen]` impl in `jsentry.rs`, rebuild, and verify the no-worker path first before testing the worker path.

## Map size

The map is initialized at 16×16 in `StartState()` in `airsim.js:197`. This is hardcoded. `ASSTATE` supports arbitrary sizes (passed to `initialize(w, h)`), but the rendering layer has not been tested beyond small maps.
