// PixiSimEngine

// Description:
// Handles tile texture generation via Canvas 2D and atlas packing.
// Tile canvases are drawn CPU-side; a single atlas texture is handed to PIXI.
// This module has no PIXI dependency for drawing — only for atlas registration.

// Call:
//   PIXI (for atlas registration only)
//   Math

var PSETILE = (function ()
{
    let public = {};

    // --- Color utilities ---

    public.getColor = function psetile_getColor(r, g, b)
    {
        return (r | 0) * 2**16 + (g | 0) * 2**8 + (b | 0);
    }

    // Converts a packed numeric color to a CSS hex string.
    public.colorToHex = function psetile_colorToHex(color)
    {
        return '#' + Math.floor(color).toString(16).padStart(6, '0');
    }

    let nuanceColor = function psetile_nuanceColor(color, level)
    {
        const R = 0xff0000;
        const G = 0x00ff00;
        const B = 0x0000ff;
        let cR = color & R;
        let cG = color & G;
        let cB = color & B;
        let nR = cR + (0x010000 * level);
        nR = Math.min(nR, R);
        nR = Math.max(nR, G);
        nR = nR & R;
        let nG = cG + (0x000100 * level);
        nG = Math.min(nG, G);
        nG = Math.max(nG, B);
        nG = nG & G;
        let nB = cB + (0x000001 * level);
        nB = Math.min(nB, B);
        nB = Math.max(nB, 0);
        nB = nB & B;
        return nR + nG + nB;
    }

    // --- Canvas factory ---
    // Injectable for Node.js testing: PSETILE.setCanvasFactory(require('canvas').createCanvas)

    let _createCanvas = function psetile_defaultCreateCanvas(w, h)
    {
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    };

    public.setCanvasFactory = function psetile_setCanvasFactory(factory)
    {
        _createCanvas = factory;
    };

    public.createCanvas = function psetile_createCanvas(w, h)
    {
        return _createCanvas(w, h);
    };

    // --- Tile canvas geometry ---

    // All tile canvases share this fixed height.
    // Local coordinate (0, 0) = center of isometric base diamond is placed at
    // canvas y = C_TILE_CANVAS_HEIGHT - texSizeY/2, keeping bottom diamond vertex
    // at the canvas bottom edge so sprites bottom-align correctly at screen position y.
    // 100 comfortably exceeds the tallest tile (COMHIG level 5 ≈ 84px total height).
    public.C_TILE_CANVAS_HEIGHT = 100;

    // Draw an isometric box into a Canvas 2D context.
    // ctx must already be translated so that local (0,0) = center of base diamond.
    // BWo/BHo: offset of box center from origin. BW/BH: base width/height. H: extrusion height.
    public.drawBlock = function psetile_drawBlock(ctx, color, BWo, BHo, BW, BH, H)
    {
        let hexColor = public.colorToHex(color);
        let hexBlack = '#000000';

        let x1 = BWo,          y1 = BHo - BH / 2 - H;
        let x2 = BWo - BW / 2, y2 = BHo - H;
        let x3 = x2,           y3 = y2 + H;
        let x7 = x1,           y7 = BHo + BH / 2 - H;
        let x4 = x1,           y4 = y7 + H;
        let x6 = BWo + BW / 2, y6 = y2;
        let x5 = x6,           y5 = y6 + H;

        // top face — fill
        ctx.beginPath();
        ctx.fillStyle = hexColor;
        ctx.moveTo(x1, y1 - 1);
        ctx.lineTo(x2, y2 - 1);
        ctx.lineTo(x7, y7 - 1);
        ctx.lineTo(x6, y6 - 1);
        ctx.closePath();
        ctx.fill();

        // top face — contour
        ctx.beginPath();
        ctx.strokeStyle = hexBlack;
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1 - 1);
        ctx.lineTo(x2, y2 - 1);
        ctx.moveTo(x2, y2 - 1);
        ctx.lineTo(x7, y7 - 1);
        ctx.moveTo(x7, y7 - 1);
        ctx.lineTo(x6, y6 - 1);
        ctx.moveTo(x6, y6 - 1);
        ctx.lineTo(x1, y1 - 1);
        ctx.stroke();

        // left face — fill
        ctx.beginPath();
        ctx.fillStyle = public.colorToHex(nuanceColor(color, -32));
        ctx.moveTo(x7, y7 - 1);
        ctx.lineTo(x2, y2 - 1);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();

        // left face — contour
        ctx.beginPath();
        ctx.strokeStyle = hexBlack;
        ctx.lineWidth = 1;
        ctx.moveTo(x2 + 0.5, y2);
        ctx.lineTo(x3 + 0.5, y3);
        ctx.moveTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.moveTo(x4 - 1, y4);
        ctx.lineTo(x7 - 1, y7);
        ctx.stroke();

        // right face — fill
        ctx.beginPath();
        ctx.fillStyle = public.colorToHex(nuanceColor(color, -64));
        ctx.moveTo(x7, y7 - 1);
        ctx.lineTo(x6, y6 - 1);
        ctx.lineTo(x5, y5);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();

        // right face — contour
        ctx.beginPath();
        ctx.strokeStyle = hexBlack;
        ctx.lineWidth = 1;
        ctx.moveTo(x6 - 1, y6);
        ctx.lineTo(x5 - 1, y5);
        ctx.moveTo(x5, y5);
        ctx.lineTo(x4, y4);
        ctx.moveTo(x4, y4);
        ctx.lineTo(x7, y7);
        ctx.stroke();
    }

    // Create a tile canvas containing a single isometric block.
    // Returns an HTMLCanvasElement sized texSizeX × C_TILE_CANVAS_HEIGHT.
    // The context is left translated so that subsequent drawBlock calls share the same origin.
    public.createTexture = function psetile_createTexture(color, margin, height, texSizeX, texSizeY)
    {
        let canvas = _createCanvas(texSizeX, public.C_TILE_CANVAS_HEIGHT);
        let ctx = canvas.getContext('2d');
        // Place local (0,0) so that the bottom diamond vertex lands at canvas bottom.
        ctx.translate(texSizeX / 2, public.C_TILE_CANVAS_HEIGHT - texSizeY / 2);

        let BW = texSizeX - margin * 4;
        let BH = texSizeY - margin * 2;
        public.drawBlock(ctx, color, 0, 0, BW, BH, height);
        return canvas;
    }

    // --- Texture name cache ---

    let m_tileIdToTextureNameCache = {};

    let getTileTextureNameUnprotected = function psetile_getTileTextureNameUnprotected(tileId)
    {
        return 'TEXTURE-' + tileId;
    }

    public.getTileTextureName = function psetile_getTileTextureName(tileId)
    {
        let name = m_tileIdToTextureNameCache[tileId];
        if (typeof name == 'undefined')
        {
            console.log('texture not loaded for ' + tileId);
            return getTileTextureNameUnprotected(0);
        }
        return name;
    }

    // --- Atlas collection and packing ---

    let m_pendingTiles = []; // [{textureName, canvas}]

    // Collect tile canvases from a library. Call buildAtlas() after all libraries are registered.
    public.initializeTextureFor = function psetile_initializeTextureFor(library)
    {
        let values = Object.values(library.C_TILEENUM);
        let textureMap = library.C_TEXTUREENUM;
        for (let i in values)
        {
            let tileId = values[i] | 0;
            if (typeof textureMap === 'undefined' || typeof textureMap[tileId] === 'undefined')
            {
                let textureName = getTileTextureNameUnprotected(tileId);
                let canvas = library.createTexture(tileId);
                m_pendingTiles.push({textureName: textureName, canvas: canvas});
                m_tileIdToTextureNameCache[tileId] = textureName;
            }
            else
            {
                m_tileIdToTextureNameCache[tileId] = textureMap[tileId];
            }
        }
    }

    // Pack all pending tile canvases into a single atlas and register sub-textures with PIXI.
    // tileW must equal the textureBaseSizeX used when creating tiles.
    public.buildAtlas = function psetile_buildAtlas(tileW)
    {
        let tileH = public.C_TILE_CANVAS_HEIGHT;
        let cols = 16;
        let rows = Math.ceil(m_pendingTiles.length / cols);
        let atlasW = cols * tileW;
        let atlasH = rows * tileH;

        let atlasCanvas = _createCanvas(atlasW, atlasH);
        let atlasCtx = atlasCanvas.getContext('2d');

        for (let i = 0; i < m_pendingTiles.length; i++)
        {
            let col = i % cols;
            let row = Math.floor(i / cols);
            let x = col * tileW;
            let y = row * tileH;
            atlasCtx.drawImage(m_pendingTiles[i].canvas, x, y);
            m_pendingTiles[i].atlasX = x;
            m_pendingTiles[i].atlasY = y;
        }

        let baseTexture = new PIXI.BaseTexture(atlasCanvas);
        baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        for (let i = 0; i < m_pendingTiles.length; i++)
        {
            let entry = m_pendingTiles[i];
            let frame = new PIXI.Rectangle(entry.atlasX, entry.atlasY, tileW, tileH);
            PIXI.utils.TextureCache[entry.textureName] = new PIXI.Texture(baseTexture, frame);
        }

        m_pendingTiles = [];
    }

    return public;
})();
