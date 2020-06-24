let ASTILE = (function ()
{
    let public = {};
    
    let getColor = PSETILE.getColor;
    
    public.C_COLOR = {
        ROAD : getColor(158, 158, 158),
        RESLOW : getColor(76*1.0, 175*1.0, 80*1.0),
        RESHIG : getColor(76*0.6, 175*0.6, 80*0.6),
        INDLOW : getColor(255*1.0, 235*1.0, 59*1.0),
        INDHIG : getColor(255*0.6, 235*0.6, 59*0.6),
        COMLOW : getColor(33*1.0, 150*1.0, 243*1.0),
        COMHIG : getColor(33*0.6, 150*0.6, 243*0.6),
        POWLOW : getColor(255, 200, 0),
    }
    
    // each zone is a function
    
    // hard rule: display id must be bigger
    // than 100
    
    public.initializeTexture = function astile_initializeTexture()
    {
        PSETILE.initializeTextureFor(ASICON_TILE);
        PSETILE.initializeTextureFor(ASZONE_TILE);
        PSETILE.initializeTextureFor(ASZONE_TERRAIN_TILE);
        PSETILE.initializeTextureFor(ASROAD_CONGESTION_TILE);
        PSETILE.initializeTextureFor(ASROAD_DISPLAY_TILE);
        PSETILE.initializeTextureFor(ASRICO_DENSITY_TILE);
        PSETILE.initializeTextureFor(ASRICO_DISPLAY_TILE);
    }
    
    return public;
})();

let ASZONE_TILE = (function ()
{
    let public = {};
    let getColor = PSETILE.getColor;
    let C_COLOR = ASTILE.C_COLOR;
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_ZONE;
    const C = public.C_TILEENUM;
    
    const C_CITYCOLOR = {
        [C.NONE] : getColor(255, 0, 0),
        [C.DIRT] : getColor(121, 85, 72),
        [C.ROAD] : C_COLOR.ROAD,
        [C.RESLOW] : C_COLOR.RESLOW,
        [C.INDLOW] : C_COLOR.INDLOW,
        [C.COMLOW] : C_COLOR.COMLOW,
        [C.RESHIG] : C_COLOR.RESHIG,
        [C.INDHIG] : C_COLOR.INDHIG,
        [C.COMHIG] : C_COLOR.COMHIG,
        [C.POWLOW] : C_COLOR.POWLOW,
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
        [C.POWLOW] : 6,
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
        return PSETILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASZONE_TERRAIN_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_TERRAIN_DISPLAY;
    
    public.createTexture = function aszone_terrain_tile_createTexture(id)
    {
        return ASZONE_TILE.createTexture(ASTILE_ID.C_TILE_ZONE.DIRT);
    }
    
    return public;
})();

let ASROAD_CONGESTION_TILE = (function ()
{
    let public = {};
    
    let getColor = PSETILE.getColor;
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_ROAD_CONGESTION;
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
        return PSETILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASROAD_DISPLAY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_ROAD_DISPLAY;
    public.C_TEXTUREENUM = ASTILE_ID.C_TILE_ROAD_DISPLAY_TEXTURE_MAP;
    const C = public.C_TILEENUM;
    
    let getColor = ASTILE.getColor;
    
    let addTileBase = function asroad_display_tile_addTileBase(color)
    {
        let margin = getTextureMargin();
        let height = getTextureHeight();
        let graphics = PSETILE.createTexture(color, margin, height);
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
            graphics.moveTo(0, -H);
            graphics.lineTo(- C_TEXTURE_BASE_SIZE_X / 4 + M / 2, - C_TEXTURE_BASE_SIZE_Y / 4 + M / 2 - H);
        }
        // tr
        if (E)
        {
            graphics.moveTo(0, -H);
            graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 4 - M / 2, - C_TEXTURE_BASE_SIZE_Y / 4 + M / 2 - H);
        }
        // br
        if (S)
        {
            graphics.moveTo(0, -H);
            graphics.lineTo(C_TEXTURE_BASE_SIZE_X / 4 - M / 2, C_TEXTURE_BASE_SIZE_Y / 4 - M / 2 - H);
        }
        // bl
        if (W)
        {
            graphics.moveTo(0, -H);
            graphics.lineTo(- C_TEXTURE_BASE_SIZE_X / 4 + M / 2, C_TEXTURE_BASE_SIZE_Y / 4 - M / 2 - H);
        }
    }
    
    public.createTexture = function asroad_display_tile_createTexture(id)
    {
        let color = ASTILE.C_COLOR.ROAD;
        let graphics = addTileBase(color);
        drawDirection(id, graphics);
        return graphics;
    }
    
    return public;
})();

let ASRICO_DISPLAY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_RICO_DISPLAY;
    
    let getColor = ASTILE.getColor;
    
    const C = ASTILE_ID.C_TILE_ZONE;
    let C_TILE_HEIGHT_BASE = {
        [C.RESLOW] : 3,
        [C.INDLOW] : 6,
        [C.COMLOW] : 3,
        [C.RESHIG] : 9,
        [C.INDHIG] : 9,
        [C.COMHIG] : 6
    };
    let C_TILE_HEIGHT_FACTOR = {
        [C.RESLOW] : 1,
        [C.INDLOW] : 1,
        [C.COMLOW] : 2,
        [C.RESHIG] : 6,
        [C.INDHIG] : 2,
        [C.COMHIG] : 9
    };
    let C_TILE_WIDTH_DIVIDER = {
        [C.RESLOW] : 16,
        [C.INDLOW] : 16,
        [C.COMLOW] : 16,
        [C.RESHIG] : 16,
        [C.INDHIG] : 16,
        [C.COMHIG] : 16,
    };
    let C_TILE_WIDTH_FACTOR = {
        [C.RESLOW] : 4,
        [C.INDLOW] : 8,
        [C.COMLOW] : 6,
        [C.RESHIG] : 6,
        [C.INDHIG] : 10,
        [C.COMHIG] : 8,
    };
    let C_TILE_COLOR = {
        [C.RESLOW] : ASTILE.C_COLOR.RESLOW,
        [C.INDLOW] : ASTILE.C_COLOR.INDLOW,
        [C.COMLOW] : ASTILE.C_COLOR.COMLOW,
        [C.RESHIG] : ASTILE.C_COLOR.RESHIG,
        [C.INDHIG] : ASTILE.C_COLOR.INDHIG,
        [C.COMHIG] : ASTILE.C_COLOR.COMHIG,
    };
    
    let getBaseMargin = function ()
    {
        return 0;
    }
    
    public.getBaseHeight = function asrico_display_tile_getbaseheight()
    {
        return 3;
    }
    
    public.addTileBase = function asrico_display_tile_addtilebase()
    {
        let color = ASTILE.C_COLOR.ROAD;
        let margin = getBaseMargin();
        let height = public.getBaseHeight();
        let graphic = PSETILE.createTexture(color, margin, height);
        return graphic;
    }
    
    public.getDisplayIdZone = function asrico_display_tile_getdisplayidzone(id)
    {
        return (id / ASTILE_ID.C_RICO_DISPLAY_ID_ZONE_DIGIT) | 0;
    }
    
    public.getDisplayIdLevel = function asrico_display_tile_getdisplayidlevel(id)
    {
        return ((id % (10 * ASTILE_ID.C_RICO_DISPLAY_ID_LEVEL_DIGIT)) / ASTILE_ID.C_RICO_DISPLAY_ID_LEVEL_DIGIT) | 0;
    }
    
    public.getDisplayIdVariant = function asrico_display_tile_getdisplayidvariant(id)
    {
        return ((id % (10 * ASTILE_ID.C_RICO_DISPLAY_ID_VARIANT_DIGIT)) / ASTILE_ID.C_RICO_DISPLAY_ID_VARIANT_DIGIT) | 0;
    }
    
    public.createTexture = function (id)
    {
        let C_TEXTURE_BASE_SIZE_X = MMAPRENDER.getTextureBaseSizeX();
        let C_TEXTURE_BASE_SIZE_Y = MMAPRENDER.getTextureBaseSizeY();
        let zone = public.getDisplayIdZone(id);
        let level = public.getDisplayIdLevel(id);
        let variant = public.getDisplayIdVariant(id);
        let graphics = public.addTileBase();
        let baseHeight = public.getBaseHeight();
        let color = C_TILE_COLOR[zone];
        let height = C_TILE_HEIGHT_BASE[zone] + C_TILE_HEIGHT_FACTOR[zone] * level;
        let width = C_TEXTURE_BASE_SIZE_X / C_TILE_WIDTH_DIVIDER[zone] * (C_TILE_WIDTH_FACTOR[zone] + level);
        let cosTable = [1, 0, -1, 0];
        let sinTable = [0, 1, 0, -1];
        let offsetX = cosTable[variant] * (C_TEXTURE_BASE_SIZE_X - width) / 2;
        let offsetY = sinTable[variant] * (C_TEXTURE_BASE_SIZE_Y - width / 2) / 2 - 1;
        PSETILE.drawBlock(graphics, color, offsetX, offsetY - baseHeight, width, width / 2, height);
        return graphics;
    }
    
    return public;
})();

let ASRICO_DENSITY_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_RICO_DENSITY;
    const C = public.C_TILEENUM;
    const C_COLOR = ASTILE.C_COLOR;
    
    let getColor = PSETILE.getColor;
    
    const C_TILETEXTURE = {
        [C.NONE] : [getColor(255, 255, 255), 3],
        [C.ROAD] : [C_COLOR.ROAD, 3],
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
        [C.POWLOW_0] : [C_COLOR.POWLOW, 3],
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
        return PSETILE.createTexture(color, margin, height);
    }
    
    return public;
})();

let ASICON_TILE = (function ()
{
    let public = {};
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_ICON;
    const C = public.C_TILEENUM;
    
    let getColor = PSETILE.getColor;
    
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
        let graphics = PSETILE.createTexture(0xFFFFFF, margin, height);
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