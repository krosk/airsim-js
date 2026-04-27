# ADR 001: Testing strategy for tile generation

**Date:** 2026-04-27  
**Status:** Decided

## Context

The codebase is a collection of browser-only IIFE scripts with no build step and no ES module system. The primary testing target is tile generation: color math, isometric drawing, and atlas packing. Options considered:

**Playwright (browser automation)**  
Full browser boot with a WASM-loaded dev server. Covers real PIXI rendering and WebGL texture upload. Approximately 5–10 seconds per run. Requires `python3 server.py` to be running and blocks on WASM initialization before any JS under test executes.

**Rust unit tests**  
Only applicable to the WASM-compiled state layer (`ASSTATE`, `ASROAD`). Cannot reach JS tile generation code.

**Node.js / vitest + node-canvas**  
Loads IIFE files with `vm.runInContext`, injects `node-canvas` as the canvas factory via `PSETILE.setCanvasFactory`. Runs in under 500 ms. PIXI is stubbed — not the real library.

**E2E screenshot comparison**  
Slow and brittle to visual changes that don't affect correctness.

## Decision

Use Node.js / vitest + node-canvas for tile generation tests. Playwright is deferred until there is a specific need to test browser-only behaviour (PIXI WebGL, WASM integration, full initialization sequence).

## Consequences

- Test iteration is fast (< 500 ms), no server needed.
- PIXI API compatibility in `buildAtlas` is tested via a recording stub, not a live PIXI instance. A regression in the `BaseTexture`/`Texture`/`Rectangle` call signatures would not be caught at runtime.
- Visual appearance of tiles and icons is not covered.
- `vm.runInContext` requires top-level module declarations to use `var` (not `let`) for the declared name to become a property of the sandbox and be accessible from test code after loading.
- IIFE files that reference globals set by earlier `runInContext` calls depend on those globals having been declared with `var`.
