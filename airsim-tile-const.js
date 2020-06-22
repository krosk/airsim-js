

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
    
    return public;
})();