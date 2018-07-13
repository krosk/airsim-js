let ASTILE = (function ()
{
    let public = {};
    
    public.getColor = function astile_getColor(r, g, b)
    {
        return (r) * 2**16 + (g) * 2**8 + (b);
    }
    
    public.C_TILE_ZONE = {
        NONE: 0,
        DEFAULT: 1,
        DIRT: 1,
        ROAD: 3,
        RESLOW: 10,
        COMLOW: 20,
        INDLOW: 30,
    };
    
    public.C_TILE_ROAD_CONGESTION = {
        NONE: 100,
        LOW: 101,
        MID: 102,
        HIG: 103,
        VHI: 104
    };
    
    public.C_TILE_RICO = {
        NONE: 200,
        RESLOW_0: 210,
        RESLOW_1: 211,
        RESLOW_2: 212,
        INDLOW_0: 220,
        INDLOW_1: 221,
        INDLOW_2: 222,
        COMLOW_0: 230,
        COMLOW_1: 231,
        COMLOW_2: 232,
    };
    
    public.C_TILE_ICON = {
        NONE: 900,
        VIEW: 910,
        ZONE: 920,
        SPDP: 930,
        GAME: 940,
        PLAY: 931,
        PLAY2: 932,
        PLAY3: 933,
        STOP: 934,
        STEP: 935,
        SAVE: 941,
        LOAD: 942
    };
    
    public.getTileTextureName = function astile_getTileTextureName(tileId)
    {
        return "TEXTURE-" + tileId;
    }
    
    public.createTexture = function astile_createTexture(color, margin, height)
    {
        let graphics = new PIXI.Graphics();
        
        let C_TEXTURE_BASE_SIZE_X = MMAPRENDER.getTextureBaseSizeX();
        let C_TEXTURE_BASE_SIZE_Y = MMAPRENDER.getTextureBaseSizeY();
    
        let black = 0x000000;
        graphics.beginFill(color);
        graphics.lineStyle(1, black);
    
        let M = margin; // margin
        let H = height;
    
        // draw a rectangle
        graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, M);
        graphics.lineTo(M, C_TEXTURE_BASE_SIZE_Y / 2);
        graphics.lineTo(M, C_TEXTURE_BASE_SIZE_Y / 2 + H);
        graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y - M + H);
        graphics.lineTo(C_TEXTURE_BASE_SIZE_X - M, C_TEXTURE_BASE_SIZE_Y / 2 + H);
        graphics.lineTo(C_TEXTURE_BASE_SIZE_X - M, C_TEXTURE_BASE_SIZE_Y / 2);
        graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 2, M);
        graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y - 2 * M + M);
        graphics.lineTo(M, C_TEXTURE_BASE_SIZE_Y / 2);
        graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y - 2 * M + M);
        graphics.lineTo(C_TEXTURE_BASE_SIZE_X - M, C_TEXTURE_BASE_SIZE_Y / 2);
    
        return graphics;
    }
    
    public.initializeTexture = function astile_initializeTexture(library)
    {
        let values = Object.values(library.C_TILEENUM);
        for (let i in values)
        {
            let id = values[i] | 0;
            let textureName = public.getTileTextureName(id);
            let graphics = library.createTexture(id);
            let texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
        }
    }
    
    return public;
})();

let ASICON_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_ICON;
    const C = public.C_TILEENUM;
    
    let getColor = ASTILE.getColor;
    
    public.C_COLOR = {
        [C.NONE] : getColor(64, 64, 64),
        [C.VIEW] : getColor(0, 255, 255),
        [C.ZONE] : getColor(0, 192, 0),
        [C.SPDP] : getColor(0, 192, 192),
        [C.GAME] : getColor(0, 0, 192),
        [C.PLAY] : getColor(0, 255, 0),
        [C.PLAY2] : getColor(0, 255, 0),
        [C.PLAY3] : getColor(0, 255, 0),
        [C.STOP] : getColor(255, 0, 0),
        [C.STEP] : getColor(255, 192, 0),
        [C.SAVE] : getColor(64, 64, 255),
        [C.LOAD] : getColor(64, 255, 64)
    }
    
    let addNothing = function asicon_addNothing(color, height)
    {
        let graphics = addTileBase(color);
        return graphics;
    }
    
    let addTileBase = function asicon_addTileBase(color)
    {
        let margin = 0;
        let height = 3;
        let graphics = ASTILE.createTexture(0xFFFFFF, margin, height);
        let black = 0x000000;
        graphics.beginFill(color);
        graphics.lineStyle(1, black);
        return graphics;
    }
    
    let drawRectangle = function asicon_drawRectangle(graphics, topLeftX, topLeftY, sizeX, sizeY)
    {
        graphics.moveTo(topLeftX, topLeftY);
        graphics.lineTo(topLeftX + sizeX, topLeftY);
        graphics.lineTo(topLeftX + sizeX, topLeftY + sizeY);
        graphics.lineTo(topLeftX, topLeftY + sizeY);
        graphics.lineTo(topLeftX, topLeftY);
    }
    
    let drawTriangleLeft = function asicon_drawTriangleLeft(graphics, topLeftX, topLeftY, sizeX, sizeY)
    {
        graphics.moveTo(topLeftX, topLeftY);
        graphics.lineTo(topLeftX + sizeX, topLeftY + sizeY / 2);
        graphics.lineTo(topLeftX, topLeftY + sizeY);
        graphics.lineTo(topLeftX, topLeftY);
    }
    
    let addSquare = function asicon_addSquare(color, height)
    {
        let graphics = addTileBase(color);
        
        let CX = MMAPRENDER.getTextureBaseSizeX() / 2;
        let CY = MMAPRENDER.getTextureBaseSizeY() / 2;
        let M = 0;
        let H = height;
        
        drawRectangle(graphics, CX - H/2, CY - H/2, H, H);
        
        return graphics;
    }
    
    let addPlay = function asicon_addPlay(color, height)
    {
        let graphics = addTileBase(color);
        
        let CX = MMAPRENDER.getTextureBaseSizeX() / 2;
        let CY = MMAPRENDER.getTextureBaseSizeY() / 2;
        let M = 0;
        let H = height;
        
        drawTriangleLeft(graphics, CX - H/2, CY - H/2, H, H);
        
        return graphics;
    }
    
    let addPlay2 = function asicon_addPlay2(color, height)
    {
        let graphics = addTileBase(color);
        
        let CX = MMAPRENDER.getTextureBaseSizeX() / 2;
        let CY = MMAPRENDER.getTextureBaseSizeY() / 2;
        let M = 0;
        let H = height;
        
        drawTriangleLeft(graphics, CX - H/2, CY - H/2, H/2, H);
        drawTriangleLeft(graphics, CX, CY - H/2, H/2, H);
        
        return graphics;
    }
    
    let addPlay3 = function asicon_addPlay3(color, height)
    {
        let graphics = addTileBase(color);
        
        let CX = MMAPRENDER.getTextureBaseSizeX() / 2;
        let CY = MMAPRENDER.getTextureBaseSizeY() / 2;
        let M = 0;
        let H = height;
        
        drawTriangleLeft(graphics, CX - H/2, CY - H/2, H/3, H);
        drawTriangleLeft(graphics, CX - H/2 + H/3, CY - H/2, H/3, H);
        drawTriangleLeft(graphics, CX - H/2 + 2*H/3, CY - H/2, H/3, H);
        
        return graphics;
    }
    
    let addTriangleBreak = function asicon_addTriangleBreak(color, height)
    {
        let graphics = addTileBase(color);
        
        let CX = MMAPRENDER.getTextureBaseSizeX() / 2;
        let CY = MMAPRENDER.getTextureBaseSizeY() / 2;
        let M = 0;
        let H = height;
        
        drawTriangleLeft(graphics, CX - H / 2, CY - H / 2, 2*H/3, H);
        drawRectangle(graphics, CX + H / 2 - H/3, CY - H / 2, H/3, H);
        
        return graphics;
    }
    
    let addText = function asicon_addText(text)
    {
        return function(color, height)
        {
            let CX = MMAPRENDER.getTextureBaseSizeX();
            let CY = MMAPRENDER.getTextureBaseSizeY();
            let string = new PIXI.Text(text, {fill:color});
            string.width = CX; // works as minimal size only
            return string;
        };
    }
    
    public.createTexture = function asicon_createTexture(id)
    {
        let color = public.C_COLOR[id];
        let displayObject = public.C_ICON[id](color, 16);
        return displayObject;
    }
    
    public.C_ICON = {
        [C.NONE] : addNothing,
        [C.VIEW] : addText("VIEW"),
        [C.ZONE] : addText("ZONE"),
        [C.SPDP] : addText("PLAY"),
        [C.GAME] : addText("GAME"),
        [C.PLAY] : addPlay,
        [C.PLAY2] : addPlay2,
        [C.PLAY3] : addPlay3,
        [C.STOP] : addSquare,
        [C.STEP] : addTriangleBreak,
        [C.SAVE] : addText("SAVE"),
        [C.LOAD] : addText("LOAD"),
    }
    
    public.mainTile = [
        C.VIEW,
        C.ZONE,
        C.SPDP,
        C.GAME
    ]
    
    public.playTile = [
        C.PLAY, // play 1
        C.PLAY2,
        C.PLAY3,
        C.STOP, // pause
        C.STEP, // frame by frame
    ];
    
    public.saveTile = [
        C.SAVE,
        C.LOAD,
    ];

    return public;
})();