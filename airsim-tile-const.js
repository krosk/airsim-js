
// File must have no other dependencies
let ASTILE_ID = (function ()
{
    let public = {};
    
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
        COMHIG: 29,
        POWLOW: 31,
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
        POWLOW_0: 310,
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
    
    public.C_TILE_ROAD_DISPLAY_TEXTURE_MAP = {
        1000 : "cityTiles_066.png",
        1400 : "cityTiles_082.png",
        1401 : "cityTiles_111.png",
        1402 : "cityTiles_116.png",
        1403 : "cityTiles_126.png",
        1404 : "cityTiles_104.png",
        1405 : "cityTiles_073.png",
        1406 : "cityTiles_124.png",
        1407 : "cityTiles_103.png",
        1408 : "cityTiles_110.png",
        1409 : "cityTiles_125.png",
        1410 : "cityTiles_081.png",
        1411 : "cityTiles_088.png",
        1412 : "cityTiles_122.png",
        1413 : "cityTiles_096.png",
        1414 : "cityTiles_095.png",
        1415 : "cityTiles_089.png"
    };
    
    // rule xxab
    // xx is zone id, from 20 to 3x
    // a is level
    // b is variant
    public.C_RICO_DISPLAY_ID_ZONE_DIGIT = 100;
    public.C_RICO_DISPLAY_ID_LEVEL_DIGIT = 10;
    public.C_RICO_DISPLAY_ID_VARIANT_DIGIT = 1;
    public.C_RICO_DISPLAY_ID_VARIANT_MAX = 1;
    let metaGenerateRicoDisplayId = function astile_metaGen(table, codeBase, variant, densityMin, densityMax)
    {
        for (let j = densityMin; j <= densityMax; j++)
        {
            for (let k = 0; k < variant; k++)
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
    let ricoZone = [
        public.C_TILE_ZONE.RESLOW,
        public.C_TILE_ZONE.RESHIG,
        public.C_TILE_ZONE.INDLOW,
        public.C_TILE_ZONE.INDHIG,
        public.C_TILE_ZONE.COMLOW,
        public.C_TILE_ZONE.COMHIG
    ];
    const RICO_VARIANT = public.C_RICO_DISPLAY_ID_VARIANT_MAX;
    const RICO_DENSITY_MIN = 0;
    const RICO_DENSITY_MAX = 5;
    for (let i = 0; i < ricoZone.length; i++)
    {
        let codeBase = ricoZone[i];
        metaGenerateRicoDisplayId(public.C_TILE_RICO_DISPLAY, codeBase, RICO_VARIANT, RICO_DENSITY_MIN, RICO_DENSITY_MAX);
    }
    metaGenerateRicoDisplayId(public.C_TILE_RICO_DISPLAY, public.C_TILE_ZONE.POWLOW, 0, 0, 0);
    
    return public;
})();
