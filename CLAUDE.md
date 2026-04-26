# airsim-js

SimCity-style city simulation running in the browser. Rust/WASM owns the authoritative state; JavaScript orchestrates rendering, UI, and game logic on top of it.

## Running

```bash
python3 server.py   # required — plain file:// breaks WASM loading due to CORS
# open http://localhost:8000
```

No build step for JS. To rebuild WASM after editing `rust/src/jsentry.rs`:

```bash
cd rust
cargo build --target wasm32-unknown-unknown --release
sh build.sh   # runs wasm-bindgen, overwrites asengine.js and asengine_bg.wasm
```

The compiled `.wasm` and generated `.js` are committed to the repo so the project runs without a Rust toolchain.

## Architecture

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
