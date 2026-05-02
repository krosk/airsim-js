# ADR 005: Simulation time budget architecture

**Date:** 2026-05-02  
**Status:** Direction set; open question on intra-call budget mechanism

## Context

The simulation tick spans multiple frames under load. Frame budget enforcement today is ad-hoc: `Date.now() < timeLimit` checks exist inside `ASRICO.updateRico` and `ASZONE.updateZone`, but not consistently across all phases, and the time limit is only passed to one call per frame. As the simulation grows more complex, this needs to be principled.

Per-phase timing (`P(z/r/c)` in the debug overlay, added alongside this ADR) confirms that Rico updates dominate tick time. This aligns with the O(R log R) traversal cost documented in ADR 004.

The longer-term direction from ADR 004 (Option C) is to move the full Dijkstra traversal into Rust. That migration creates an opportunity to redesign the time budget boundary at the same time: instead of many JS↔WASM calls per frame with budget checks in JS loops, a single `tick(...)` WASM call runs the full tick and yields when its budget is exhausted.

## Options for time-checking inside Rust

Once the tick runs as a single Rust call, Rust needs a way to know when to stop.

### Option 1: `js_sys::performance.now()` import

Rust imports `performance.now()` from the browser and calls it at building-level checkpoints (once per building, not per road step). JS passes a deadline timestamp at call start; Rust compares against it.

- Cost: ~100–500 ns per call (WASM→JS boundary crossing, plus browser Spectre mitigations on `performance.now()`)
- At building granularity on 64×64 (~4000 buildings): ~0.5–2 ms overhead per tick — measurable but not dominant
- At road-step granularity: unacceptable; would negate the gain from moving traversal to Rust
- No deployment constraints

### Option 2: Iteration budget

JS passes a count of buildings to process. Rust iterates exactly that many and returns. No clock access in Rust.

JS side uses `performance.now()` to measure how long the previous `tick(n)` call took and adjusts `n` for the next frame — a simple adaptive controller (e.g. if the last call took 8 ms against a 10 ms budget, scale `n` proportionally).

- Zero WASM→JS boundary crossings inside the tick call
- Less precise under high per-building cost variance (e.g. a tick with many dense buildings vs. sparse ones)
- Adaptive calibration adds JS-side complexity
- No deployment constraints

### Option 3: SharedArrayBuffer flag

A `SharedArrayBuffer` holds a stop flag. JS writes it when the frame budget expires (via a timer or at the top of the next animation frame); Rust reads it via a raw memory pointer at building checkpoints — a single memory load, no boundary crossing.

- Zero cost to read in Rust
- Requires Cross-Origin Isolation: `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` headers
- GitHub Pages does not serve these headers by default — blocked unless the deployment adds custom header configuration
- Requires the worker path (`G_WORKER = true`); the flag is only written by the main thread while WASM runs on the worker thread. On the main thread, JS cannot write while WASM is executing (single-threaded call stack)

## Decision

**Direction: single Rust tick call.** The full tick (zone + road + rico phases) runs as one exported WASM function per frame. Phase sequencing and per-building iteration happen inside Rust. JS calls `tick(...)` once per frame and checks `performance.now()` between calls, not within them. This minimises JS↔WASM boundary crossings and is the prerequisite for any intra-call budget mechanism.

**Immediate change:** Replace `Date.now()` with `performance.now()` throughout the existing JS budget checks. Monotonic and sub-millisecond precision; drop-in change.

**Intra-call budget mechanism: open.** Option 2 (iteration budget) is preferred for its zero boundary-crossing cost and no deployment requirement. Option 1 (`js_sys::performance.now()`) is simpler to implement and acceptable if called at building granularity only. Option 3 is blocked by GitHub Pages header constraints unless COOP/COEP can be configured.

This decision is deferred until Option C (Rust traversal) is complete, since the call boundary does not exist yet.

## Constraints

- The single-Rust-tick design requires Option C from ADR 004 to be implemented first.
- The SharedArrayBuffer approach requires the worker path and COOP/COEP headers — do not implement without resolving the GitHub Pages deployment constraint.
- `performance.now()` imported into Rust must only be called at building granularity (once per building), not per road step. Calling it per road step reintroduces boundary overhead that defeats the purpose of the Rust migration.
- The JS adaptive controller for Option 2 must handle map-size changes (building count changes) by recalibrating `n` rather than reusing a stale value.
