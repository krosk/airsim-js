---
paths:
  - airsim-module.js
  - pse-engine.js
  - pse-worker.js
  - pse-edit-modules.js
---

# Engine module rules

Every engine module must have `C_NAME` (string) and `EXPORT` (object). Functions listed in `EXPORT` are registered in `G_METHOD_TO_MODULE_TABLE`. Two modules exporting the same method name silently overwrite each other — verify no name collisions before adding exports.

`G_MODULE_INT` in `pse-edit-modules.js` is the authoritative registry. Every new engine module must be added there.

The dispatch message format is `[moduleName, methodName, arg0, arg1, arg2]` — hard-capped at three positional arguments. Adding a fourth argument requires updating both `pse-worker.js:43` (worker dispatcher) and `pse-engine.js:132` (main-thread fallback). Both files must be updated together.

Top-level module declarations in `airsim-module.js` that must be accessible as vm context properties use `var`, not `let`: `ASSTATE`, `ASROADW`, `ASWENGINE`, `ASZONE`, `ASROAD`, `ASRICO`, `ASTILEVIEW`. Do not change these to `let`.
