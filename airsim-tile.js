let ASTILE = (function ()
{
    let public = {};
    
    public.getColor = function astile_getColor(r, g, b)
    {
        return (r | 0) * 2**16 + (g | 0) * 2**8 + (b | 0);
    }
    let getColor = public.getColor;
    
    public.C_COLOR = {
        RESLOW : getColor(76*1.0, 175*1.0, 80*1.0),
        RESHIG : getColor(76*0.6, 175*0.6, 80*0.6),
        INDLOW : getColor(255*1.0, 235*1.0, 59*1.0),
        INDHIG : getColor(255*0.6, 235*0.6, 59*0.6),
        COMLOW : getColor(33*1.0, 150*1.0, 243*1.0),
        COMHIG : getColor(33*0.6, 150*0.6, 243*0.6),
    }
    
    // each zone is a function
    public.C_TILE_ZONE = {
        NONE: 0,
        DEFAULT: 10,
        DIRT: 10,
        PATH: 12,
        ROAD: 14,
        HIGHWAY: 16,
        RESLOW: 21,
        INDLOW: 24,
        COMLOW: 27,
        RESHIG: 23,
        INDHIG: 26,
        COMHIG: 29
    };
    
    public.C_TILE_ROAD_CONGESTION = {
        NONE: 100,
        LOW: 101,
        MID: 102,
        HIG: 103,
        VHI: 104
    };
    
    public.C_TILE_RICO_DENSITY = {
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
    
    // hard rule: display id must be bigger
    // than 100
    
    public.C_TILE_DISPLAY_BASE_MODULO = 100;
    
    public.C_TILE_TERRAIN_DISPLAY = {
        DIRT_0 : 1000
    }
    
    public.C_TILE_ROAD_DISPLAY = {
        ____ : 1400,
        N___ : 1401,
        _E__ : 1402,
        __S_ : 1404,
        ___W : 1408,
        NE__ : 1403,
        N_S_ : 1405,
        N__W : 1409,
        _ES_ : 1406,
        _E_W : 1410,
        __SW : 1412,
        NES_ : 1407,
        NE_W : 1411,
        N_SW : 1413,
        _ESW : 1414,
        NESW : 1415
    };
    
    // rule xxab
    // xx is zone id
    // a is level
    // b is variant
    public.C_RICO_DISPLAY_ID_ZONE_DIGIT = 100;
    public.C_RICO_DISPLAY_ID_LEVEL_DIGIT = 10;
    public.C_RICO_DISPLAY_ID_VARIANT_DIGIT = 1;
    let metaGenerateRicoDisplayId = function astile_metaGen(table, codeBase)
    {
        const RICO_RANDOM = 4;
        const RICO_DENSITY_MIN = 1;
        const RICO_DENSITY_MAX = 5;
        for (let j = RICO_DENSITY_MIN; j <= RICO_DENSITY_MAX; j++)
        {
            for (let k = 0; k < RICO_RANDOM; k++)
            {
                let n = codeBase*public.C_RICO_DISPLAY_ID_ZONE_DIGIT + 
                    j * public.C_RICO_DISPLAY_ID_LEVEL_DIGIT + 
                    k * public.C_RICO_DISPLAY_ID_VARIANT_DIGIT;
                table[n] = n;
            }
        }
        let zeroDensityDisplayId = codeBase*public.C_RICO_DISPLAY_ID_ZONE_DIGIT;
        table[zeroDensityDisplayId] = zeroDensityDisplayId;
    }
    
    public.C_TILE_RICO_DISPLAY = {
        
    };
    // meta generation
    let ricoZone = [23, 24, 26, 27, 29];
    for (let i = 0; i < ricoZone.length; i++)
    {
        let codeBase = ricoZone[i];
        metaGenerateRicoDisplayId(public.C_TILE_RICO_DISPLAY, codeBase);
    }
    
    public.C_TILE_RICO_RESLOW_DISPLAY = {
        
    }
    const RICO_RESLOW_BASE = 21;
    metaGenerateRicoDisplayId(public.C_TILE_RICO_RESLOW_DISPLAY, RICO_RESLOW_BASE);
    
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
    
    public.drawBlock = function astile_drawBlock(graphics, color, BWo, BHo, BW, BH, H)
    {
        let x1 = BW / 2 + BWo;
        let y1 = BHo;
        
        let x2 = BWo;
        let y2 = BH / 2 + BHo;
        
        let x3 = x2;
        let y3 = y2 + H;
        
        let x7 = x1;
        let y7 = BH + BHo;
        
        let x4 = x1;
        let y4 = y7 + H;
        
        let x6 = BWo + BW;
        let y6 = y2;
        
        let x5 = x6;
        let y5 = y6 + H;
        
        graphics.lineStyle(1, 0x000000);
            
        // draw a rectangle
        // top
        graphics.beginFill(color);
        graphics.moveTo(x1, y1); // top
        graphics.lineTo(x2, y2); // left
        graphics.lineTo(x7, y7); // center
        graphics.lineTo(x6, y6); // right
        graphics.lineTo(x1, y1); // top
        graphics.endFill();
        
        graphics.beginFill(color);
        graphics.moveTo(x7, y7); // center
        graphics.lineTo(x2, y2); // left
        graphics.lineTo(x3, y3); // left
        graphics.lineTo(x4, y4); // bottom
        graphics.lineTo(x7, y7); // center
        graphics.endFill();
        
        graphics.beginFill(color);
        graphics.moveTo(x7, y7); // center
        graphics.lineTo(x6, y6); // right
        graphics.lineTo(x5, y5); // right
        graphics.lineTo(x4, y4); // bottom
        graphics.lineTo(x7, y7); // center
        graphics.endFill();
    }
    
    public.createTexture = function astile_createTexture(color, margin, height)
    {
        let graphics = new PIXI.Graphics();
        
        let C_TEXTURE_BASE_SIZE_X = MMAPRENDER.getTextureBaseSizeX();
        let C_TEXTURE_BASE_SIZE_Y = MMAPRENDER.getTextureBaseSizeY();
        
        // defining a rectangle
        // is defining its base and height
        // and top left offset
    
        let M = margin;
        let H = height;
        
        let BW = C_TEXTURE_BASE_SIZE_X - M * 4;
        let BWo = M * 2;
        let BH = C_TEXTURE_BASE_SIZE_Y - M * 2;
        let BHo = M;
        
        public.drawBlock(graphics, color, BWo, BHo, BW, BH, H);
        
        return graphics;
    }
    
    public.initializeTexture = function astile_initializeTexture()
    {
        initializeTextureFor(ASICON_TILE);
        initializeTextureFor(ASZONE_TILE);
        initializeTextureFor(ASZONE_TERRAIN_TILE);
        initializeTextureFor(ASROAD_CONGESTION_TILE);
        initializeTextureFor(ASROAD_DISPLAY_TILE);
        initializeTextureFor(ASRICO_DENSITY_TILE);
        initializeTextureFor(ASRICO_DISPLAY_TILE);
        initializeTextureFor(ASRICO_RESLOW_DISPLAY_TILE);
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
    let C_COLOR = ASTILE.C_COLOR;
    
    public.C_TILEENUM = ASTILE.C_TILE_ZONE;
    const C = public.C_TILEENUM;
    
    const C_CITYCOLOR = {
        [C.NONE] : getColor(255, 0, 0),
        [C.DIRT] : getColor(121, 85, 72),
        [C.ROAD] : getColor(158, 158, 158),
        [C.RESLOW] : C_COLOR.RESLOW,
        [C.INDLOW] : C_COLOR.INDLOW,
        [C.COMLOW] : C_COLOR.COMLOW,
        [C.RESHIG] : C_COLOR.RESHIG,
        [C.INDHIG] : C_COLOR.INDHIG,
        [C.COMHIG] : C_COLOR.COMHIG
    }
    
    const C_CITYHEIGHT = {
        [C.NONE] : 0,
        [C.DIRT] : 3,
        [C.ROAD] : 6,
        [C.RESLOW] : 6,
        [C.COMLOW] : 6,
        [C.INDLOW] : 6,
        [C.RESHIG] : 6,
        [C.COMHIG] : 6,
        [C.INDHIG] : 6,
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

let ASZONE_TERRAIN_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_TERRAIN_DISPLAY;
    
    public.createTexture = function aszone_terrain_tile_createTexture(id)
    {
        return ASZONE_TILE.createTexture(ASTILE.C_TILE_ZONE.DIRT);
    }
    
    return public;
})();

let ASROAD_CONGESTION_TILE = (function ()
{
    let public = {};
    
    let getColor = ASTILE.getColor;
    
    public.C_TILEENUM = ASTILE.C_TILE_ROAD_CONGESTION;
    const C = public.C_TILEENUM;
    
    const C_CONGESTION_COLOR = {
        [C.NONE] : getColor(255, 255, 255),
        [C.LOW] : getColor(76, 175, 80),
        [C.MID] : getColor(255, 235, 59),
        [C.HIG] : getColor(255, 50, 50),
        [C.VHI] : getColor(180, 50, 50)
    };
    
    let getCongestionTextureMargin = function asroad_getCongestionTextureMargin(id)
    {
        return 0;
    }
    
    let getCongestionTextureHeight = function asroad_getCongestionTextureHeight(id)
    {
        return 3;
    }
    
    public.createTexture = function asroad_createTexture(id)
    {
        let color = C_CONGESTION_COLOR[id];
        let margin = getCongestionTextureMargin(id);
        let height = getCongestionTextureHeight(id);
        return ASTILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASROAD_DISPLAY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_ROAD_DISPLAY;
    const C = public.C_TILEENUM;
    
    let getColor = ASTILE.getColor;
    
    let addTileBase = function asroad_display_tile_addTileBase(color)
    {
        let margin = getTextureMargin();
        let height = getTextureHeight();
        let graphics = ASTILE.createTexture(color, margin, height);
        let yellow = 0xFFFF00;
        graphics.beginFill(color);
        graphics.lineStyle(1, yellow);
        return graphics;
    }
    
    let getTextureMargin = function ()
    {
        return 0;
    }
    
    let getTextureHeight = function ()
    {
        return 3;
    }
    
    let drawDirection = function asroad_display_tile_dtawDirection(id, graphics)
    {
        let C_TEXTURE_BASE_SIZE_X = MMAPRENDER.getTextureBaseSizeX();
        let C_TEXTURE_BASE_SIZE_Y = MMAPRENDER.getTextureBaseSizeY();
        
        let M = getTextureMargin();
        let H = getTextureHeight();
        
        let flags = id % 100;
        let N = flags & (1 << 0);
        let E = flags & (1 << 1);
        let S = flags & (1 << 2);
        let W = flags & (1 << 3);
        
        // tl
        if (N)
        {
            graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y / 2);
            graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 4 + M / 2, C_TEXTURE_BASE_SIZE_Y / 4 + M / 2);
        }
        // tr
        if (E)
        {
            graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y / 2);
            graphics.lineTo(3 * C_TEXTURE_BASE_SIZE_X / 4 - M / 2, C_TEXTURE_BASE_SIZE_Y / 4 + M / 2);
        }
        // br
        if (S)
        {
            graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y / 2);
            graphics.lineTo(3 * C_TEXTURE_BASE_SIZE_X / 4 - M / 2, 3 * C_TEXTURE_BASE_SIZE_Y / 4 - M / 2);
        }
        // bl
        if (W)
        {
            graphics.moveTo(C_TEXTURE_BASE_SIZE_X / 2, C_TEXTURE_BASE_SIZE_Y / 2);
            graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 4 + M / 2, 3 * C_TEXTURE_BASE_SIZE_Y / 4 - M / 2);
        }
    }
    
    public.createTexture = function asroad_display_tile_createTexture(id)
    {
        let color = getColor(158, 158, 158);
        let graphics = addTileBase(color);
        drawDirection(id, graphics);
        return graphics;
    }
    
    return public;
})();

let ASRICO_DISPLAY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_RICO_DISPLAY;
    
    let getColor = ASTILE.getColor;
    
    let getBaseMargin = function ()
    {
        return 0;
    }
    
    let getBaseHeight = function ()
    {
        return 3;
    }
    
    public.addTileBase = function asrico_display_tile_addtilebase()
    {
        let color = getColor(158, 158, 158);
        let margin = getBaseMargin();
        let height = getBaseHeight();
        let graphic = ASTILE.createTexture(color, margin, height);
        return graphic;
    }
    
    public.createTexture = function (id)
    {
        let graphics = public.addTileBase();
        let gray = getColor(158, 158, 158);
        ASTILE.drawBlock(graphics, gray, 8, 8, 16, 8, 5);
        return graphics;
    }
    
    return public;
})();

let ASRICO_RESLOW_DISPLAY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_RICO_RESLOW_DISPLAY;
    
    let getColor = ASTILE.getColor;
    
    let getDisplayIdLevel = function (id)
    {
        return ((id % (10 * ASTILE.C_RICO_DISPLAY_ID_LEVEL_DIGIT)) / ASTILE.C_RICO_DISPLAY_ID_LEVEL_DIGIT) | 0;
    }
    
    let getDisplayIdVariant = function (id)
    {
        return ((id % (10 * ASTILE.C_RICO_DISPLAY_ID_VARIANT_DIGIT)) / ASTILE.C_RICO_DISPLAY_ID_VARIANT_DIGIT) | 0;
    }
    
    public.createTexture = function (id)
    {
        let level = getDisplayIdLevel(id);
        let variant = getDisplayIdVariant(id);
        let graphics = ASRICO_DISPLAY_TILE.addTileBase();
        let color = getColor(158, 255, 158);
        //console.log(graphics.height + ' ' + id);
        ASTILE.drawBlock(graphics, color, 0, 0, 64, 32, 3 * level);
        //console.log(graphics.height + ' ' + id);
        return graphics;
    }
    
    return public;
})();

let ASRICO_DENSITY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE.C_TILE_RICO_DENSITY;
    const C = public.C_TILEENUM;
    const C_COLOR = ASTILE.C_COLOR;
    
    let getColor = ASTILE.getColor;
    
    const C_TILETEXTURE = {
        [C.NONE] : [getColor(255, 255, 255), 3],
        [C.ROAD] : [getColor(158, 158, 158), 3],
        [C.RESLOW_0] : [C_COLOR.RESLOW, 3],
        [C.RESLOW_1] : [C_COLOR.RESLOW, 6],
        [C.RESLOW_2] : [C_COLOR.RESLOW, 9],
        [C.RESLOW_3] : [C_COLOR.RESLOW, 12],
        [C.RESLOW_4] : [C_COLOR.RESLOW, 15],
        [C.RESLOW_5] : [C_COLOR.RESLOW, 18],
        [C.RESHIG_0] : [C_COLOR.RESHIG, 3],
        [C.RESHIG_1] : [C_COLOR.RESHIG, 24],
        [C.RESHIG_2] : [C_COLOR.RESHIG, 27],
        [C.RESHIG_3] : [C_COLOR.RESHIG, 30],
        [C.RESHIG_4] : [C_COLOR.RESHIG, 33],
        [C.RESHIG_5] : [C_COLOR.RESHIG, 36],
        [C.INDLOW_0] : [C_COLOR.INDLOW, 3],
        [C.INDLOW_1] : [C_COLOR.INDLOW, 6],
        [C.INDLOW_2] : [C_COLOR.INDLOW, 9],
        [C.INDLOW_3] : [C_COLOR.INDLOW, 12],
        [C.INDLOW_4] : [C_COLOR.INDLOW, 15],
        [C.INDLOW_5] : [C_COLOR.INDLOW, 18],
        [C.INDHIG_0] : [C_COLOR.INDHIG, 3],
        [C.INDHIG_1] : [C_COLOR.INDHIG, 24],
        [C.INDHIG_2] : [C_COLOR.INDHIG, 27],
        [C.INDHIG_3] : [C_COLOR.INDHIG, 30],
        [C.INDHIG_4] : [C_COLOR.INDHIG, 33],
        [C.INDHIG_5] : [C_COLOR.INDHIG, 36],
        [C.COMLOW_0] : [C_COLOR.COMLOW, 3],
        [C.COMLOW_1] : [C_COLOR.COMLOW, 6],
        [C.COMLOW_2] : [C_COLOR.COMLOW, 9],
        [C.COMLOW_3] : [C_COLOR.COMLOW, 12],
        [C.COMLOW_4] : [C_COLOR.COMLOW, 15],
        [C.COMLOW_5] : [C_COLOR.COMLOW, 18],
        [C.COMHIG_0] : [C_COLOR.COMHIG, 3],
        [C.COMHIG_1] : [C_COLOR.COMHIG, 24],
        [C.COMHIG_2] : [C_COLOR.COMHIG, 27],
        [C.COMHIG_3] : [C_COLOR.COMHIG, 30],
        [C.COMHIG_4] : [C_COLOR.COMHIG, 33],
        [C.COMHIG_5] : [C_COLOR.COMHIG, 36],
    };
    
    let getTileTextureMargin = function asrico_getTileTextureMargin(id)
    {
        return 0;
    }
    
    public.createTexture = function asrico_createTexture(id)
    {
        if (G_CHECK && typeof C_TILETEXTURE[id] == 'undefined')
        {
            throw "ASRICO density Tile " + id + " has no texture";
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