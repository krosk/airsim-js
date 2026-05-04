# ADR 006 — Parallel RICO Dispatch with Acceptance Ratio Throttling

## Status

In progress — Phase 0 complete (commit 9c17084).

## Context

The current RICO dispatch model is a **sequential greedy allocation**. Each building runs a full Dijkstra traversal and calls `dispatchOffer` per road node. `dispatchOffer` directly reads and writes the target building's `RICO_DEMAND_OFFER_*` slots in ASSTATE — offer depletes as buildings are filled, and the next road node sees the remaining capacity.

This model has two valuable emergent properties:
- **Spatial locality**: Dijkstra expands nodes in cost order (distance + congestion), so closer buildings get supply first.
- **Congestion feedback**: Successful deliveries add congestion to the delivery path, raising cost for subsequent ticks and routing supply around saturated routes.

However, it cannot scale to large maps or benefit from parallelism because **offer depletion is the scarcity mechanism**. Two buildings dispatching simultaneously would each read the same initial demand values from the same consumers, independently compute fills, and double-fill those consumers while over-depleting their own offers. This is not a fixable artifact — it requires changing the allocation model.

The write-write hazard is specifically in `dispatchOffer` at `airsim-module.js:1373`:
```javascript
ASSTATE.setRicoDemandOffer(demandIndex, demand);  // writes to target building
```

## Decision

Replace sequential greedy dispatch with an **acceptance ratio throttle model** that:
1. Keeps offer depletion (supply is still finite, scarcity is still spatial)
2. Makes the scatter phase parallel-safe (each building reads target state as read-only, writes only to its own accumulator)
3. Converges to correct allocation over multiple ticks via per-building throttle state
4. Preserves spatial locality and congestion feedback (Dijkstra traversal is unchanged)

## New Model Design

### Core idea

Each building tracks `max_received[R/I/C/P]` — the total received from all suppliers last tick. At dispatch time, a supplier offers only a fraction of a target's demand:

```
to_give[j] = min(offer_remaining[j], demand[target][j] * offer_incoming[j] / max_received[target][j])
```

When a building receives more than its demand, `max_received` stays high, throttling future deliveries and allowing remaining offer to travel further to undersupplied buildings. When a building receives exactly its demand, `max_received` freezes. When undersupplied, `max_received` resets to demand value (accepts everything).

### Scatter phase (parallel-safe)

Each building:
1. Reads its own `offer` (not shared)
2. Reads `demand[target]` and `max_received[target]` as **read-only** (previous tick values)
3. Computes `to_give`, depletes `offer_remaining`
4. Adds `to_give` to `total_received[target]` accumulator

No write-write hazard: each building writes only to `total_received[target]`, which is an additive accumulator. Multiple suppliers writing to the same target is a simple integer add (atomic in multi-threaded context).

### Gather phase (per-building, parallel-safe)

Each building:
1. Reads its own `total_received[j]`
2. Updates demand slot: `demand[j] -= total_received[j]` (capped at 0)
3. Updates `max_received[j]` by rule:
   - `total_received[j] > demand_property[j]` → `max_received[j] = total_received[j]` (throttle)
   - `total_received[j] == demand_property[j]` → `max_received[j]` unchanged (freeze, stable)
   - `total_received[j] < demand_property[j]` → `max_received[j] = demand_property[j]` (reset, accept all)

The "freeze when balanced" rule is required for convergence. Without it, two suppliers each filling a building to exactly demand would reset `max_received` to demand value, causing overfill again next tick — an oscillation that never settles.

### Why supply is still finite

Offer depletes during Dijkstra traversal exactly as in the current model. `offer_remaining[j]` is reduced by `to_give[j]` at each road node. When `offer_remaining[j]` reaches 0, subsequent buildings receive nothing for that slot. The throttle reduces how much is absorbed at each stop, allowing more offer to travel further — but the total dispatched is still bounded by the initial offer value.

### Level-up hysteresis

Because allocation converges over multiple ticks (not single-tick as in current model), level-up and level-down must not trigger on a single tick's state. Add a `RICO_LEVEL_STREAK` counter per building:
- Each tick where all demand slots ≤ 0: increment counter
- Each tick where any demand slot > 0: decrement counter (or reset)
- Level-up when counter reaches `+THRESHOLD_UP` (e.g. 3)
- Level-down when counter reaches `-THRESHOLD_DOWN` (e.g. 5, more forgiving)

Constants `THRESHOLD_UP` and `THRESHOLD_DOWN` are to be calibrated empirically against the B16/B32/B64 preset benchmark maps.

### Why double-buffering is not the solution

A double-buffer scheme (scatter reads from Buffer 1, writes fills to Buffer 2) does not work because it breaks offer depletion accounting. Two suppliers reading the same Buffer 1 demand values would each independently fill the same consumers, over-filling those consumers and over-depleting their own offers. The acceptance ratio model avoids this by keeping depletion intact and using `max_received` as the inter-tick signal.

### Parallelism status

- **Scatter phase**: embarrassingly parallel across buildings. Currently sequential (WASM single-threaded). Architecture is parallel-ready.
- **Gather phase**: parallel across buildings (each building writes only to its own state).
- **Actual parallelism**: currently blocked on GitHub Pages (see Phase 6). The scatter-gather architecture is parallel-ready; no further code changes are needed once the hosting constraint is resolved.

### SIMD

The 4-slot R/I/C/P inner operation per building interaction remains SIMD-friendly:
```
to_give[0..4] = min(offer[0..4], demand[target][0..4] * offer[0..4] / max_received[target][0..4])
total_received[target][0..4] += to_give[0..4]
offer[0..4] -= to_give[0..4]
```
This is an `i16x4` multiply-divide-add. Intermediate `demand * offer` may exceed i16 range — use i32 intermediates before dividing. Migrate to Rust WASM SIMD in Phase 5 (optional).

## Implementation Phases

### Phase 0 — Prerequisites ✓ complete (commit 9c17084)

**Goal:** Scalar RICO demand/offer accessors replacing `Box<[i16]>` API.

`getRicoDemandOfferR/I/C/P` and `setRicoDemandOfferR/I/C/P` added to `rust/src/jsentry.rs`. All call sites in `airsim-module.js` (`setInitial`, `getRicoOfferSum`, `canLevelUp`, `canLevelDown`, `dispatchOffer`, `getInfoRico`) and `test/simulation-tick.test.js` updated. No `getRicoDemandOffer`/`setRicoDemandOffer` calls remain.

---

### Phase 1 — Scale property values

**Goal:** Multiply all demand/offer values in `C_RICOPROPERTY` by a scale factor so that `max_received / demand_property` has meaningful integer resolution.

**Why:** With demand P=1, any ratio less than 1.0 rounds to 0 in integer arithmetic — the throttle collapses to binary (accept or reject entirely). Scaling to P=100 gives 100 meaningful throttle steps.

**Scale factor:** ×100. Verify all scaled values fit in i16 (max 32767):
- Largest demand: COMLOW demands R, I, P → max 300 each after ×100 ✓
- Largest offer: POWLOW P=−200 → −20000 after ×100 ✓
- POWLOW serving 200 buildings × 100 = 20000 total dispatched ✓

**Files to change:**
- `airsim-module.js`: `C_RICOPROPERTY` table — multiply all non-zero R/I/C/P values by 100

**Verify:** B16 preset still reaches level 5 buildings (may take more ticks due to integer rounding — acceptable).

---

### Phase 2 — Extend ASSTATE_C layout

**Goal:** Add new per-cell fields for `max_received`, `total_received`, and `level_streak`.

**New fields (add to `ASSTATE_C` enum in `rust/src/jsentry.rs`):**

| Field | Slots | Notes |
|---|---|---|
| `RICO_MAX_RECEIVED_R` | 1 | Persists across ticks |
| `RICO_MAX_RECEIVED_I` | 1 | Persists across ticks |
| `RICO_MAX_RECEIVED_C` | 1 | Persists across ticks |
| `RICO_MAX_RECEIVED_P` | 1 | Persists across ticks |
| `RICO_TOTAL_RECEIVED_R` | 1 | Reset each tick by `setInitial` |
| `RICO_TOTAL_RECEIVED_I` | 1 | Reset each tick by `setInitial` |
| `RICO_TOTAL_RECEIVED_C` | 1 | Reset each tick by `setInitial` |
| `RICO_TOTAL_RECEIVED_P` | 1 | Reset each tick by `setInitial` |
| `RICO_LEVEL_STREAK` | 1 | +N = up streak, −N = down streak |

`ASSTATE_C::END` increases by 9.

**Initialization:**
- `RICO_MAX_RECEIVED_*`: initialize to property demand value so first tick does not throttle (ratio = demand/demand = 1.0)
- `RICO_TOTAL_RECEIVED_*`: initialize to 0
- `RICO_LEVEL_STREAK`: initialize to 0

**Add scalar accessors in `rust/src/jsentry.rs`** for all 9 new fields (same pattern as existing RICO accessors).

**Note on aliased fields:** Fields 5–10 are aliased between road traversal and RICO demand. The new fields start at current `ASSTATE_C::END` (11) and are RICO-only — no aliasing.

**ASSTATE size impact:** 9 extra i16 per cell. At 64×64 = 4096 cells: 9 × 4096 × 2 bytes = ~74 KB additional. Acceptable.

---

### Phase 3 — Refactor dispatch (sequential, correctness first)

**Goal:** Split the current interleaved read-modify-write in `dispatchOffer` into a separate scatter phase and gather phase. Validate correctness before any parallelism.

#### 3a — Modify `dispatchOffer` (scatter)

**Current behavior** (`airsim-module.js:1345`):
- Reads `demand[target]`, modifies it in place, writes back immediately.

**New behavior:**
- Reads `demand[target]` and `max_received[target]` (read-only, both from previous tick)
- Computes `to_give[j] = min(offer_remaining[j], demand[target][j] * offer[j] / max_received[target][j])`
- Adds `to_give[j]` to `RICO_TOTAL_RECEIVED_*[target]`
- Depletes `offer_remaining[j] -= to_give[j]` as before
- Does NOT write to `RICO_DEMAND_OFFER_*[target]`

**Integer division note:** `demand[target][j] * offer[j] / max_received[target][j]` — ensure intermediate product uses i32 to avoid overflow before dividing back to i16.

**Guard:** If `max_received[target][j] == 0` (building was never reached before), treat as `max_received = demand_property[j]` (accept everything).

#### 3b — Add gather pass

After all buildings have completed step 1 (scatter), run gather for each building:

```
for each building index:
    for j in [R, I, C, P]:
        received = ASSTATE.getRicoTotalReceived_j(index)
        demand_property = property_row[level][j]
        
        // Update demand slot
        ASSTATE.setRicoDemandOffer_j(index, demand_property - received)  // capped: if received > demand, set to 0
        
        // Update max_received by rule
        if received > demand_property:
            ASSTATE.setRicoMaxReceived_j(index, received)      // throttle
        elif received == demand_property:
            // leave max_received unchanged                     // freeze (stable)
        else:
            ASSTATE.setRicoMaxReceived_j(index, demand_property)  // reset (accept all)
```

**Where in the tick sequence:** Gather runs after all buildings have completed step 1 and before step 0 of the next tick. In the current `RICO_STEP` two-state machine: add a third state, or run gather as a second pass within state 1.

**Option:** Extend `RICO_STEP` to 3 values:
- 0: level-up/down check, `setInitial`, reset `RICO_TOTAL_RECEIVED_*` to 0
- 1: scatter (`dispatchOffer` writing to `total_received`)
- 2: gather (update demand and `max_received` from `total_received`)

#### 3c — Modify level-up/down logic

In step 0, replace immediate `canLevelUp`/`canLevelDown` → level change with streak counter logic:

```
if canLevelUp(index):
    streak = ASSTATE.getRicoLevelStreak(index)
    if streak < THRESHOLD_UP:
        ASSTATE.setRicoLevelStreak(index, streak + 1)
    else:
        levelUp(index)
        ASSTATE.setRicoLevelStreak(index, 0)
elif canLevelDown(index):
    streak = ASSTATE.getRicoLevelStreak(index)
    if streak > -THRESHOLD_DOWN:
        ASSTATE.setRicoLevelStreak(index, streak - 1)
    else:
        levelDown(index)
        ASSTATE.setRicoLevelStreak(index, 0)
else:
    ASSTATE.setRicoLevelStreak(index, 0)  // reset on mixed conditions
```

Start with `THRESHOLD_UP = 3`, `THRESHOLD_DOWN = 5`. Tune against B16 preset.

---

### Phase 4 — Tests and calibration

**Existing tests** (`test/simulation-tick.test.js`) must pass:
- Zone request deferred
- Tick counter
- Road connectivity
- RICO traversal (demand/offer slots non-zero after one tick)
- Building level-up (may need tick count increased due to multi-tick convergence)
- Industry level-up

**New tests to add:**
- Overfill convergence: two POWLOWs serving one RESLOW converge to `max_received = 200` (×100 scale), each contributing 100 per tick
- Throttle propagation: near-saturated buildings have reduced acceptance, offer reaches further buildings
- Level-up streak: building does not level up on tick 1 of satisfaction, levels up after `THRESHOLD_UP` consecutive satisfied ticks
- Level-down streak: building does not level down on tick 1 of unsatisfied condition
- Road removal: buildings go unsatisfied, streak goes negative, level down after threshold

**Calibration:** Run B16/B32/B64 presets and compare convergence time (ticks to full level-5 development) against current model. Document results.

---

### Phase 5 — SIMD intra-building (optional)

**Goal:** Vectorize the 4-slot inner loop in the scatter phase using WASM SIMD.

**Prerequisite:** Phase 3 complete and tested.

**Approach:**
- Enable `wasm32` SIMD feature in `rust/Cargo.toml`
- Implement scatter inner loop using `std::arch::wasm32` SIMD intrinsics (`i32x4` for intermediate multiply to avoid overflow, then truncate to i16)
- Benchmark against scalar baseline

**Files to change:**
- `rust/src/jsentry.rs`: SIMD implementation of scatter inner loop
- `rust/Cargo.toml`: SIMD target feature

---

### Phase 6 — Cross-building parallelism (future)

**Prerequisite:** `crossOriginIsolated = true` in the browser, which requires COOP/COEP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`). Without these, browsers block `postMessage` of shared `WebAssembly.Memory` to Workers (throws `DataCloneError` on Chrome 92+), making WASM threads impossible regardless of whether `SharedArrayBuffer` is constructible.

**GitHub Pages workaround:** GitHub Pages does not serve COOP/COEP headers and cannot be configured to do so. However, a ServiceWorker can inject them on every response. `coi-serviceworker` (https://github.com/gzuidhof/coi-serviceworker) is the established one-script-tag solution used by projects such as SQLite WASM on GitHub Pages. Adding it to `index.html` sets `crossOriginIsolated = true`, restores `globalThis.SharedArrayBuffer`, and enables WASM threads with full `Atomics.wait`/`notify` support.

**Note on `WebReflection/shared-array-buffer`:** This library recovers the `SharedArrayBuffer` constructor via `new WebAssembly.Memory({shared:true}).buffer.constructor` in non-isolated contexts. It does not inject headers, does not set `crossOriginIsolated`, and does not unblock `postMessage` of shared memory to Workers. It is not a solution for WASM threads.

**Simulation code changes needed (once isolated):**
- Enable WASM threads: add `atomics` and `bulk-memory` target features in `rust/Cargo.toml`
- Scatter loop: replace sequential building iteration with parallel dispatch using atomic `fetch_add` on `RICO_TOTAL_RECEIVED_*[target]`
- Gather loop: can run in parallel (each building writes only its own state)

**No scatter-gather architecture changes needed** — the Phase 3 design is already parallel-safe.

---

## Key invariants introduced by this change

- `RICO_TOTAL_RECEIVED_*` is always 0 at the start of step 0 (reset by `setInitial`)
- `RICO_MAX_RECEIVED_*` is always ≥ `demand_property[j]` (reset rule prevents going below)
- Level-up only occurs after `RICO_LEVEL_STREAK` reaches `+THRESHOLD_UP`
- Level-down only occurs after `RICO_LEVEL_STREAK` reaches `-THRESHOLD_DOWN`
- `dispatchOffer` never writes to `RICO_DEMAND_OFFER_*` of the target building (gather phase owns those writes)
- `demand_property[j]` from `C_RICOPROPERTY` is the reference value for ratio computation — not the live demand slot, which may be mid-tick

## Files affected

| File | Change |
|---|---|
| `rust/src/jsentry.rs` | Add 9 new ASSTATE_C fields, scalar accessors for all new fields, extend `ASSTATE_C::END` |
| `airsim-module.js` | Scale `C_RICOPROPERTY`, replace `getRicoDemandOffer`/`setRicoDemandOffer` with scalar calls, refactor `dispatchOffer` scatter, add gather pass, add `RICO_STEP` state 2, modify level-up/down to use streak counter |
| `test/simulation-tick.test.js` | Update tick counts for multi-tick convergence, add new test groups |
| `CLAUDE.md` | Update RICO dispatch model section, RICO level system section, migration status |

## Open questions

1. **`THRESHOLD_UP` / `THRESHOLD_DOWN`**: Need empirical calibration. Start at 3/5.
2. **Integer division precision for small demand values**: Even at ×100 scale, `100 * incoming / max_received` may round poorly when `max_received` is large. Consider rounding to nearest instead of floor.
3. **Serialization**: `RICO_MAX_RECEIVED_*` persists across ticks and should be included in `setSerializable`/`getSerializable`. `RICO_TOTAL_RECEIVED_*` and `RICO_LEVEL_STREAK` can reset on load.
4. **Backward compatibility of save files**: Extending `ASSTATE_C::END` changes the flat array layout. Saves from before Phase 2 will fail to load. Version the save format or add a migration path.
