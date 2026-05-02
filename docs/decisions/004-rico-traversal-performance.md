# ADR 004: RICO traversal performance — options analysis

**Date:** 2026-05-02  
**Status:** Under consideration

## Context

`ASRICO.updateRico` processes every building tile once per tick. For each building it runs a Dijkstra traversal over the road network to distribute the building's supply to nearby buildings of complementary type. The traversal is interruptible: the 4-step state machine (`RICO_STEP` in `ASSTATE`) persists mid-traversal progress across frames. The frame budget can interrupt at any road-tile step.

The bottleneck is in `identifyNextNode` (`airsim-module.js:896`), which finds the minimum-cost unvisited node by scanning the entire `m_cacheNodeList` linearly every step. Each scan entry makes ~3 WASM scalar calls (isTraversalAdded, getTraversalCost ×2). This is O(R²) per building traversal where R is the number of road tiles reachable from the building.

Observed tick times (K value in debug overlay) with the benchmark preset:

| Map | Road tiles R | K (ms) |
|-----|---|---|
| 16×16 | ~112 | ~140 |
| 32×32 | ~448 | ~1400 |
| 64×64 | ~1792 | ~14000 |

Scaling is approximately O(N^1.66) where N = total cells — superlinear, driven by the O(R²) per-building cost multiplied by the O(N) building count.

## Options considered

### Option A: JS min-heap

Replace the linear scan in `identifyNextNode` with a binary min-heap maintained in JS. The heap stores `[cost, nodeIndex]` pairs. `expandTraversal` pushes to the heap; `identifyNextNode` pops.

- Reduces scan from O(R²) to O(R log R) per building
- Still makes WASM scalar calls for each `expandTraversal` call (cost, parent, processed state)
- No Rust changes; no rebuild required
- Heap persists across frames alongside `m_cacheNodeList`; `initializeTraversal` and `resetTraversalPath` reset it
- Interruptibility unchanged: frame budget can still cut off mid-traversal at road-tile granularity
- Estimated gain: ~75× fewer operations per building traversal on 32×32 map

### Option B: Rust traversal loop, linear scan

Move the Dijkstra loop into Rust but keep the linear scan for the minimum-cost node.

- Eliminates JS↔WASM boundary overhead for every inner-loop operation (constant-factor improvement)
- All traversal state in `ASSTATE.cells` — direct array indexing, no call overhead
- Still O(R²) algorithmically
- Interruptibility changes: the Rust function runs one building's full traversal atomically; the JS while loop can only interrupt between buildings, not mid-traversal
- `RICO_STEP` field in `ASSTATE` becomes unused
- Requires Rust changes and wasm rebuild

### Option C: Rust traversal loop with min-heap (recommended)

Move the Dijkstra loop into Rust and use `std::collections::BinaryHeap` for the open set.

- Eliminates JS↔WASM boundary overhead (same as Option B)
- Reduces to O(R log R) per building (same as Option A)
- Both gains are multiplicative and independent
- For R=448 (32×32): ~3,900 heap operations vs ~300,000 scan iterations, all in Rust with no call overhead
- Same interruptibility change as Option B: per-building, not per-road-tile
- Per-building granularity is sufficient in practice: with a heap, one building's full traversal on a 64×64 map completes in well under 1ms in Rust
- Aligns with the ongoing JS→Rust migration; `ASRICO` and `ASROAD` traversal logic moves to Rust together

## Decision

Not yet made. Options A and C are not mutually exclusive: Option A can be implemented first as a measurable baseline without a Rust rebuild, then replaced by Option C as part of the ASRICO/ASROAD Rust migration.

## Granularity change (Options B and C)

Currently `updateRicoTile` is a 4-step state machine. Step 2 processes one road tile per call and returns `false` (progress does not advance). The `updateRico` while loop calls it repeatedly, checking `Date.now() < timeLimit` every iteration. This allows the frame budget to interrupt mid-traversal.

With Rust traversal, one WASM call processes all steps for one building atomically. The state machine and `RICO_STEP` are no longer needed. The JS while loop becomes:

```js
while (progress < tableSize && Date.now() < timeLimit) {
    if (ASROAD.runRicoTile(index))   // full traversal in Rust
        progress++;
}
```

Interruption is per-building. This is acceptable because in Rust with a heap, each building's traversal is fast enough that a single call does not meaningfully block the JS thread.

## Performance note: `getRicoDemandOffer` allocations

`getRicoDemandOffer` and `setRicoDemandOffer` return/accept `Box<[i16]>` — the documented-slow path per `wasm_notes.txt`. They are called 4–6 times per building per traversal step (in `getRicoOfferSum`, `canLevelUp`, `canLevelDown`, `dispatchOffer`). Adding scalar getters for the four RICO demand/offer fields (R/I/C/P) eliminates per-call WASM heap allocation. This is a secondary bottleneck, smaller than the O(R²) scan but worth addressing alongside Option C.
