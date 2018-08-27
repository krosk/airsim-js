let ASTILE = (function ()
{
    let public = {};
    
    public.getColor = function astile_getColor(r, g, b)
    {
        return (r | 0) * 2**16 + (g | 0) * 2**8 + (b | 0);
    }
    
    // each zone is a function
    public.C_TILE_ZONE = {
        NONE: 0,
        DEFAULT: 1,
        DIRT: 1,
        PATH: 3,
        ROAD: 4,
        HIGHWAY: 5,
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
        ROAD: 201,
        RESLOW_0: 210,
        RESLOW_1: 211,
        RESLOW_2: 212,
        RESLOW_3: 213,
        RESLOW_4: 214,
        RESLOW_5: 215,
        RESHIG_0: 230,
        RESHIG_1: 231,
        RESHIG_2: 232,
        RESHIG_3: 233,
        RESHIG_4: 234,
        RESHIG_5: 235,
        INDLOW_0: 240,
        INDLOW_1: 241,
        INDLOW_2: 242,
        INDLOW_3: 243,
        INDLOW_4: 244,
        INDLOW_5: 245,
        INDHIG_0: 260,
        INDHIG_1: 261,
        INDHIG_2: 262,
        INDHIG_3: 263,
        INDHIG_4: 264,
        INDHIG_5: 265,
        COMLOW_0: 270,
        COMLOW_1: 271,
        COMLOW_2: 272,
        COMLOW_3: 273,
        COMLOW_4: 274,
        COMLOW_5: 275,
        COMHIG_0: 290,
        COMHIG_1: 291,
        COMHIG_2: 292,
        COMHIG_3: 293,
        COMHIG_4: 294,
        COMHIG_5: 295,
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
    
    public.C_TILEENUM = ASTILE.C_TILE_ROAD_CONGESTION;
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
    
    const C_RESLOW_COLOR = getColor(76*1.0, 175*1.0, 80*1.0);
    const C_RESHIG_COLOR = getColor(76*0.6, 175*0.6, 80*0.6);
    const C_INDLOW_COLOR = getColor(255*1.0, 235*1.0, 59*1.0);
    const C_INDHIG_COLOR = getColor(255*0.6, 235*0.6, 59*0.6);
    const C_COMLOW_COLOR = getColor(33*1.0, 150*1.0, 243*1.0);
    const C_COMHIG_COLOR = getColor(33*0.6, 150*0.6, 243*0.6);
    
    const C_TILETEXTURE = {
        [C.NONE] : [getColor(255, 255, 255), 3],
        [C.ROAD] : [getColor(158, 158, 158), 3],
        [C.RESLOW_0] : [C_RESLOW_COLOR, 3],
        [C.RESLOW_1] : [C_RESLOW_COLOR, 6],
        [C.RESLOW_2] : [C_RESLOW_COLOR, 9],
        [C.RESLOW_3] : [C_RESLOW_COLOR, 12],
        [C.RESLOW_4] : [C_RESLOW_COLOR, 15],
        [C.RESLOW_5] : [C_RESLOW_COLOR, 18],
        [C.RESHIG_0] : [C_RESHIG_COLOR, 3],
        [C.RESHIG_1] : [C_RESHIG_COLOR, 24],
        [C.RESHIG_2] : [C_RESHIG_COLOR, 27],
        [C.RESHIG_3] : [C_RESHIG_COLOR, 30],
        [C.RESHIG_4] : [C_RESHIG_COLOR, 33],
        [C.RESHIG_5] : [C_RESHIG_COLOR, 36],
        [C.INDLOW_0] : [C_INDLOW_COLOR, 3],
        [C.INDLOW_1] : [C_INDLOW_COLOR, 6],
        [C.INDLOW_2] : [C_INDLOW_COLOR, 9],
        [C.INDLOW_3] : [C_INDLOW_COLOR, 12],
        [C.INDLOW_4] : [C_INDLOW_COLOR, 15],
        [C.INDLOW_5] : [C_INDLOW_COLOR, 18],
        [C.INDHIG_0] : [C_INDHIG_COLOR, 3],
        [C.INDHIG_1] : [C_INDHIG_COLOR, 24],
        [C.INDHIG_2] : [C_INDHIG_COLOR, 27],
        [C.INDHIG_3] : [C_INDHIG_COLOR, 30],
        [C.INDHIG_4] : [C_INDHIG_COLOR, 33],
        [C.INDHIG_5] : [C_INDHIG_COLOR, 36],
        [C.COMLOW_0] : [C_COMLOW_COLOR, 3],
        [C.COMLOW_1] : [C_COMLOW_COLOR, 6],
        [C.COMLOW_2] : [C_COMLOW_COLOR, 9],
        [C.COMLOW_3] : [C_COMLOW_COLOR, 12],
        [C.COMLOW_4] : [C_COMLOW_COLOR, 15],
        [C.COMLOW_5] : [C_COMLOW_COLOR, 18],
        [C.COMHIG_0] : [C_COMHIG_COLOR, 3],
        [C.COMHIG_1] : [C_COMHIG_COLOR, 24],
        [C.COMHIG_2] : [C_COMHIG_COLOR, 27],
        [C.COMHIG_3] : [C_COMHIG_COLOR, 30],
        [C.COMHIG_4] : [C_COMHIG_COLOR, 33],
        [C.COMHIG_5] : [C_COMHIG_COLOR, 36],
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