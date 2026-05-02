/**
 * Simulation tick tests.
 *
 * Loads the full engine stack (WASM + airsim-module.js) into a Node.js vm
 * context and verifies single-tick behavior across the three subsystems:
 * ASZONE (zone request application), ASROAD (road connectivity), and
 * ASRICO (demand/offer traversal).
 *
 * Setup: wasm-bindgen --target no-modules output (rust/asengine.js) is
 * initialized synchronously via initSync({ module: wasmBytes }), avoiding
 * the fetch dependency. All engine modules become vm context properties
 * because their top-level declarations use var in airsim-module.js.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// Read files once; WASM bytes are large
const asengineCode = (() => {
    let code = readFileSync(join(root, 'rust/asengine.js'), 'utf8');
    // wasm-bindgen uses `let wasm_bindgen` at module scope; patch to var so
    // it becomes a sandbox property accessible outside the runInContext call.
    return code.replace('let wasm_bindgen', 'var wasm_bindgen');
})();
const wasmBytes = readFileSync(join(root, 'rust/asengine_bg.wasm'));
const tileConstCode = readFileSync(join(root, 'airsim-tile-const.js'), 'utf8');
const moduleCode = readFileSync(join(root, 'airsim-module.js'), 'utf8');

function makeEngineContext() {
    const ctx = createContext({
        console,
        Math,
        WebAssembly,
        TextDecoder,
        TextEncoder,
        Int16Array, Uint16Array, Uint8Array,
        FinalizationRegistry,
        G_WASM_ENGINE: {},
        _wasmBytes: wasmBytes,  // injected so initSync can be called from within ctx
    });
    runInContext(asengineCode, ctx, { filename: 'asengine.js' });
    // initSync must run inside the vm context so Object.prototype identity checks pass
    runInContext('wasm_bindgen.initSync({ module: _wasmBytes }); G_WASM_ENGINE = wasm_bindgen;', ctx);
    runInContext(tileConstCode, ctx, { filename: 'airsim-tile-const.js' });
    runInContext(moduleCode, ctx, { filename: 'airsim-module.js' });
    return ctx;
}

// Run all three subsystems with no time limit — completes the full tick.
function runOneTick(ctx, time = 0) {
    ctx.ASZONE.update(-1, time);
}

function zoneAt(ctx, x, y) {
    return ctx.ASSTATE.getZoneId(ctx.ASSTATE.getIndex(x, y));
}

// ---------------------------------------------------------------------------
// 1. Zone request application
// ---------------------------------------------------------------------------

describe('zone request is deferred', () => {
    let ctx;

    beforeAll(() => {
        ctx = makeEngineContext();
        ctx.ASWENGINE.initializeModule(5, 5);
    });

    it('zone reads as DIRT immediately after setZone (request not yet applied)', () => {
        const C = ctx.ASTILE_ID.C_TILE_ZONE;
        ctx.ASZONE.setZone(2, 2, C.RESLOW);
        expect(zoneAt(ctx, 2, 2)).toBe(C.DIRT);
    });

    it('zone is applied after one tick', () => {
        runOneTick(ctx);
        expect(zoneAt(ctx, 2, 2)).toBe(ctx.ASTILE_ID.C_TILE_ZONE.RESLOW);
    });

    it('cells with no request remain DIRT after the tick', () => {
        const C = ctx.ASTILE_ID.C_TILE_ZONE;
        expect(zoneAt(ctx, 0, 0)).toBe(C.DIRT);
        expect(zoneAt(ctx, 4, 4)).toBe(C.DIRT);
    });
});

// ---------------------------------------------------------------------------
// 2. Tick counter
// ---------------------------------------------------------------------------

describe('tick counter', () => {
    let ctx;

    beforeAll(() => {
        ctx = makeEngineContext();
        ctx.ASWENGINE.initializeModule(3, 3);
    });

    it('starts at 0 after initializeModule', () => {
        expect(ctx.ASSTATE.getTick()).toBe(0);
    });

    it('advances to 1 after one complete update call', () => {
        runOneTick(ctx);
        expect(ctx.ASSTATE.getTick()).toBe(1);
    });

    it('advances to 2 after a second update call', () => {
        runOneTick(ctx, 1);
        expect(ctx.ASSTATE.getTick()).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// 3. Road connectivity
// ---------------------------------------------------------------------------

describe('road connectivity', () => {
    let ctx;

    beforeAll(() => {
        ctx = makeEngineContext();
        ctx.ASWENGINE.initializeModule(5, 5);
        const C = ctx.ASTILE_ID.C_TILE_ZONE;
        // Two adjacent roads at (0,0)-(1,0); building east of road network at (2,0)
        ctx.ASZONE.setZone(0, 0, C.ROAD);
        ctx.ASZONE.setZone(1, 0, C.ROAD);
        ctx.ASZONE.setZone(2, 0, C.RESLOW);
        runOneTick(ctx);
    });

    it('road tile adjacent to another road is marked connected', () => {
        const idx = ctx.ASSTATE.getIndex(0, 0);
        expect(ctx.ASSTATE.getRoadConnected(idx)).toBe(true);
    });

    it('building adjacent to road is marked connected', () => {
        const idx = ctx.ASSTATE.getIndex(2, 0);
        expect(ctx.ASSTATE.getRoadConnected(idx)).toBe(true);
    });

    it('building with no adjacent road is not connected', () => {
        const C = ctx.ASTILE_ID.C_TILE_ZONE;
        ctx.ASZONE.setZone(4, 4, C.RESLOW);
        runOneTick(ctx, 1);
        const idx = ctx.ASSTATE.getIndex(4, 4);
        expect(ctx.ASSTATE.getRoadConnected(idx)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 4. RICO initial state and traversal
// ---------------------------------------------------------------------------

describe('RICO traversal', () => {
    let ctx;

    beforeAll(() => {
        ctx = makeEngineContext();
        ctx.ASWENGINE.initializeModule(5, 5);
        const C = ctx.ASTILE_ID.C_TILE_ZONE;
        // Road at (0,0) connects RESLOW at (1,0) and COMLOW at (0,1)
        ctx.ASZONE.setZone(0, 0, C.ROAD);
        ctx.ASZONE.setZone(1, 0, C.RESLOW);
        ctx.ASZONE.setZone(0, 1, C.COMLOW);
        runOneTick(ctx);
    });

    it('RESLOW starts at density 0', () => {
        const idx = ctx.ASSTATE.getIndex(1, 0);
        expect(ctx.ASSTATE.getRicoDensity(idx)).toBe(0);
    });

    it('COMLOW starts at density 0', () => {
        const idx = ctx.ASSTATE.getIndex(0, 1);
        expect(ctx.ASSTATE.getRicoDensity(idx)).toBe(0);
    });

    it('demand/offer is non-zero after traversal (supply was dispatched)', () => {
        // RESLOW offers residential supply; the traversal should have
        // dispatched at least some of it to COMLOW (which demands R).
        // If all slots are still 0, the traversal did not run.
        const reslowIdx = ctx.ASSTATE.getIndex(1, 0);
        const offer = ctx.ASSTATE.getRicoDemandOffer(reslowIdx);
        const allZero = Array.from(offer).every(v => v === 0);
        expect(allZero).toBe(false);
    });
});
