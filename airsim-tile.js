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
    
    public.C_TILE_ROAD = {
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
        RESLOW_3: 213,
        RESMID_0: 220,
        RESMID_4: 224,
        RESMID_5: 225,
        RESMID_6: 226,
        RESHIG_0: 230,
        RESHIG_7: 237,
        RESHIG_8: 238,
        RESHIG_9: 239,
        INDLOW_0: 240,
        INDLOW_1: 241,
        INDLOW_2: 242,
        INDLOW_3: 243,
        INDMID_0: 250,
        INDMID_4: 254,
        INDMID_5: 255,
        INDMID_6: 256,
        INDHIG_0: 260,
        INDHIG_7: 267,
        INDHIG_8: 268,
        INDHIG_9: 269,
        COMLOW_0: 270,
        COMLOW_1: 271,
        COMLOW_2: 272,
        COMLOW_3: 273,
        COMMID_0: 280,
        COMMID_4: 284,
        COMMID_5: 285,
        COMMID_6: 286,
        COMHIG_0: 290,
        COMHIG_7: 297,
        COMHIG_8: 298,
        COMHIG_9: 299,
    };
    
    public.C_TILE_ICON = {
        NONE: 900,
        VIEW: 910,
        ZONE: 920,
        SPED: 930,
        GAME: 940,
        PLAY: 931,
        PLAY2: 932,
        PLAY3: 933,
        STOP: 934,
        STEP: 935,
        SAVE: 941,
        LOAD: 942,
        BENC: 943
    };
    
    let m_textureNameCache = {};
    
    let getTileTextureNameUnprotected = function astile_getTileTextureNameUnprotected(tileId)
    {
        return "TEXTURE-" + tileId;
    }
    
    public.getTileTextureName = function astile_getTileTextureName(tileId)
    {
        let name = getTileTextureNameUnprotected(tileId);
        if (typeof m_textureNameCache[name] == 'undefined')
        {
            console.log('texture not loaded for ' + tileId);
            return getTileTextureNameUnprotected(0);
        }
        return name;
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
    
    public.initializeTexture = function astile_initializeTexture()
    {
        initializeTextureFor(ASICON_TILE);
        initializeTextureFor(ASZONE_TILE);
        initializeTextureFor(ASROAD_TILE);
        initializeTextureFor(ASRICO_TILE);
    }
    
    let initializeTextureFor = function astile_initializeTextureFor(library)
    {
        let values = Object.values(library.C_TILEENUM);
        for (let i in values)
        {
            let id = values[i] | 0;
            let textureName = getTileTextureNameUnprotected(id);
            let graphics = library.createTexture(id);
            let texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
            m_textureNameCache[textureName] = true;
        }
    }
    
    return public;
})();

let ASZONE_TILE = (function ()
{
    let public = {};
    let getColor = ASTILE.getColor;
    
    public.C_TILEENUM = ASTILE.C_TILE_ZONE;
    const C = public.C_TILEENUM;
    
    const C_CITYCOLOR = {
        [C.NONE] : getColor(255, 0, 0),
        [C.DIRT] : getColor(121, 85, 72),
        [C.ROAD] : getColor(158, 158, 158),
        [C.RESLOW] : getColor(76, 175, 80),
        [C.COMLOW] : getColor(33, 150, 243),
        [C.INDLOW] : getColor(255, 235, 59)
    }
    
    const C_CITYHEIGHT = {
        [C.NONE] : 0,
        [C.DIRT] : 3,
        [C.ROAD] : 6,
        [C.RESLOW] : 6,
        [C.COMLOW] : 6,
        [C.INDLOW] : 6
    }
    
    let getCityTextureMargin = function aszone_getCityTextureMargin(id)
    {
        return 0;
    }
    
    public.createTexture = function aszone_createTexture(id)
    {
        let color = C_CITYCOLOR[id];
        let margin = getCityTextureMargin(id);
        let height = C_CITYHEIGHT[id];
        return ASTILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASROAD_TILE = (function ()
{
    let public = {};
    
    let getColor = ASTILE.getColor;
    
    public.C_TILEENUM = ASTILE.C_TILE_ROAD;
    const C = public.C_TILEENUM;
    
    const C_TRAFFICCOLOR = {
        [C.NONE] : getColor(255, 255, 255),
        [C.LOW] : getColor(76, 175, 80),
        [C.MID] : getColor(255, 235, 59),
        [C.HIG] : getColor(255, 50, 50),
        [C.VHI] : getColor(180, 50, 50)
    };
    
    let getTrafficTextureMargin = function asroad_getTrafficTextureMargin(id)
    {
        return 0;
    }
    
    let getTrafficTextureHeight = function asroad_getTrafficTextureHeight(id)
    {
        return 3;
    }
    
    public.createTexture = function asroad_createTexture(id)
    {
        let color = C_TRAFFICCOLOR[id];
        let margin = getTrafficTextureMargin(id);
        let height = getTrafficTextureHeight(id);
        return ASTILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASRICO_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_RICO;
    const C = public.C_TILEENUM;
    
    let getColor = ASTILE.getColor;
    
    const C_TILETEXTURE = {
        [C.NONE] : [getColor(255, 255, 255), 3],
        [C.RESLOW_0] : [getColor(76, 175, 80), 3],
        [C.RESLOW_1] : [getColor(76, 175, 80), 6],
        [C.RESLOW_2] : [getColor(76, 175, 80), 9],
        [C.RESLOW_3] : [getColor(76, 175, 80), 12],
        [C.RESMID_0] : [getColor(66, 165, 70), 3],
        [C.RESMID_4] : [getColor(66, 165, 70), 15],
        [C.RESMID_5] : [getColor(66, 165, 70), 18],
        [C.RESMID_6] : [getColor(66, 165, 70), 21],
        [C.RESHIG_0] : [getColor(56, 155, 60), 3],
        [C.RESHIG_7] : [getColor(56, 155, 60), 24],
        [C.RESHIG_8] : [getColor(56, 155, 60), 27],
        [C.RESHIG_9] : [getColor(56, 155, 60), 30],
        [C.INDLOW_0] : [getColor(255, 235, 59), 3],
        [C.INDLOW_1] : [getColor(255, 235, 59), 6],
        [C.INDLOW_2] : [getColor(255, 235, 59), 9],
        [C.INDLOW_3] : [getColor(255, 235, 59), 12],
        [C.INDMID_0] : [getColor(245, 225, 49), 3],
        [C.INDMID_4] : [getColor(245, 225, 49), 15],
        [C.INDMID_5] : [getColor(245, 225, 49), 18],
        [C.INDMID_6] : [getColor(245, 225, 49), 21],
        [C.INDHIG_0] : [getColor(235, 215, 39), 3],
        [C.INDHIG_7] : [getColor(235, 215, 39), 24],
        [C.INDHIG_8] : [getColor(235, 215, 39), 27],
        [C.INDHIG_9] : [getColor(235, 215, 39), 30],
        [C.COMLOW_0] : [getColor(33, 150, 243), 3],
        [C.COMLOW_1] : [getColor(33, 150, 243), 6],
        [C.COMLOW_2] : [getColor(33, 150, 243), 9],
        [C.COMLOW_3] : [getColor(33, 150, 243), 12],
        [C.COMMID_0] : [getColor(23, 140, 233), 3],
        [C.COMMID_4] : [getColor(23, 140, 233), 15],
        [C.COMMID_5] : [getColor(23, 140, 233), 18],
        [C.COMMID_6] : [getColor(23, 140, 233), 21],
        [C.COMHIG_0] : [getColor(13, 130, 223), 3],
        [C.COMHIG_7] : [getColor(13, 130, 223), 24],
        [C.COMHIG_8] : [getColor(13, 130, 223), 27],
        [C.COMHIG_9] : [getColor(13, 130, 223), 30],
    };
    
    let getTileTextureMargin = function asrico_getTileTextureMargin(id)
    {
        return 0;
    }
    
    public.createTexture = function asrico_createTexture(id)
    {
        if (G_CHECK && typeof C_TILETEXTURE[id] == 'undefined')
        {
            throw "ASRICO Tile " + id + " has no texture";
        }
        let color = C_TILETEXTURE[id][0];
        let margin = getTileTextureMargin(id);
        let height = C_TILETEXTURE[id][1];
        return ASTILE.createTexture(color, margin, height);
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
        [C.SPED] : getColor(0, 192, 192),
        [C.GAME] : getColor(0, 0, 192),
        [C.PLAY] : getColor(0, 255, 0),
        [C.PLAY2] : getColor(0, 255, 0),
        [C.PLAY3] : getColor(0, 255, 0),
        [C.STOP] : getColor(255, 0, 0),
        [C.STEP] : getColor(255, 192, 0),
        [C.SAVE] : getColor(64, 64, 255),
        [C.LOAD] : getColor(64, 255, 64),
        [C.BENC] : getColor(255, 64, 64)
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
        let f = public.C_ICON[id];
        if (typeof f != 'function')
        {
            throw public.C_NAME + " missing function id " + id;
        }
        let displayObject = public.C_ICON[id](color, 16);
        return displayObject;
    }
    
    public.C_ICON = {
        [C.NONE] : addNothing,
        [C.VIEW] : addText("VIEW"),
        [C.ZONE] : addText("ZONE"),
        [C.SPED] : addText("PLAY"),
        [C.GAME] : addText("GAME"),
        [C.PLAY] : addPlay,
        [C.PLAY2] : addPlay2,
        [C.PLAY3] : addPlay3,
        [C.STOP] : addSquare,
        [C.STEP] : addTriangleBreak,
        [C.SAVE] : addText("SAVE"),
        [C.LOAD] : addText("LOAD"),
        [C.BENC] : addText("BENC")
    }

    return public;
})();