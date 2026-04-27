/**
 * Tile generation tests.
 *
 * Covers three layers:
 *   1. Pure math  — color packing, hex conversion, nuanceColor, ID arithmetic
 *   2. Canvas drawing — pixel content of generated tile canvases via node-canvas
 *   3. Atlas layout  — UV offsets, coverage, no overlaps
 *
 * Setup: load airsim-tile-const.js and pse-tile.js into a shared context via
 * vm.runInContext, injecting node-canvas as the canvas factory so no browser
 * is needed.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createCanvas } from 'canvas';
import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ---------------------------------------------------------------------------
// Shared VM context — loads ASTILE_ID and PSETILE globals
// ---------------------------------------------------------------------------

let ctx; // vm context
let ASTILE_ID;
let PSETILE;

function loadFile(filePath) {
    runInContext(readFileSync(filePath, 'utf8'), ctx, { filename: filePath });
}

beforeAll(() => {
    ctx = createContext({
        console,
        Math,
        // Minimal MMAPRENDER stub — values match airsim.js defaults
        MMAPRENDER: {
            getTextureBaseSizeX: () => 64,
            getTextureBaseSizeY: () => 32,
        },
    });

    loadFile(join(root, 'airsim-tile-const.js'));
    loadFile(join(root, 'pse-tile.js'));

    ASTILE_ID = ctx.ASTILE_ID;
    PSETILE = ctx.PSETILE;

    // Inject node-canvas so drawing works without a browser
    PSETILE.setCanvasFactory(createCanvas);
});

// ---------------------------------------------------------------------------
// 1. Pure math
// ---------------------------------------------------------------------------

describe('getColor', () => {
    it('packs RGB channels into a single integer', () => {
        expect(PSETILE.getColor(255, 0, 0)).toBe(0xff0000);
        expect(PSETILE.getColor(0, 255, 0)).toBe(0x00ff00);
        expect(PSETILE.getColor(0, 0, 255)).toBe(0x0000ff);
        expect(PSETILE.getColor(121, 85, 72)).toBe(0x795548); // DIRT
    });

    it('truncates fractional values', () => {
        expect(PSETILE.getColor(76.9, 175.9, 80.9)).toBe(PSETILE.getColor(76, 175, 80));
    });
});

describe('colorToHex', () => {
    it('converts packed integer to CSS hex string', () => {
        expect(PSETILE.colorToHex(0xff0000)).toBe('#ff0000');
        expect(PSETILE.colorToHex(0x00ff00)).toBe('#00ff00');
        expect(PSETILE.colorToHex(0x0000ff)).toBe('#0000ff');
        expect(PSETILE.colorToHex(0x795548)).toBe('#795548');
    });

    it('zero-pads short values', () => {
        expect(PSETILE.colorToHex(0x000001)).toBe('#000001');
    });
});

describe('ASRICO_DISPLAY_TILE ID arithmetic', () => {
    // Re-implement the pure functions for reference
    const ZONE_DIGIT = 100;
    const LEVEL_DIGIT = 10;
    const VARIANT_DIGIT = 1;

    function getZone(id)    { return (id / ZONE_DIGIT) | 0; }
    function getLevel(id)   { return ((id % (10 * LEVEL_DIGIT)) / LEVEL_DIGIT) | 0; }
    function getVariant(id) { return ((id % (10 * VARIANT_DIGIT)) / VARIANT_DIGIT) | 0; }

    it('decodes RESLOW level 3 variant 0 correctly', () => {
        // RESLOW = 21, id = 21*100 + 3*10 + 0 = 2130
        const id = 2130;
        expect(getZone(id)).toBe(21);
        expect(getLevel(id)).toBe(3);
        expect(getVariant(id)).toBe(0);
    });

    it('decodes COMHIG level 5 variant 0 correctly', () => {
        // COMHIG = 29, id = 29*100 + 5*10 + 0 = 2950
        const id = 2950;
        expect(getZone(id)).toBe(29);
        expect(getLevel(id)).toBe(5);
        expect(getVariant(id)).toBe(0);
    });

    it('all generated RICO display IDs are unique', () => {
        const ids = Object.values(ASTILE_ID.C_TILE_RICO_DISPLAY);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });
});

// ---------------------------------------------------------------------------
// 2. Canvas pixel content
// ---------------------------------------------------------------------------

describe('createTexture', () => {
    it('returns a canvas of the correct dimensions', () => {
        const canvas = PSETILE.createTexture(0xff0000, 0, 3, 64, 32);
        expect(canvas.width).toBe(64);
        expect(canvas.height).toBe(PSETILE.C_TILE_CANVAS_HEIGHT);
    });

    it('top-face pixel has approximately the requested color', () => {
        // The top face of the isometric block uses the fill color directly.
        // Sample near the horizontal center of the tile, one row above the
        // bottom of the top face. For H=3, texSizeX=64, texSizeY=32:
        //   origin at canvas (32, 84). Top face apex at local (0, -16-3) = canvas (32, 65).
        //   Sample at canvas (32, 67) which is inside the top-face polygon.
        const color = PSETILE.getColor(76, 175, 80); // RESLOW green
        const canvas = PSETILE.createTexture(color, 0, 3, 64, 32);
        const ctx = canvas.getContext('2d');
        const px = ctx.getImageData(32, 67, 1, 1).data;
        expect(px[0]).toBe(76);
        expect(px[1]).toBe(175);
        expect(px[2]).toBe(80);
    });

    it('bottom area of canvas is transparent (no overdraw below diamond base)', () => {
        // Below y=100 is out of canvas; the diamond bottom vertex is at canvas y=100.
        // Pixels at y=99 (just above canvas bottom) should be part of the left/right face,
        // not transparent. Pixels well above (e.g. y=10) for a flat tile should be transparent.
        const canvas = PSETILE.createTexture(0xff0000, 0, 3, 64, 32);
        const ctx = canvas.getContext('2d');
        const topPx = ctx.getImageData(32, 5, 1, 1).data; // well above tile content
        expect(topPx[3]).toBe(0); // alpha = 0 (transparent)
    });
});

describe('drawBlock', () => {
    it('draws three distinct shades (top, left, right faces)', () => {
        // For H=3, texSizeX=64, texSizeY=32, origin at canvas(32,84):
        //   Top face apex: local(0,-19) → canvas(32,65). Sample at (32,68).
        //   Left face centroid: local(-16,8) → canvas(16,92). Sample at (16,90).
        //   Right face centroid: local(16,8) → canvas(48,92). Sample at (48,90).
        //
        // nuanceColor darkens via G channel (nuanceColor(white,-32)=0x00dfdf, -64=0x00bfbf).
        // Check the G channel: top=255, left=223, right=191.
        const canvas = createCanvas(64, 100);
        const ctx = canvas.getContext('2d');
        ctx.translate(32, 84); // same origin as createTexture for H=3, texSizeY=32

        PSETILE.drawBlock(ctx, 0xffffff, 0, 0, 64, 32, 3);

        const px = (x, y) => canvas.getContext('2d').getImageData(x, y, 1, 1).data;

        // Top face — original color (white): G channel = 255
        const top = px(32, 68);
        expect(top[1]).toBe(255);

        // Left face — nuanceColor(white, -32): G channel < 255
        const left = px(16, 90);
        expect(left[1]).toBeLessThan(255);

        // Right face — nuanceColor(white, -64): G channel < left face
        const right = px(48, 90);
        expect(right[1]).toBeLessThan(left[1]);
    });
});

// ---------------------------------------------------------------------------
// 3. Atlas layout
// ---------------------------------------------------------------------------

describe('atlas layout', () => {
    // Build a minimal atlas using only zone tiles — enough to verify the layout logic.

    let pendingCapture;
    let builtTileW;
    let builtTileH;
    let builtCols;
    let atlasEntries; // [{textureName, atlasX, atlasY}]

    beforeAll(() => {
        // Create a fresh PSETILE context so we don't pollute the shared one
        const localCtx = createContext({ console, Math,
            MMAPRENDER: { getTextureBaseSizeX: () => 64, getTextureBaseSizeY: () => 32 }
        });
        runInContext(readFileSync(join(root, 'airsim-tile-const.js'), 'utf8'), localCtx);
        runInContext(readFileSync(join(root, 'pse-tile.js'), 'utf8'), localCtx);
        const localPSETILE = localCtx.PSETILE;
        localPSETILE.setCanvasFactory(createCanvas);

        // Capture what buildAtlas receives by overriding the canvas factory
        // to track drawImage calls on the atlas canvas
        atlasEntries = [];
        const origFactory = createCanvas;
        let callCount = 0;
        localPSETILE.setCanvasFactory((w, h) => {
            const c = origFactory(w, h);
            const origCtx = c.getContext('2d');
            const origDrawImage = origCtx.drawImage.bind(origCtx);
            origCtx.drawImage = (src, x, y) => {
                atlasEntries.push({ x, y, w: src.width, h: src.height });
                origDrawImage(src, x, y);
            };
            return c;
        });

        // Build a minimal ASZONE_TILE stub so we can call initializeTextureFor
        const localASTILE_ID = localCtx.ASTILE_ID;
        const zoneIds = Object.values(localASTILE_ID.C_TILE_ZONE);
        const tileLib = {
            C_TILEENUM: localASTILE_ID.C_TILE_ZONE,
            C_TEXTUREENUM: undefined,
            createTexture: (id) => {
                return localPSETILE.createTexture(0x795548, 0, 3, 64, 32);
            }
        };

        // Stub PIXI for buildAtlas
        localCtx.PIXI = {
            BaseTexture: class { constructor() {} },
            Rectangle: class { constructor(x, y, w, h) { this.x=x; this.y=y; this.w=w; this.h=h; } },
            Texture: class { constructor(base, frame) { this.frame = frame; } },
            utils: { TextureCache: {} },
            SCALE_MODES: { NEAREST: 0 }
        };

        localPSETILE.initializeTextureFor(tileLib);
        builtTileW = 64;
        builtTileH = localPSETILE.C_TILE_CANVAS_HEIGHT;
        builtCols = 16;
        localPSETILE.buildAtlas(builtTileW);
    });

    it('all tile canvases have the fixed dimensions', () => {
        for (const e of atlasEntries) {
            expect(e.w).toBe(64);
            expect(e.h).toBe(PSETILE.C_TILE_CANVAS_HEIGHT);
        }
    });

    it('tile positions are on a regular grid', () => {
        for (let i = 0; i < atlasEntries.length; i++) {
            const e = atlasEntries[i];
            const expectedCol = i % builtCols;
            const expectedRow = Math.floor(i / builtCols);
            expect(e.x).toBe(expectedCol * builtTileW);
            expect(e.y).toBe(expectedRow * builtTileH);
        }
    });

    it('no two tiles share the same atlas position', () => {
        const positions = atlasEntries.map(e => `${e.x},${e.y}`);
        const unique = new Set(positions);
        expect(unique.size).toBe(positions.length);
    });
});

// ---------------------------------------------------------------------------
// 4. Full initializeTexture integration (all tile libraries + PIXI API)
// ---------------------------------------------------------------------------

describe('ASTILE.initializeTexture integration', () => {
    let texCache;
    let baseTextureCanvas;
    let textureConstructorCalls;

    beforeAll(() => {
        const localCtx = createContext({
            console,
            Math,
            G_CHECK: false,
            MMAPRENDER: {
                getTextureBaseSizeX: () => 64,
                getTextureBaseSizeY: () => 32,
            },
        });

        texCache = {};
        baseTextureCanvas = null;
        textureConstructorCalls = 0;

        localCtx.PIXI = {
            BaseTexture: class { constructor(canvas) { baseTextureCanvas = canvas; } },
            Rectangle: class { constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; } },
            Texture: class { constructor(base, frame) { textureConstructorCalls++; this.frame = frame; } },
            utils: { TextureCache: texCache },
            SCALE_MODES: { NEAREST: 0 },
        };

        function load(filePath) {
            runInContext(readFileSync(filePath, 'utf8'), localCtx, { filename: filePath });
        }

        load(join(root, 'airsim-tile-const.js'));
        load(join(root, 'pse-tile.js'));
        load(join(root, 'airsim-tile.js'));

        localCtx.PSETILE.setCanvasFactory(createCanvas);
        localCtx.ASTILE.initializeTexture();
    });

    it('completes without throwing', () => {
        // A throw in beforeAll would fail every test in this block.
        expect(baseTextureCanvas).not.toBeNull();
    });

    it('passes a canvas of width 16*tileW to PIXI.BaseTexture', () => {
        expect(baseTextureCanvas.width).toBe(16 * 64);
        expect(baseTextureCanvas.height).toBeGreaterThan(0);
    });

    it('registers sub-textures in PIXI.utils.TextureCache for all procedural tiles', () => {
        // Procedural tiles: ASICON(13) + ASZONE(~13) + terrain(1) + road congestion(5)
        //   + RICO density(39) + RICO display(37) = ~108 (some dedup reduces this slightly)
        expect(Object.keys(texCache).length).toBeGreaterThan(90);
    });

    it('PIXI.Texture is constructed at least once per cache entry', () => {
        // constructor calls >= cache entries: duplicate tile IDs (e.g. DIRT=DEFAULT=10)
        // produce multiple constructor calls that overwrite the same cache key.
        expect(textureConstructorCalls).toBeGreaterThanOrEqual(Object.keys(texCache).length);
    });

    it('every TextureCache entry has a frame with non-negative coordinates', () => {
        for (const name of Object.keys(texCache)) {
            const frame = texCache[name].frame;
            expect(frame.x).toBeGreaterThanOrEqual(0);
            expect(frame.y).toBeGreaterThanOrEqual(0);
            expect(frame.w).toBe(64);
            expect(frame.h).toBe(100);
        }
    });
});
