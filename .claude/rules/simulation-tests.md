---
paths:
  - test/
---

# Simulation test rules

**wasm-bindgen cross-realm constraint:** `wasm_bindgen.initSync({ module: bytes })` must be called from inside `runInContext`, not from the host. The host realm's `Object.prototype` differs from the vm realm's — the plain-object argument fails the identity check inside `initSync`. Inject raw bytes as a sandbox property (`_wasmBytes`) and call `initSync` via `runInContext`.

**vm context var constraint for `airsim-module.js`:** The module declarations that must be accessible as sandbox properties use `var`: `ASSTATE`, `ASROADW`, `ASWENGINE`, `ASZONE`, `ASROAD`, `ASRICO`, `ASTILEVIEW`. For tile file constraints, see `.claude/rules/tile-generation.md`.
