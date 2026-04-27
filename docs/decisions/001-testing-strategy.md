# ADR 001 — Testing strategy

## Context

The project has no JS test framework, no test files, and no test step in CI. The one active Rust test (`basics` in `jsentry.rs`) only asserts `rustadd(1,2)==3`. This was investigated to understand what testing is feasible and where to start.

## Constraints discovered

**JS modules are globals, not ES modules.** Every engine module is an IIFE that assigns to a global variable. There is no `import`/`export`. A Node.js test runner cannot `require` them without a module loader shim or `vm.runInContext`.

**WASM dependency.** The engine JS modules (`ASZONE`, `ASROAD`, `ASRICO`) require `ASSTATE` and `ASROADW` to be initialized from WASM before any call is meaningful. Node.js-based testing needs the WASM runtime available and initialized first.

**PIXI dependency.** The rendering layer (`PSETILE`, `ASTILE`, `MMAPBATCH`, `MMAPRENDER`) calls `new PIXI.Graphics()`, `g_app.renderer.generateTexture()`, and `PIXI.utils.TextureCache` throughout. None of it can run without a real or mocked PIXI renderer — mocking it completely is complex.

**Synchronous path exists.** Setting `G_WORKER = false` in `pse-edit-modules.js` makes all PSEENGINE dispatch synchronous and stacktraceable. This is the tractable path for any automated engine test.

## Options considered

**Rust unit tests (native target).** `cargo test` works today without WASM tooling. Tests written in `jsentry.rs` under `#[cfg(test)]` cover `ASSTATE` cell arithmetic, index bounds, the change-notification list, and `ASROAD` utility math. No browser, no WASM runtime needed.

**Browser-based JS tests with Playwright.** A test HTML page loads `asengine.js` and all module scripts (same as `index.html`), sets `G_WORKER = false`, calls `ASWENGINE.initializeModule()`, then runs assertions. Playwright drives this headlessly against `server.py`. Tests the full JS engine stack including WASM.

**Node.js + Jest/Vitest.** Would require converting modules to ES modules or loading globals via `vm.runInContext`, plus a WASM runtime. The ES module conversion is a significant refactor. Not recommended without first doing that refactor.

**Playwright E2E / visual regression.** Automate real user interactions (click tile, advance ticks, assert tile ID changed or screenshot matches baseline). Zero code changes. Slow and fragile on pixel diffs, but covers the full pipeline.

## Decision

Start with Rust unit tests and browser-based Playwright tests in parallel.

- **Rust tests** for `ASSTATE`/`ASROAD` invariants: fastest to write, zero new tooling, covers the most critical correctness surface (memory layout, index arithmetic, change notification).
- **Browser test page + Playwright** for JS engine logic (`ASZONE.update`, zone→road→RICO pipeline): covers the simulation logic that is hardest to reach from Rust and requires no JS refactoring.

Do not invest in Node.js/Jest until the engine modules are converted to ES modules.

## Constraints that flow from this decision

- Tests that exercise JS engine logic must initialize WASM first via `ASWENGINE.initializeModule()`.
- The no-worker path (`G_WORKER = false`) must remain functional. It is the test execution path.
- `airsim-tile-const.js` and the ID arithmetic methods on `ASRICO_DISPLAY_TILE` are dependency-free and can be tested in any environment without WASM or PIXI.
- Rendering is not a unit test target. Visual regression via Playwright screenshots is the only practical coverage for the rendering layer.
