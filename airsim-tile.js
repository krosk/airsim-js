let ASTILE = (function ()
{
    let public = {};
    
    public.C_TILE_ZONE = {
        NONE: 0,
        DEFAULT: 1,
        DIRT: 1,
        ROAD: 3,
        RESLOW: 10,
        COMLOW: 20,
        INDLOW: 30,
    }
    
    public.C_TILE_ROAD_CONGESTION = {
        NONE: 100,
        LOW: 101,
        MID: 102,
        HIG: 103,
        VHI: 104
    }
    
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
    }
    
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
    }
    
    return public;
})();