---
paths:
  - airsim.js
---

# Toolbar menu rules

Adding a toolbar menu group requires updating five tables in `ASMAPUI`:

- `C_TABLE` — tile ID array for the group
- `C_LEVEL` — depth 0/1/2
- `C_STATEFUL` — alpha feedback on/off
- `C_VISIBLE_BIND` — parent group + active index (null for top-level)
- `C_SPRITE_TOUCH` — touch handler registered in `ASMAPUI.initialize`

Missing any one silently omits the group or breaks its visibility logic.
