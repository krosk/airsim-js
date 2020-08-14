// LOADED BY (worker thread)
//   pse-edit-modules.js
// IS (worker thread)
//   airsim-module.js
// LOADS (worker thread)
//   ???

const G_CHECK = true;
const G_CACHE_NODE = true;

let ASWENGINE = (function ()
{
    let public = {};
    public.EXPORT = {};

    public.C_NAME = 'ASWENGINE';
    
    public.initializeModule = function aswengine_initializeModule(... args)
    {
        ASSTATE.initialize(... args);
        ASZONE.initialize(... args);
        ASRICO.initialize(... args);
    }
    public.EXPORT.initializeModule = public.initializeModule;
    
    public.setZone = function aswengine_setZone(x, y, selectedId)
    {
        if (selectedId == public.V_ZONE.ROAD)
        {
            ASROAD.addRoad(x, y);
        }
        else
        {
            ASROAD.removeRoad(x, y);
        }
        ASZONE.setZone(x, y, selectedId);
    }
    public.EXPORT.setZone = public.setZone;
    
    public.printValue = function aswengine_printValue(value)
    {
        console.log(value);
    }
    public.EXPORT.printValue = public.printValue;
    
    // tiles bank
    public.V_ZONE = function aswengine_v_zone()
    {
        return ASZONE.C_TILEENUM;
    }
    
    public.V_ROAD = function aswengine_v_road()
    {
        return ASROAD.C_TILEENUM;
    }

    return public;
})();

let ASSTATE = (function()
{
    let public = {};
    public.EXPORT = {};
    
    public.C_NAME = "ASSTATE";
    
    let m_wasm;
    
    // map structure
    const C = {
        ZONE_ID : 0,
        CHANGE : 1,
        ZONE_REQUEST : 2,
        ROAD_CONNECT : 3,
        DISPLAY_ID : 4,
        
        PROPERTY_START : 5,
        
        ROAD_CAR_FLOW : 5,
        ROAD_CAR_LAST_FLOW : 6,
        ROAD_TRAVERSAL_PROCESSED : 7,
        ROAD_TRAVERSAL_COST : 8,
        ROAD_TRAVERSAL_PARENT : 9,
        ROAD_DEBUG : 10,
        
        RICO_DENSITY_LEVEL : 5,
        RICO_DEMAND_OFFER_R : 6,
        RICO_DEMAND_OFFER_I : 7,
        RICO_DEMAND_OFFER_C : 8,
        RICO_DEMAND_OFFER_P : 9,
        
        END : 11
    }
    public.C_DATA = C;
    
    const G = {
        SIZE_X : 0,
        SIZE_Y : 1,
        PLAY : 2,
        TICK : 3,
        FRAME : 4,
        TICK_SPEED : 5,
        TICK_PROGRESS : 6,
        RICO_STEP : 7,
        ROAD_TRAVERSAL_START : 8,
        ROAD_TRAVERSAL_LAST : 9,
        ROAD_TRAVERSAL_CURRENT_INDEX : 10,
        ROAD_TRAVERSAL_EDGE_COUNT : 11,
        CHANGE_FIRST : 12,
        CHANGE_LAST : 13,
        STAT_OFFER_R_TOTAL : 14,
        STAT_OFFER_R_TOTAL_LAST : 15,
        STAT_DEMAND_R_TOTAL : 16,
        STAT_DEMAND_R_TOTAL_LAST : 17,
        
        STAT_OFFER_I_TOTAL : 18,
        STAT_OFFER_I_TOTAL_LAST : 19,
        STAT_DEMAND_I_TOTAL : 20,
        STAT_DEMAND_I_TOTAL_LAST : 21,
        
        STAT_OFFER_C_TOTAL : 22,
        STAT_OFFER_C_TOTAL_LAST : 23,
        STAT_DEMAND_C_TOTAL : 24,
        STAT_DEMAND_C_TOTAL_LAST : 25,
        
        STAT_OFFER_P_TOTAL : 26,
        STAT_OFFER_P_TOTAL_LAST : 27,
        STAT_DEMAND_P_TOTAL : 28,
        STAT_DEMAND_P_TOTAL_LAST : 29,
        
        END : 30
    }
    
    public.getIndex = function asstate_getIndex(x, y)
    {
        //return MUTIL.mathCantor(x, y);
        if (x < 0 || x >= public.getTableSizeX() || y < 0 || y >= public.getTableSizeY())
        {
            return -1;
        }
        return x*public.getTableSizeY() + y + 1;
    }
    
    public.getXYFromIndex = function asstate_getXYFromIndex(index)
    {
        //return MUTIL.mathReverseCantorPair(index);
        return public.isValidIndex(index) ? [((index - 1) / public.getTableSizeY()) | 0, (index - 1) % public.getTableSizeY()] : [-1, -1];
    }
    
    let r = function r(index, field)
    {
        return m_wasm.r(index, field);
    }
    
    let w = function w(index, field, data)
    {
        return m_wasm.w(index, field, data);
    }
    
    public.clear = function asstate_clear(index)
    {
        return m_wasm.clear(index);
    }
    
    public.clearProperties = function asstate_clearProperties(index)
    {
        return m_wasm.clearProperties(index);
    }
    
    public.getZoneId = function asstate_getZoneId(index)
    {
        return r(index, C.ZONE_ID);
    }
    
    public.setZoneId = function asstate_setZoneId(index, data)
    {
        w(index, C.ZONE_ID, data);
    }
    
    public.getZoneRequest = function asstate_getZoneRequest(index)
    {
        return r(index, C.ZONE_REQUEST);
    }
    
    public.setZoneRequest = function asstate_setZoneRequest(index, data)
    {
        w(index, C.ZONE_REQUEST, data);
    }
    
    let getChangeFlag = function asstate_getChangeFlag(index) //
    {
        return r(index, C.CHANGE);
    }
    
    let setChangeFlag = function asstate_setChangeFlag(index, data) //
    {
        w(index, C.CHANGE, data);
    }
    
    const roadConnectToFlag = [
        C.ROAD_CONNECT_N,
        C.ROAD_CONNECT_E,
        C.ROAD_CONNECT_S,
        C.ROAD_CONNECT_W,
        C.ROAD_CONNECT_NN,
        C.ROAD_CONNECT_EE,
        C.ROAD_CONNECT_SS,
        C.ROAD_CONNECT_Ww
    ];
    
    public.getRoadConnected = function asstate_getRoadConnected(index)
    {
        return r(index, C.ROAD_CONNECT) > 0;
    }
    
    public.getRoadConnectTo = function asstate_getRoadConnectTo(index, d)
    {
        let mask = 1 << d;
        return r(index, C.ROAD_CONNECT) & mask;
    }
    
    public.setRoadConnectTo = function asstate_setRoadConnectTo(index, d)
    {
        let mask = 1 << d;
        let data = r(index, C.ROAD_CONNECT) | mask;
        w(index, C.ROAD_CONNECT, data);
    }
    
    public.setRoadDisconnectTo = function asstate_setRoadDisconnectTo(index, d)
    {
        let mask = ~(1 << d);
        let data = r(index, C.ROAD_CONNECT) & mask;
        w(index, C.ROAD_CONNECT, data);
    }
    
    public.getDisplayId = function asstate_getDisplayId(index)
    {
        return r(index, C.DISPLAY_ID);
    }
    
    public.setDisplayId = function asstate_setDisplayId(index, data)
    {
        w(index, C.DISPLAY_ID, data);
    }
    
    public.getRoadLastCarFlow = function asstate_getRoadLastCarFlow(index)
    {
        return r(index, C.ROAD_CAR_LAST_FLOW);
    }
    
    public.setRoadLastCarFlow = function asstate_setRoadLastCarFlow(index, data)
    {
        w(index, C.ROAD_CAR_LAST_FLOW, data);
    }
    
    public.getRoadCarFlow = function asstate_getRoadCarFlow(index)
    {
        return r(index, C.ROAD_CAR_FLOW);
    }
    
    public.setRoadCarFlow = function asstate_setRoadCarFlow(index, data)
    {
        w(index, C.ROAD_CAR_FLOW, data);
    }
    
    public.getRoadTraversalProcessed = function asstate_getRoadTraversalProcessed(index)
    {
        return r(index, C.ROAD_TRAVERSAL_PROCESSED);
    }
    
    public.setRoadTraversalProcessed = function asstate_setRoadTraversalProcessed(index, data)
    {
        w(index, C.ROAD_TRAVERSAL_PROCESSED, data);
    }
    
    public.getRoadTraversalCost = function asstate_getRoadTraversalCost(index)
    {
        return r(index, C.ROAD_TRAVERSAL_COST);
    }
    
    public.setRoadTraversalCost = function asstate_setRoadTraversalCost(index, data)
    {
        w(index, C.ROAD_TRAVERSAL_COST, data);
    }
    
    public.getRoadTraversalParent = function asstate_getRoadTraversalParent(index)
    {
        return r(index, C.ROAD_TRAVERSAL_PARENT);
    }
    
    public.setRoadTraversalParent = function asstate_setRoadTraversalParent(index, data)
    {
        w(index, C.ROAD_TRAVERSAL_PARENT, data);
    }
    
    public.getRoadDebug = function asstate_getRoadDebug(index)
    {
        return r(index, C.ROAD_DEBUG);
    }
    
    public.setRoadDebug = function asstate_setRoadDebug(index, data)
    {
        w(index, C.ROAD_DEBUG, data);
    }
    
    public.getRicoDemandOffer = function asstate_getRicoDemandOffer(index)
    {
        let dor = r(index, C.RICO_DEMAND_OFFER_R);
        let doi = r(index, C.RICO_DEMAND_OFFER_I);
        let doc = r(index, C.RICO_DEMAND_OFFER_C);
        let dop = r(index, C.RICO_DEMAND_OFFER_P);
        return [dor, doi, doc, dop];
    }
    
    public.setRicoDemandOffer = function asstate_setRicoDemandOffer(index, demandOffer)
    {
        w(index, C.RICO_DEMAND_OFFER_R, demandOffer[0]);
        w(index, C.RICO_DEMAND_OFFER_I, demandOffer[1]);
        w(index, C.RICO_DEMAND_OFFER_C, demandOffer[2]);
        w(index, C.RICO_DEMAND_OFFER_P, demandOffer[3]);
    }
    
    public.getRicoDensity = function asstate_getRicoDensity(index)
    {
        return r(index, C.RICO_DENSITY_LEVEL);
    }
    
    public.setRicoDensity = function asstate_setRicoDensity(index, data)
    {
        w(index, C.RICO_DENSITY_LEVEL, data);
    }
    
    public.getBuildingData = function asstate_getBuildingData(field, index)
    {
        return r(index, field);
    }
    
    public.setBuildingData = function asstate_setBuildingData(field, index, data)
    {
        w(index, field, data);
    }
    
    public.getTick = function asstate_getTick()
    {
        return r(0, G.TICK);
    }
    
    public.setTick = function asstate_setTick(data)
    {
        w(0, G.TICK, data);
    }
    
    public.getTickSpeed = function asstate_getTickSpeed()
    {
        return r(0, G.TICK_SPEED);
    }
    
    public.setTickSpeed = function asstate_setTickSpeed(data)
    {
        w(0, G.TICK_SPEED, data);
    }
    public.EXPORT.setTickSpeed = public.setTickSpeed;
    
    public.getUnused = function asstate_getUnused()
    {
        return r(0, G.UNUSED);
    }
    
    public.setUnused = function asstate_setUnused(data)
    {
        w(0, G.UNUSED, data);
    }
    
    public.getFrame = function asstate_getFrame()
    {
        return r(0, G.FRAME);
    }
    
    public.setFrame = function asstate_setFrame(data)
    {
        w(0, G.FRAME, data);
    }
    
    public.getPlay = function asstate_getPlay()
    {
        return r(0, G.PLAY);
    }
    
    public.setPlay = function asstate_setPlay(data)
    {
        w(0, G.PLAY, data);
    }
    
    public.getTickProgress = function asstate_getTickProgress()
    {
        return r(0, G.TICK_PROGRESS);
    }
    
    public.setTickProgress = function asstate_setTickProgress(data)
    {
        w(0, G.TICK_PROGRESS, data);
    }
    
    public.getRicoStep = function asstate_getRicoStep()
    {
        return r(0, G.RICO_STEP);
    }
    
    public.setRicoStep = function asstate_setRicoStep(data)
    {
        w(0, G.RICO_STEP, data);
    }
    
    public.getRoadTraversalStart = function asstate_getRoadTraversalStart()
    {
        return r(0, G.ROAD_TRAVERSAL_START);
    }
    
    public.setRoadTraversalStart = function asstate_setRoadTraversalStart(data)
    {
        w(0, G.ROAD_TRAVERSAL_START, data);
    }
    
    public.getRoadTraversalCurrentIndex = function asstate_getRoadTraversalCurrentIndex()
    {
        return r(0, G.ROAD_TRAVERSAL_CURRENT_INDEX);
    }
    
    public.setRoadTraversalCurrentIndex = function asstate_setRoadTraversalCurrentIndex(data)
    {
        w(0, G.ROAD_TRAVERSAL_CURRENT_INDEX, data);
    }
    
    public.getRoadTraversalEdgeCount = function asstate_getRoadTraversalEdgeCount()
    {
        return r(0, G.ROAD_TRAVERSAL_EDGE_COUNT);
    }
    
    public.setRoadTraversalEdgeCount = function asstate_setRoadTraversalEdgeCount(data)
    {
        w(0, G.ROAD_TRAVERSAL_EDGE_COUNT, data);
    }
    
    let getChangeFirst = function asstate_getChangeFirst() //
    {
        return r(0, G.CHANGE_FIRST);
    }
    
    let setChangeFirst = function asstate_setChangeFirst(data) //
    {
        w(0, G.CHANGE_FIRST, data);
    }
    
    let getChangeLast = function asstate_getChangeLast() //
    {
        return r(0, G.CHANGE_LAST);
    }
    
    let setChangeLast = function asstate_setChangeLast(data) //
    {
        w(0, G.CHANGE_LAST, data);
    }
    
    public.getRicoOfferTotal = function asstate_getRicoOfferTotal()
    {
        let ro = r(0, G.STAT_OFFER_R_TOTAL);
        let io = r(0, G.STAT_OFFER_I_TOTAL);
        let co = r(0, G.STAT_OFFER_C_TOTAL);
        let po = r(0, G.STAT_OFFER_P_TOTAL);
        return [ro, io, co, po];
    }
    
    public.setRicoOfferTotal = function asstate_setRicoOfferTotal(data)
    {
        w(0, G.STAT_OFFER_R_TOTAL, data[0]);
        w(0, G.STAT_OFFER_I_TOTAL, data[1]);
        w(0, G.STAT_OFFER_C_TOTAL, data[2]);
        w(0, G.STAT_OFFER_P_TOTAL, data[3]);
    }
    
    public.getRicoOfferTotalLast = function asstate_getRicoOfferTotalLast()
    {
        let ro = r(0, G.STAT_OFFER_R_TOTAL_LAST);
        let io = r(0, G.STAT_OFFER_I_TOTAL_LAST);
        let co = r(0, G.STAT_OFFER_C_TOTAL_LAST);
        let po = r(0, G.STAT_OFFER_P_TOTAL_LAST);
        return [ro, io, co, po];
    }
    
    public.setRicoOfferTotalLast = function asstate_setRicoOfferTotalLast(data)
    {
        w(0, G.STAT_OFFER_R_TOTAL_LAST, data[0]);
        w(0, G.STAT_OFFER_I_TOTAL_LAST, data[1]);
        w(0, G.STAT_OFFER_C_TOTAL_LAST, data[2]);
        w(0, G.STAT_OFFER_P_TOTAL_LAST, data[3]);
    }
    
    public.getRicoDemandTotal = function asstate_getRicoDemandTotal()
    {
        let ro = r(0, G.STAT_DEMAND_R_TOTAL);
        let io = r(0, G.STAT_DEMAND_I_TOTAL);
        let co = r(0, G.STAT_DEMAND_C_TOTAL);
        let po = r(0, G.STAT_DEMAND_P_TOTAL);
        return [ro, io, co, po];
    }
    
    public.setRicoDemandTotal = function asstate_setRicoDemandTotal(data)
    {
        w(0, G.STAT_DEMAND_R_TOTAL, data[0]);
        w(0, G.STAT_DEMAND_I_TOTAL, data[1]);
        w(0, G.STAT_DEMAND_C_TOTAL, data[2]);
        w(0, G.STAT_DEMAND_P_TOTAL, data[3]);
    }
    
    public.getRicoDemandTotalLast = function asstate_getRicoDemandTotalLast()
    {
        let ro = r(0, G.STAT_DEMAND_R_TOTAL_LAST);
        let io = r(0, G.STAT_DEMAND_I_TOTAL_LAST);
        let co = r(0, G.STAT_DEMAND_C_TOTAL_LAST);
        let po = r(0, G.STAT_DEMAND_P_TOTAL_LAST);
        return [ro, io, co, po];
    }
    
    public.setRicoDemandTotalLast = function asstate_setRicoDemandTotalLast(data)
    {
        w(0, G.STAT_DEMAND_R_TOTAL_LAST, data[0]);
        w(0, G.STAT_DEMAND_I_TOTAL_LAST, data[1]);
        w(0, G.STAT_DEMAND_C_TOTAL_LAST, data[2]);
        w(0, G.STAT_DEMAND_P_TOTAL_LAST, data[3]);
    }
    
    public.initialize = function asstate_initialize(tableSizeX, tableSizeY)
    {
        m_wasm = G_WASM_ENGINE.AsState.new();

        public.setTableSize(tableSizeX, tableSizeY);
        public.setPlay(-1);
        public.setTick(0);
        public.setFrame(0);
        public.setTickSpeed(0);
        setChangeFirst(0);
        setChangeLast(0);
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                var index = public.getIndex(x, y);
                public.clear(index);
                setChangeFlag(index, 0);
            }
        }
        public.setRoadTraversalStart(-1);
        public.setRoadTraversalCurrentIndex(-1);
        public.setRoadTraversalEdgeCount(-1);
    }
    
    public.getMaximumValue = function asstate_getMaximumValue()
    {
        return (1 << (8 * Int16Array.BYTES_PER_ELEMENT - 1)) - 1; // Int16Array maximum value
    }
    
    public.setTableSize = function asstate_setTableSize(sizeX, sizeY)
    {
        let totalSize = (G.END + sizeX*sizeY*C.END); //* Int32Array.BYTES_PER_ELEMENT;
        public.setRawData(Int16Array.from(new Array(totalSize)), totalSize);
        public.setTableSizeX(sizeX);
        public.setTableSizeY(sizeY);
    }
    
    public.getTableSizeX = function asstate_getTableSizeX()
    {
        return r(0, G.SIZE_X);
    }
    
    public.setTableSizeX = function asstate_setTableSizeX(data)
    {
        w(0, G.SIZE_X, data);
    }
    
    public.getTableSizeY = function asstate_getTableSizeY()
    {
        return r(0, G.SIZE_Y);
    }
    
    public.setTableSizeY = function asstate_setTableSizeY(data)
    {
        w(0, G.SIZE_Y, data);
    }
    
    public.isValidIndex = function asstate_isValidIndex(index)
    {
        if (typeof index == 'undefined' || index == null)
        {
            throw 'undefined index';
        }
        let isOutOfBound = index <= 0 || index > public.getTableSizeX() * public.getTableSizeY();
        return !isOutOfBound;
    }
    
    public.isValidCoordinates = function asstate_isValidCoordinates(tileX, tileY)
    {
        let isOutOfBound = tileX < 0 || tileX >= public.getTableSizeX() || tileY < 0 || tileY >= public.getTableSizeY();
        return !isOutOfBound;
    }
    
    let replaceChangeFirst = function asstate_replaceChangeFirst(newIndex) //
    {
        setChangeFirst(newIndex);
        setChangeLast(newIndex);
        setChangeFlag(newIndex, newIndex);
    }
    
    let replaceChangeLast = function asstate_replaceChangeLast(newIndex) //
    {
        let lastIndex = getChangeLast();
        setChangeFlag(lastIndex, newIndex);
        setChangeFlag(newIndex, newIndex);
        setChangeLast(newIndex);
    }
    
    public.notifyChange = function asstate_notifyChange(newIndex) //
    {
        return m_wasm.notifyChange(newIndex);
        let firstIndex = getChangeFirst();
        if (firstIndex > 0)
        {
            let middleIndex = getChangeFlag(newIndex);
            if (middleIndex > 0 && middleIndex != newIndex)
            {
                
            }
            else
            {
                replaceChangeLast(newIndex);
            }
        }
        else
        {
            replaceChangeFirst(newIndex);
        }
    }
    
    public.retrieveChange = function asstate_retrieveChange() //
    {
        return m_wasm.retrieveChange();
        let firstIndex = getChangeFirst();
        let lastIndex = getChangeLast();
        if (firstIndex > 0 && lastIndex > 0 && firstIndex == lastIndex)
        {
            setChangeFirst(0);
            setChangeLast(0);
            setChangeFlag(firstIndex, 0);
        }
        else if (firstIndex > 0)
        {
            let nextIndex = getChangeFlag(firstIndex);
            setChangeFirst(nextIndex);
            if (G_CHECK && nextIndex == 0)
            {
                throw 'nextIndex 0';
            }
            setChangeFlag(firstIndex, 0);
        }
        return firstIndex;
    }
    
    public.getSerializable = function asstate_getSerializable()
    {
        return m_wasm.getSerializable();
    }
    public.EXPORT.getSerializable = public.getSerializable;
    
    public.setSerializable = function asstate_setSerializable(string)
    {
        let array = JSON.parse(string);
        public.setRawData(Int16Array.from(array), array.length);
        ASROAD.resetInternal();
    }
    public.EXPORT.setSerializable = public.setSerializable;

    public.setRawData = function asstate_setRawData(array, arraySize)
    {
        return m_wasm.setRawData(array, arraySize);
        setRawDataSize(arraySize);
        for (let i = 0; i < arraySize; i++)
        {
            setRawDataValue(i, array[i]);
        }
    }

    let setRawDataSize = function asstate_setRawDataSize(arraySize)
    {
        return m_wasm.setRawDataSize(arraySize);
    }
    let setRawDataValue = function asstate_setRawDataValue(index, value)
    {
        return m_wasm.setRawDataValue(index, value);
    }
    
    return public;
})();

// ---------------------
let ASZONE = (function ()
{
    let public = {};
    public.EXPORT = {};
    
    public.C_NAME = 'ASZONE';
    
    public.C_TYPE = {
        NONE: 0,
        ROAD: 1,
        BUILDING: 2
    }
    
    public.C_TILEENUM = ASTILE_ID.C_TILE_ZONE;
    const C_TERRAIN_DISPLAY = ASTILE_ID.C_TILE_TERRAIN_DISPLAY;
    const C = public.C_TILEENUM;
    
    let isValidZone = function aszone_isValidZone(id)
    {
        let index = Object.values(C).indexOf(id);
        return index > -1;
    }
    
    // -------------
    public.initialize = function aszone_initialize()
    {
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                let defaultId = C.DEFAULT;
                paintZone(x, y, defaultId);
            }
        }
    }

    public.getDataIdByZone = function aszone_getDataIdByZone(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C.NONE;
        }
        const index = ASSTATE.getIndex(x, y);
        return ASSTATE.getZoneId(index);
    }
    
    public.getDataIdByDisplay = function aszone_getDataIdByDisplay(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C.NONE;
        }
        const index = ASSTATE.getIndex(x, y);
        let displayId = ASSTATE.getDisplayId(index);
        return displayId;
    }
    
    let isRicoZone = function aszone_isRicoZone(zone)
    {
        return (zone == C.RESLOW ||
            zone == C.RESHIG ||
            zone == C.COMLOW ||
            zone == C.COMHIG ||
            zone == C.INDLOW ||
            zone == C.INDHIG ||
            zone == C.POWLOW);
    }
    
    let clearZone = function aszone_clearZone(x, y)
    {
        const oldZone = public.getDataIdByZone(x, y);
        if (oldZone == C.ROAD)
        {
            ASROAD.removeRoad(x, y);
        }
        else if (isRicoZone(oldZone))
        {
            ASRICO.removeRico(x, y);
        }
        let index = ASSTATE.getIndex(x, y);
        ASSTATE.notifyChange(index);
    }
    
    let paintZone = function aszone_paintZone(x, y, zone)
    {
        const index = ASSTATE.getIndex(x, y);
        ASSTATE.clearProperties(index);
        ASSTATE.setZoneId(index, zone);
        // update other systems
        if (zone == C.ROAD)
        {
            ASROAD.addRoad(x, y);
        }
        else if (isRicoZone(zone))
        {
            ASRICO.addRicoInitial(zone, x, y);
        }
        else if (zone == C.DIRT)
        {
            ASSTATE.setDisplayId(index, C_TERRAIN_DISPLAY.DIRT_0);
        }
    }
    
    let applyZoneRequest = function aszone_applyZoneRequest(index)
    {
        let zone = ASSTATE.getZoneRequest(index);
        ASSTATE.setZoneRequest(index, 0);
        if (zone <= 0 || !isValidZone(zone))
        {
            return;
        }
        let xy = ASSTATE.getXYFromIndex(index);
        let x = xy[0];
        let y = xy[1];
        const oldZone = public.getDataIdByZone(x, y);
        let differentZone = (oldZone != zone);
        if (differentZone)
        {
            clearZone(x, y);
            paintZone(x, y, zone);
        }
    }
    
    public.setZone = function aszone_setZone(x, y, zone)
    {
        if (!isValidZone(zone))
        {
            return;
        }
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return;
        }
        let index = ASSTATE.getIndex(x, y);
        ASSTATE.setZoneRequest(index, zone);
    }
    
    let m_lastTickTime = 0;
    
    public.update = function aszone_update(timeLimit, time)
    {
        const tickSpeed = ASSTATE.getTickSpeed();
        const tick = ASSTATE.getTick();
        if (tickSpeed == -1)
        {
            return tick;
        }
        const frame = ASSTATE.getFrame();
        let engineComplete = true;
        engineComplete &= engineComplete ? public.updateZone(tick, timeLimit) : false;
        engineComplete &= engineComplete ? ASROAD.updateRoad(tick, timeLimit) : false;
        engineComplete &= engineComplete ? ASRICO.updateRico(tick, timeLimit) : false;
        const enoughTimeElapsed = Math.abs(time - m_lastTickTime) >= tickSpeed;
        if (engineComplete && enoughTimeElapsed)
        {
            let newTick = tick + 1;
            commitStats();
            ASRICO.setNextTick(newTick);
            ASSTATE.setTick(newTick);
            ASSTATE.setFrame(0);
            m_lastTickTime = time;
        }
        else if (!engineComplete)
        {
            ASSTATE.setFrame(frame + 1);
        }
        return tick;
    }
    public.EXPORT.update = public.update;
    
    let commitStats = function aszone_commitStats()
    {
        let offerData = ASSTATE.getRicoOfferTotal();
        ASSTATE.setRicoOfferTotalLast(offerData);
        ASSTATE.setRicoOfferTotal([0, 0, 0, 0]);
        let demandData = ASSTATE.getRicoDemandTotal();
        ASSTATE.setRicoDemandTotalLast(demandData);
        ASSTATE.setRicoDemandTotal([0, 0, 0, 0]);
    }
    
    public.updateZone = function aszone_updateZone(tick, timeLimit)
    {
        // Tick progress is the indicator
        // that buildings have been checked
        // in the current tick
        let progress = ASSTATE.getTickProgress();
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tableSize = tableSizeX * tableSizeY;
        let elapsedCycle = 0;
        let tickSpeed = ASSTATE.getTickSpeed();
        // polling mode
        while ((progress < tableSize) && (timeLimit < 0 || Date.now() < timeLimit))
        {
            let index = progress + 1;
            applyZoneRequest(index);
            progress += 1;
            elapsedCycle += 1;
            if (tickSpeed > 1000) // exception case
            {
                //console.log(progress);
                break;
            }
        }
        ASSTATE.setTickProgress(progress);
        let complete = progress >= tableSize;
        return complete;
    }
    
    public.setPreset = function aszone_setPreset()
    {
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                let roadId = C.ROAD;
                let resId = C.RESLOW;
                let comId = C.COMLOW;
                let indId = C.INDLOW;
                if (x % 5 == 0 || y % 5 == 0)
                {
                    paintZone(x, y, roadId);
                }
                else if (x < 5)
                {
                    paintZone(x, y, resId)
                }
                else if (x < 10)
                {
                    paintZone(x, y, comId);
                }
                else if (x < 15)
                {
                    paintZone(x, y, indId);
                }
            }
        }
    }
    public.EXPORT.setPreset = public.setPreset;
    
    public.getInfoZone = function aszone_getInfoZone()
    {
        return ASSTATE.getRicoOfferTotalLast() + ' ' + ASSTATE.getRicoDemandTotalLast();
    }
    public.EXPORT.getInfoZone = public.getInfoZone;
    
    return public;
})();

let ASROAD = (function ()
{
    let public = {};
    public.EXPORT = {};
    
    public.C_NAME = 'ASROAD';
    
    // connected: [] cantor index
    
    const C_TO = {
        N: 0,
        E: 1,
        S: 2,
        W: 3,
        NN: 4,
        EE: 5,
        SS: 6,
        WW: 7
    };
    const C_FROM = [2, 3, 0, 1, 6, 7, 4, 5];
    const C_DISPLAY = ASTILE_ID.C_TILE_ROAD_DISPLAY;
    const C_CONGESTION = ASTILE_ID.C_TILE_ROAD_CONGESTION;
    const C_ZONE = ASTILE_ID.C_TILE_ZONE;
    
    const C_ZONE_ROAD = {
        [C_ZONE.PATH] : true,
        [C_ZONE.ROAD] : true,
        [C_ZONE.HIGHWAY] : true
    }
    
    // in m/s
    const C_TYPE_SPEED = {
        [C_ZONE.PATH] : 5,
        [C_ZONE.ROAD] : 14,
        [C_ZONE.HIGHWAY] : 25
    }
    
    const C_TYPE_LANE = {
        [C_ZONE.PATH] : 1,
        [C_ZONE.ROAD] : 1,
        [C_ZONE.HIGHWAY] : 3
    }
    
    const C_DAY_DURATION = 3600; // s
    const C_TILE_LENGTH = 16; // m
    const C_MAX_SPEED = 50; // m / s
    const C_INTER_CAR = 1; // s
    const C_CAR_LENGTH = 4; // m
    
    // ----------------
    
    let C_DEBUG_TRAVERSAL = true;
    
    let getRoadType = function asroad_getRoadType(index)
    {
        let zoneId = ASSTATE.getZoneId(index);
        let type = C_ZONE_ROAD[zoneId];
        if (G_CHECK && (type == null))
        {
            throw 'zone ' + zoneId + ' at ' + index + ' is not a road';
        }
        return zoneId;
    }
    
    let changeDataIndex = function asroad_changeDataIndex(index)
    {
        ASSTATE.notifyChange(index);
    }
    
    let changeTraversalIndex = function asroad_changeTraversalIndex(index)
    {
        if (C_DEBUG_TRAVERSAL)
        {
            ASSTATE.notifyChange(index);
        }
    }
    
    // for display
    public.getDataIdByCongestion = function asroad_getTileByCongestion(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C_CONGESTION.NONE;
        }
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return C_CONGESTION.NONE;
        }
        let ratio = getRoadLastCarFlowRatio(index);
        if (ratio < 0.5)
        {
            return C_CONGESTION.LOW;
        }
        else if (ratio < 0.75)
        {
            return C_CONGESTION.MID;
        }
        else if (ratio < 1)
        {
            return C_CONGESTION.HIG;
        }
        else if (ratio >= 1)
        {
        	return C_CONGESTION.VHI;
        }
        else
        {
        	return C_CONGESTION.NONE;
        }
    }
    
    public.getDataIdByTraversalState = function asroad_getTileByTraversalState(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C_CONGESTION.NONE;
        }
        let index = ASSTATE.getIndex(x, y);
        let value = hasRoad(index) ? ASSTATE.getRoadDebug(index) : 0;
        if (value >= 104)
        {
            return C_CONGESTION.VHI;
        }
        else if (value >= 103)
        {
            return C_CONGESTION.HIG; // in queue and processed
        }
        else if (value >= 102)
        {
            return C_CONGESTION.MID; // current
        }
        else if (value >= 101)
        {
        	return C_CONGESTION.LOW; // in queue
        }
        else if (value >= 0)
        {
        	return C_CONGESTION.NONE; // unexplored
        }
        else
        {
            console.log('getTileByTraversalState error ' + index);
        }
    }
    
    let getIndexTo = function asroad_getIndexTo(x, y, d)
    {
        const C_XOFFSET = [-1, 0, 1, 0, -2, 0, 2, 0];
        const C_YOFFSET = [0, -1, 0, 1, 0, -2, 0, 2];
        let xd = x + C_XOFFSET[d];
        let yd = y + C_YOFFSET[d];
        let to = ASSTATE.getIndex(xd, yd);
        return to;
    }
    
    let connectDisplayId = function asroad_connectDisplayId(index, d)
    {
        let displayId = ASSTATE.getDisplayId(index);
        let roadFlag = displayId % 100; // astile
        let roadDisplayIdBase = displayId - roadFlag;
        roadFlag |= (1 << d);
        ASSTATE.setDisplayId(index, roadDisplayIdBase + roadFlag);
        ASSTATE.notifyChange(index);
    }
    
    let disconnectDisplayId = function asroad_disconnectDisplayId(index, d)
    {
        if (d >= 4)
        {
            return;
        }
        let displayId = ASSTATE.getDisplayId(index);
        let roadFlag = displayId % ASTILE_ID.C_TILE_DISPLAY_BASE_MODULO;
        let newRoadFlag = roadFlag;
        let roadDisplayIdBase = displayId - roadFlag;
        newRoadFlag &= ~(1 << d);
        let newDisplayId = roadDisplayIdBase + newRoadFlag;
        ASSTATE.setDisplayId(index, newDisplayId);
        ASSTATE.notifyChange(index);
    }
    
    let connectRoadToRoad = function asroad_connectRoadToRoad(x, y, d)
    {
        let from = ASSTATE.getIndex(x, y);
        let to = getIndexTo(x, y, d);
        //console.log('connectnode x'+x+'y'+y+'xd'+xd+'yd'+yd);
        if (hasRoad(from) && hasRoad(to))
        {
            ASSTATE.setRoadConnectTo(from, d);
            ASSTATE.setRoadConnectTo(to, C_FROM[d]);
            connectDisplayId(from, d);
            connectDisplayId(to, C_FROM[d]);
        }
    }
    
    let connectRoadToBuilding = function asroad_connectRoadToBuilding(x, y, d)
    {
        let from = ASSTATE.getIndex(x, y);
        let to = getIndexTo(x, y, d);
        if (hasRoad(from) && ASRICO.hasBuilding(to))
        {
            ASSTATE.setRoadConnectTo(to, C_FROM[d]);
        }
        if (ASRICO.hasBuilding(from) && hasRoad(to))
        {
            ASSTATE.setRoadConnectTo(from, d);
        }
    }
    
    let disconnectNodes = function asroad_disconnectNodes(x, y, d)
    {
        let from = ASSTATE.getIndex(x, y);
        let to = getIndexTo(x, y, d);
        if (!ASSTATE.isValidIndex(to))
        {
            return;
        }
        // note: disconnect only if to is valid
        // even if it has no road
        if (hasRoad(from) || ASRICO.hasBuilding(from))
        {
            ASSTATE.setRoadDisconnectTo(from, d);
            disconnectDisplayId(from, d);
        }
        if (hasRoad(to) || ASRICO.hasBuilding(to))
        {
            ASSTATE.setRoadDisconnectTo(to, C_FROM[d]);
            disconnectDisplayId(to, C_FROM[d]);
        }
    }
    
    public.hasRoad = function asroad_hasRoad(index)
    {
        //let index = ASSTATE.getIndex(x, y);
        return hasRoad(index);
    }
    let hasRoad = function asroad_hasRoad(index)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return false;
        }
        let zoneId = ASSTATE.getZoneId(index);
        let type = C_ZONE_ROAD[zoneId];
        // no need to check for undefined
        return type != null;
    }
    
    let isConnectedTo = function asroad_isConnectedTo(from, d)
    {
        if (!(hasRoad(from) || ASRICO.hasBuilding(from)))
        {
            return -1;
        }
        let connected = ASSTATE.getRoadConnectTo(from, d);
        if (!connected)
        {
            return -1;
        }
        let xy = ASSTATE.getXYFromIndex(from);
        let x = xy[0];
        let y = xy[1];
        let to = getIndexTo(x, y, d);
        if (!(hasRoad(to) || ASRICO.hasBuilding(to)))
        {
            return -1;
        }
        //console.log('isConnectedTo f' + from + 't' + to + 'c' + m_network[from].connectTo);
        return to;
    }
    
    public.connectAll = function asroad_connectAll(x, y)
    {
        connectRoadToRoad(x, y, C_TO.N);
        connectRoadToRoad(x, y, C_TO.E);
        connectRoadToRoad(x, y, C_TO.S);
        connectRoadToRoad(x, y, C_TO.W);
        connectRoadToBuilding(x, y, C_TO.N);
        connectRoadToBuilding(x, y, C_TO.E);
        connectRoadToBuilding(x, y, C_TO.S);
        connectRoadToBuilding(x, y, C_TO.W);
        connectRoadToBuilding(x, y, C_TO.NN);
        connectRoadToBuilding(x, y, C_TO.EE);
        connectRoadToBuilding(x, y, C_TO.SS);
        connectRoadToBuilding(x, y, C_TO.WW);
    }
    
    public.disconnectAll = function asroad_disconnectAll(x, y)
    {
        disconnectNodes(x, y, C_TO.N);
        disconnectNodes(x, y, C_TO.E);
        disconnectNodes(x, y, C_TO.S);
        disconnectNodes(x, y, C_TO.W);
        disconnectNodes(x, y, C_TO.NN);
        disconnectNodes(x, y, C_TO.EE);
        disconnectNodes(x, y, C_TO.SS);
        disconnectNodes(x, y, C_TO.WW);
    }
    
    public.addRoad = function asroad_addRoad(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return;
        }
        let index = ASSTATE.getIndex(x, y);
        //if (!hasRoad(index))
        {
            ASSTATE.setRoadLastCarFlow(index, 0);
            ASSTATE.setRoadCarFlow(index, 0);
            ASSTATE.setRoadDebug(index, C_CONGESTION.LOW);
            ASSTATE.setDisplayId(index, C_DISPLAY.____);
            m_cacheNodeRefresh = true;
            // traversal v2 related
            ASSTATE.setRoadTraversalCost(index, 0);
        }
        public.disconnectAll(x, y);
        public.connectAll(x, y);
    }

    public.removeRoad = function asroad_removeRoad(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return;
        }
        public.disconnectAll(x, y);
        m_cacheNodeRefresh = true;
    }
    public.EXPORT.removeRoad = public.removeRoad;
    
    public.updateRoad = function asroad_updateRoad(tick, timeLimit)
    {
        // Tick progress is the indicator
        // that buildings have been checked
        // in the current tick
        let progress = ASSTATE.getTickProgress();
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tableSize = tableSizeX * tableSizeY;
        let elapsedCycle = 0;
        let tickSpeed = ASSTATE.getTickSpeed();
        // polling mode
        while ((progress - tableSize < tableSize) && (timeLimit < 0 || Date.now() < timeLimit))
        {
            let index = progress - tableSize + 1;
            updateRoadTile(index);
            progress += 1;
            elapsedCycle += 1;
            if (hasRoad(index) && tickSpeed > 1000) // exception case
            {
                break;
            }
        }
        ASSTATE.setTickProgress(progress);
        let complete = progress - tableSize >= tableSize;
        return complete;
    }
    
    let updateRoadTile = function asroad_updateRoadTilr(index)
    {
        if (!hasRoad(index))
        {
            return;
        }
        let ratio = getRoadTrafficDecay(index)
        let carFlow = ASSTATE.getRoadCarFlow(index);
        ASSTATE.setRoadLastCarFlow(index, carFlow);
        let newCarFlow = (carFlow * (1 - ratio)) | 0;
        if (newCarFlow < 1)
        {
            newCarFlow = 0;
        }
        ASSTATE.setRoadCarFlow(index, newCarFlow);
        if (carFlow != newCarFlow)
        {
            changeDataIndex(index);
        }
        return;
    }
    
    let getRoadMaximumCarFlow = function asroad_getRoadMaximumCarFlow(index)
    {
        //LC * (TD - TL / TS) / (CL / SP + IC)
        let type = getRoadType(index);
        let maxSpeed = C_TYPE_SPEED[type];
        let laneCount = C_TYPE_LANE[type];
        let maxFlow = laneCount * C_DAY_DURATION / (C_CAR_LENGTH / maxSpeed + C_INTER_CAR);
        return maxFlow;
    }
    
    let getRoadSpeed = function asroad_getRoadSpeed(index)
    {
        // LN * TL / TC / IC
        let type = getRoadType(index);
        let maxSpeed = C_TYPE_SPEED[type];
        let ratio = getRoadCarFlowRatio(index);
        return ratio >= 1 ? 0 : maxSpeed | 0;
    }
    
    let getRoadCarFlowRatio = function asroad_getRoadCarFlowRatio(index)
    {
        let type = getRoadType(index);
        let maxFlow = getRoadMaximumCarFlow(index);
        let currentFlow = ASSTATE.getRoadCarFlow(index);
        let ratio = currentFlow / maxFlow;
        return ratio >= 1 ? 1 : ratio;
    }
    
    let getRoadLastCarFlowRatio = function asroad_getRoadLastCarFlowRatio(index)
    {
        let type = getRoadType(index);
        let maxFlow = getRoadMaximumCarFlow(index);
        let lastFlow = ASSTATE.getRoadLastCarFlow(index);
        let ratio = lastFlow / maxFlow;
        return ratio >= 1 ? 1 : ratio;
    }
    
    let getRoadTrafficDecay = function asroad_getRoadTrafficDecay(index)
    {
        // LN / TF / IC * TD
        let type = getRoadType(index);
        let laneCount = C_TYPE_LANE[type];
        let carFlow = ASSTATE.getRoadCarFlow(index);
        let decay = (laneCount / carFlow / C_INTER_CAR * C_DAY_DURATION);
        return decay;
    }
    
    public.addCongestion = function asroad_addCongestion(x, y, additionalCarFlow)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!ASSTATE.isValidIndex(index))
        {
            return;
        }
        let carFlow = ASSTATE.getRoadCarFlow(index);
        carFlow += additionalCarFlow | 0;
        if (carFlow > ASSTATE.getMaximumValue())
        {
            carFlow = ASSTATE.getMaximumValue();
            console.log(carFlow);
        }
        ASSTATE.setRoadCarFlow(index, carFlow);
    }
    
    // struct is
    // array = [
    //   from of starting point
    //   last explored index,
    //   number of edges,
    //   collection of edges * 5
    //   ]
    let getTraversalStart = function asroad_getTraversalStart()
    {
        return ASSTATE.getRoadTraversalStart();
    }
    let setTraversalStart = function asroad_setTraversalStart(value)
    {
        ASSTATE.setRoadTraversalStart(value);
    }
    let getTraversalCurrentIndex = function asroad_getTraversalCurrentIndex()
    {
        return ASSTATE.getRoadTraversalCurrentIndex();
    }
    let setTraversalCurrentIndex = function asroad_setTraversalCurrentIndex(value)
    {
        ASSTATE.setRoadTraversalCurrentIndex(value);
    }
    let getTraversalEdgeCount = function asroad_getTraversalEdgeCount()
    {
        return ASSTATE.getRoadTraversalEdgeCount();
    }
    let setTraversalEdgeCount = function asroad_setTraversalEdgeCount(value)
    {
        ASSTATE.setRoadTraversalEdgeCount(value);
    }
    let incrementTraversalEdgeCount = function asroad_incrementTraversalEdgeCount()
    {
        setTraversalEdgeCount(getTraversalEdgeCount() + 1);
    }
    let getTraversalCost = function asroad_getTraversalCost(node)
    {
        return ASSTATE.getRoadTraversalCost(node);
    }
    let setTraversalCost = function asroad_setTraversalCost(node, value)
    {
        if (value > ASSTATE.getMaximumValue())
        {
            value = ASSTATE.getMaximumValue();
        }
        ASSTATE.setRoadTraversalCost(node, value);
    }
    let setTraversalAdded = function asroad_setTraversalAdded(node)
    {
        ASSTATE.setRoadTraversalProcessed(node, 1);
    }
    let setTraversalProcessed = function asroad_setTraversalProcessed(node)
    {
        ASSTATE.setRoadTraversalProcessed(node, 2);
    }
    let setTraversalProcessedNot = function asroad_setTraversalProcessedNot(node)
    {
        ASSTATE.setRoadTraversalProcessed(node, 0);
    }
    let isTraversalProcessedNot = function asroad_isTraversalProcessedNot(node)
    {
        let v = ASSTATE.getRoadTraversalProcessed(node);
        return v != 1 && v != 2; // warning, 0 is not a better indicator
    }
    let isTraversalAdded = function asroad_isTraversalAdded(node)
    {
        return ASSTATE.getRoadTraversalProcessed(node) == 1;
    }
    let isTraversalProcessed = function asroad_isTraversalProcessed(node)
    {
        return ASSTATE.getRoadTraversalProcessed(node) == 2;
    }
    let getTraversalParent = function asroad_getTraversalParent(node)
    {
        return ASSTATE.getRoadTraversalParent(node);
    }
    let setTraversalParent = function asroad_setTraversalParent(node, value)
    {
        ASSTATE.setRoadTraversalParent(node, value);
    }
    let clearTraversal = function asroad_clearTraversal(node, index)
    {
        setTraversalProcessedNot(node, index);
        setTraversalParent(node, -1);
        setTraversalCost(node, 0);
        changeTraversalIndex(node);
    }
    
    public.initializeTraversal = function asroad_initializeTraversal(fromX, fromY)
    {
        let from = ASSTATE.getIndex(fromX, fromY);
        setTraversalStart(from);
        setTraversalCurrentIndex(-1);
        setTraversalEdgeCount(0);
        if (ASRICO.hasBuilding(from))
        {
            let nodeIndex = getTraversalEdgeCount();
            incrementTraversalEdgeCount();
            setTraversalCurrentIndex(from);
            //let cost = getTraversalCostIncrease(from);
            //setTraversalCost(from, cost);
            //setTraversalParent(from, -1);
            //setTraversalProcessed(from);
            expandTraversal(from, isConnectedTo(from, C_TO.N));
            expandTraversal(from, isConnectedTo(from, C_TO.E));
            expandTraversal(from, isConnectedTo(from, C_TO.S));
            expandTraversal(from, isConnectedTo(from, C_TO.W));
            expandTraversal(from, isConnectedTo(from, C_TO.NN));
            expandTraversal(from, isConnectedTo(from, C_TO.EE));
            expandTraversal(from, isConnectedTo(from, C_TO.SS));
            expandTraversal(from, isConnectedTo(from, C_TO.WW));
            //ASSTATE.setRoadDebug(from, C.HIG);
            //changeTraversalIndex(from);
            m_cacheNodeRefresh = true;
        }
    }
    public.EXPORT.initializeTraversal = public.initializeTraversal;
    
    const C_TR = {
        FROM: 1,
        COST: 2,
        PARENT: 3,
        PROCESSED: 4
    };
    
    let getTraversalCostIncrease = function asroad_getTraversalCostIncrease(roadIndex)
    {
        let speed = getRoadSpeed(roadIndex);
        return speed > 0 ? 200 / speed : ASSTATE.getMaximumValue();
    }
    
    let expandTraversal = function asroad_expandTraversal(parent, node)
    {
        //console.log('expandTraversal f' + parent + 't' + node);
        if (hasRoad(node))
        {
            let currentCost = getTraversalCostIncrease(node);
            if (parent >= 0 && hasRoad(parent))
            {
                let previousCost = getTraversalCost(parent);
                currentCost += previousCost;
            }
            let edgeIndex = getTraversalEdgeCount();
            incrementTraversalEdgeCount();
            setTraversalCost(node, currentCost);
            setTraversalParent(node, parent);
            setTraversalAdded(node);
            ASSTATE.setRoadDebug(node, C_CONGESTION.MID);
            changeTraversalIndex(node);
            if (G_CACHE_NODE)
            {
                m_cacheNodeList.push(node);
            }
        }
    }
    
    let addToNodeList = function asroad_addToNodeList(parentNode, dir, nodeList)
    {
        let childNode = isConnectedTo(parentNode, dir);
        if (!hasRoad(childNode))
        {
            return;
        }
        let isParentNode = getTraversalParent(childNode) == parentNode;
        if (!isParentNode)
        {
            return;
        }
        nodeList.push(childNode);
    }
    
    let m_cacheNodeList = [];
    let m_cacheNodeRefresh = true;
   
    let getCurrentNodeList = function asroad_getCurrentNodeList()
    {
        if (m_cacheNodeRefresh == false && G_CACHE_NODE)
        {
            //console.log(m_cacheNodeList);
            return m_cacheNodeList;
        }
        let startNode = getTraversalStart();
        m_cacheNodeList = [startNode];
        let i = 0;
        while (i < m_cacheNodeList.length)
        {
            let parentNode = m_cacheNodeList[i];
            addToNodeList(parentNode, C_TO.N, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.E, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.S, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.W, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.NN, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.EE, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.SS, m_cacheNodeList);
            addToNodeList(parentNode, C_TO.WW, m_cacheNodeList);
            i++;
        }
        //console.log(m_cacheNodeList);
        m_cacheNodeRefresh = false;
        return m_cacheNodeList;
    }
    
    let identifyNextNode = function asroad_identifyNextNode()
    {
        const nodeList = getCurrentNodeList();
        let nodeCount = nodeList.length;
        let minCost = -1;
        let minNode = -1;
        // skip the first node = a building
        for (let i = 1; i < nodeCount; i++)
        {
            let node = nodeList[i];
            let localCost = getTraversalCost(node);
            let isAdded = isTraversalAdded(node);
            if (isAdded && (minNode == -1 || localCost <= getTraversalCost(minNode)))
            {
                minNode = node;
                minCost = localCost;
            }
        }
        return minNode;
    }
    
    let traverseNextNode = function (node)
    {
        if (!hasRoad(node))
        {
            console.log('traversal wrong target');
            throw 'traversal wrong target';
            return [-1, -1];
        }
        setTraversalCurrentIndex(node);
        setTraversalProcessed(node);
        let expandIfNotTraversed = function (from, d)
        {
            let to = isConnectedTo(from, d);
            if (to >= 0)
            {
                let isProcessedNot = isTraversalProcessedNot(to);
                if (isProcessedNot)
                {
                    expandTraversal(from, to);
                }
                else
                {
                    // reached by another tile
                    // in theory, the other tile is
                    // the fastest way to reach toTo 
                    // so no need to expand, except
                    // if congestion of already
                    // traversed tiles have been
                    // altered
                    //console.log('Already reached by another ' + toTo);
                }
            }
        }
        ASSTATE.setRoadDebug(node, C_CONGESTION.HIG);
        expandIfNotTraversed(node, C_TO.N);
        expandIfNotTraversed(node, C_TO.E);
        expandIfNotTraversed(node, C_TO.S);
        expandIfNotTraversed(node, C_TO.W);
        expandIfNotTraversed(node, C_TO.NN);
        expandIfNotTraversed(node, C_TO.EE);
        expandIfNotTraversed(node, C_TO.SS);
        expandIfNotTraversed(node, C_TO.WW);
        changeTraversalIndex(node);
        return ASSTATE.getXYFromIndex(node);
    }
    
    public.getNextStepTraversal = function asroad_getNextStepTraversal()
    {
        // start explore
        let minNode = identifyNextNode();
        if (minNode > 0)
        {
            return traverseNextNode(minNode);
        }
        else
        {
            //console.log('end');
            return [-1, -1];
        }
    }
    public.EXPORT.getNextStepTraversal = public.getNextStepTraversal;
    
    public.getTraversalPath = function asroad_getTraversalPath()
    {
        let lastNode = getTraversalCurrentIndex();
        if (!ASSTATE.isValidIndex(lastNode))
        {
            console.log('invalid');
            return [-1, -1];
        }
        else
        {
            let reversePathNode = [];
            while (!ASRICO.hasBuilding(lastNode))
            {
                reversePathNode.push(lastNode);
                lastNode = getTraversalParent(lastNode);
            }
            //reversePathNode.push(node);
            let pathNodeXY = [];
            while (reversePathNode.length > 0)
            {
                let node = reversePathNode.pop();
                let xy = ASSTATE.getXYFromIndex(node);
                pathNodeXY.push(xy[0]);
                pathNodeXY.push(xy[1]);
            }
            return pathNodeXY;
        }
    }
    public.EXPORT.getTraversalPath = public.getTraversalPath;
    
    public.resetTraversalPath = function asroad_resetTraversalPath()
    {
        let nodeList = getCurrentNodeList();
        let edgeCount = nodeList.length;
        // first index is building
        for (let i = 1; i < edgeCount; i++)
        {
            let node = nodeList[i];
            if (hasRoad(node))
            {
                ASSTATE.setRoadDebug(node, C_CONGESTION.LOW);
                changeTraversalIndex(node);
            }
            clearTraversal(node, i);
        }
        m_cacheNodeRefresh = true;
    }
    public.EXPORT.resetTraversalPath = public.resetTraversalPath;
    
    public.resetInternal = function asroad_resetInternal()
    {
        m_cacheNodeRefresh = true;
    }
    
    public.printTraversal = function asroad_printTraversal()
    {
        console.log();
        //console.log(data[0]);
    }
    public.EXPORT.printTraversal = public.printTraversal;

    public.assessRoad = function asroad_assessroad(costMax, roadX, roadY)
    {
        let roadIndex = ASSTATE.getIndex(roadX, roadY);
        if (!hasRoad(roadIndex))
        {
            return false;
        }
        let costSoFar = getTraversalCost(roadIndex);
        return costSoFar < costMax;
    }
    
    public.getInfoRoad = function asroad_getInfoRoad(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return "";
        }
        return public.C_NAME + " " + index + 
        " Sp:" + getRoadSpeed(index) + 
        " Cf:" + ASSTATE.getRoadCarFlow(index) + 
        "/" + (getRoadMaximumCarFlow(index) | 0) +
        " Ls:" + ASSTATE.getRoadLastCarFlow(index);
    }
    public.EXPORT.getInfoRoad = public.getInfoRoad;
    
    return public;
})();

let ASRICO = (function ()
{
    let public = {};
    public.EXPORT = {};
    
    public.C_NAME = 'ASRICO';
    
    const C = ASTILE_ID.C_TILE_RICO_DENSITY;
    const C_Z = ASTILE_ID.C_TILE_ZONE;
    
    // note: type must be (density id - C.NONE) / 10
    // could use C_ZONE instead
    const C_ZONE_RICO = {
        [C_Z.RESLOW] : 1,
        [C_Z.RESHIG] : 3,
        [C_Z.INDLOW] : 4,
        [C_Z.INDHIG] : 6,
        [C_Z.COMLOW] : 7,
        [C_Z.COMHIG] : 9,
        [C_Z.POWLOW] : 11
    }
    
    let getCode = function asrico_getCode(zone, level)
    {
        return zone*10 + level;
    }
    
    // [level, type, ric]
    const C_RICOPROPERTY_MAP = {
        LEVEL : 0,
        TRAFFIC : 1,
        DEMAND_R : 2,
        DEMAND_I : 3,
        DEMAND_C : 4,
        DEMAND_P : 5,
    };
    const C_RM = C_RICOPROPERTY_MAP;
    const C_RICOPROPERTY = {
        [getCode(C_Z.RESLOW, 0)] : [0,  1,   0,   0,   0,   1],
        [getCode(C_Z.RESLOW, 1)] : [1,  1,  -2,   0,   2,   1],
        [getCode(C_Z.RESLOW, 2)] : [2,  1,  -4,   0,   4,   1],
        [getCode(C_Z.RESLOW, 3)] : [3,  1,  -6,   0,   6,   1],
        [getCode(C_Z.RESLOW, 4)] : [4,  1,  -8,   0,   8,   1],
        [getCode(C_Z.RESLOW, 5)] : [5,  1, -10,   0,  10,   2],
        [getCode(C_Z.RESHIG, 0)] : [0,  2,   0,   0,   0,   1],
        [getCode(C_Z.RESHIG, 1)] : [1,  2, -10,   0,  10,   2],
        [getCode(C_Z.RESHIG, 2)] : [2,  2, -16,   0,  16,   2],
        [getCode(C_Z.RESHIG, 3)] : [3,  2, -24,   0,  24,   3],
        [getCode(C_Z.RESHIG, 4)] : [4,  2, -34,   0,  34,   4],
        [getCode(C_Z.RESHIG, 5)] : [5,  2, -50,   0,  50,   5],
        [getCode(C_Z.INDLOW, 0)] : [0,  3,   0,   0,   0,   1],
        [getCode(C_Z.INDLOW, 1)] : [1,  3,   2,  -2,   0,   2],
        [getCode(C_Z.INDLOW, 2)] : [2,  3,   4,  -4,   0,   2],
        [getCode(C_Z.INDLOW, 3)] : [3,  3,   6,  -6,   0,   3],
        [getCode(C_Z.INDLOW, 4)] : [4,  3,   8,  -8,   0,   3],
        [getCode(C_Z.INDLOW, 5)] : [5,  3,  10, -10,   0,   4],
        [getCode(C_Z.INDHIG, 0)] : [0,  5,   0,   0,   0,   0],
        [getCode(C_Z.INDHIG, 1)] : [1,  5,  10, -10,   0,   5],
        [getCode(C_Z.INDHIG, 2)] : [2,  5,  16, -16,   0,   8],
        [getCode(C_Z.INDHIG, 3)] : [3,  5,  24, -24,   0,  12],
        [getCode(C_Z.INDHIG, 4)] : [4,  5,  34, -34,   0,  17],
        [getCode(C_Z.INDHIG, 5)] : [5,  5,  50, -50,   0,  25],
        [getCode(C_Z.COMLOW, 0)] : [0,  2,   0,   0,   0,   1],
        [getCode(C_Z.COMLOW, 1)] : [1,  2,   1,   1,  -2,   2],
        [getCode(C_Z.COMLOW, 2)] : [2,  2,   2,   2,  -4,   2],
        [getCode(C_Z.COMLOW, 3)] : [3,  2,   3,   3,  -6,   3],
        [getCode(C_Z.COMLOW, 4)] : [4,  2,   4,   4,  -8,   3],
        [getCode(C_Z.COMLOW, 5)] : [5,  2,   5,   5, -10,   4],
        [getCode(C_Z.COMHIG, 0)] : [0,  3,   0,   0,   0,   1],
        [getCode(C_Z.COMHIG, 1)] : [1,  3,   5,   5, -10,   5],
        [getCode(C_Z.COMHIG, 2)] : [2,  3,   8,   8, -16,   7],
        [getCode(C_Z.COMHIG, 3)] : [3,  3,  12,  12, -24,   9],
        [getCode(C_Z.COMHIG, 4)] : [4,  3,  17,  17, -34,  11],
        [getCode(C_Z.COMHIG, 5)] : [5,  3,  25,  25, -50,  13],
        [getCode(C_Z.POWLOW, 0)] : [0,  0,   0,   0,   0,-200]
    };
    const C_R = C_RICOPROPERTY;
    
    let isCodeValid = function asrico_isCodeValid(code)
    {
        return (typeof C_R[code] != 'undefined');
    }
    
    let convertOffer = function asrico_convertOffer(v)
    {
        return v < 0 ? v : 0;
    }
    
    let convertDemand = function asrico_convertDemand(v)
    {
        return v > 0 ? v : 0;
    }
    
    let getInitialOffer = function asrico_getInitialOffer(code)
    {
        if (!isCodeValid(code))
        {
            return [-1, -1, -1, -1];
        }
        let or = convertOffer(C_R[code][C_RM.DEMAND_R]);
        let oi = convertOffer(C_R[code][C_RM.DEMAND_I]);
        let oc = convertOffer(C_R[code][C_RM.DEMAND_C]);
        let op = convertOffer(C_R[code][C_RM.DEMAND_P]);
        return [or, oi, oc, op];
    }
    
    let getInitialDemand = function asrico_getInitialDemand(code)
    {
        if (!isCodeValid(code))
        {
            return [-1, -1, -1, -1];
        }
        let dr = convertDemand(C_R[code][C_RM.DEMAND_R]);
        let di = convertDemand(C_R[code][C_RM.DEMAND_I]);
        let dc = convertDemand(C_R[code][C_RM.DEMAND_C]);
        let dp = convertDemand(C_R[code][C_RM.DEMAND_P]);
        return [dr, di, dc, dp];
    }
    
    let getInitialDemandOffer = function asrico_getInitialDemandOffer(code)
    {
        let values = C_R[code];
        if (typeof values == 'undefined' || values == null)
        {
            return [-1, -1, -1, -1];
        }
        let dor = C_R[code][C_RM.DEMAND_R];
        let doi = C_R[code][C_RM.DEMAND_I];
        let doc = C_R[code][C_RM.DEMAND_C];
        let dop = C_R[code][C_RM.DEMAND_P];
        return [dor, doi, doc, dop];
    }
    
    public.getRicoType = function asrico_getRicoType(index)
    {
        let zoneId = ASSTATE.getZoneId(index);
        let type = C_ZONE_RICO[zoneId];
        return type;
    }
    
    public.getDataIdByDensityLevel = function asrico_getDataIdByDensityLevel(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        return getDataIdByDensityLevel(index);
    }
    let getDataIdByDensityLevel = function asrico_getDataIdByDensityLevel(index, levelOffset)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return C.NONE;
        }
        if (ASROAD.hasRoad(index))
        {
            return C.ROAD;
        }
        if (!hasBuilding(index))
        {
            return C.NONE;
        }
        let level = ASSTATE.getRicoDensity(index);
        let offsetFlag = (typeof levelOffset !== 'undefined') && levelOffset != 0;
        if (offsetFlag)
        {
            level += levelOffset;
            if (level < 0)
            {
                level = 0;
            }
        }
        let type = public.getRicoType(index);
        // below formula is dodgy
        let id = C.NONE + 10*type + 1*level;
        if (isValidTileId(id))
        {
            return id;
        }
        else if (G_CHECK && !offsetFlag)
        {
            throw 'Undefined id ' + id + ' at index ' + index;
        }
        return C.NONE;
    }
    
    let isValidTileId = function asrico_isValidTileId(id)
    {
        let index = Object.values(C).indexOf(id);
        return index > -1;
    }
    
    // ---------
    
    let changeDataIndex = function asrico_changeDataIndex(index)
    {
        ASSTATE.notifyChange(index);
    }
    
    public.initialize = function asrico_initialize()
    {
        ASSTATE.setTickProgress(0);
        ASSTATE.setRicoStep(0);
    }
    
    public.setNextTick = function asrico_setNextTick(tick)
    {
        ASSTATE.setTickProgress(0);
        ASSTATE.setRicoStep(0);
    }
    
    let addRico = function asrico_addRico(code, x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        setInitial(code, index);
        ASROAD.disconnectAll(x, y);
        ASROAD.connectAll(x, y);
    }
    
    let updateDisplayId = function asrico_updateDisplayId(index, code)
    {
        // change occurs only if the display is
        // not the same
        let currentDisplayId = (ASSTATE.getDisplayId(index) / 10) | 0;
        if (code == currentDisplayId)
        {
            return;
        }
        let displayId = code * 10;
        // depend on astile and asrico convention
        displayId += Date.now() % ASTILE_ID.C_RICO_DISPLAY_ID_VARIANT_MAX;
        ASSTATE.setDisplayId(index, displayId);
    }
    
    let setInitial = function asrico_setInitial(code, index)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return;
        }
        if (G_CHECK && !isCodeValid(code))
        {
            throw 'Building code ' + code + ' has no property';
        }
        ASSTATE.setRicoDensity(index, C_R[code][C_RM.LEVEL]);
        let demandOffer = getInitialDemandOffer(code);
        ASSTATE.setRicoDemandOffer(index, demandOffer);
        changeDataIndex(index);
        updateDisplayId(index, code);
    }
    
    public.addRicoInitial = function asrico_addRicoInitial(zone, x, y)
    {
        let code = getCode(zone, 0);
        if (!isCodeValid(code))
        {
            throw 'Building code ' + code + ' has no property';
        }
        addRico(code, x, y);
    }
    
    public.removeRico = function asrico_removeRico(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasBuilding(index))
        {
            return;
        }
        ASROAD.disconnectAll(x, y);
    }
    
    // from stackoverflow
    // https://stackoverflow.com/questions/42919469/efficient-way-to-implement-priority-queue-in-javascript
    {
	    const top = 0;
	    const parent = i => ((i + 1) >>> 1) - 1;
	    const left = i => (i << 1) + 1;
	    const right = i => (i + 1) << 1;
	    
	    class PriorityQueue
	    {
	        constructor(comparator = (a, b) => a > b)
	        {
	            this._heap = [];
	            this._comparator = comparator;
	        }
	        size()
	        {
	            return this._heap.length;
	        }
	        isEmpty()
	        {
	            return this.size() == 0;
	        }
	        peek()
	        {
	            return this._heap[top];
	        }
	        push(...values)
	        {
	            values.forEach(value => {
	                this._heap.push(value);
	                this._siftUp();
	            });
	            return this.size();
	        }
	        pop()
	        {
	            const poppedValue = this.peek();
	            const bottom = this.size() - 1;
	            if (bottom > top)
	            {
	                this._swap(top, bottom);
	            }
	            this._heap.pop();
	            this._siftDown();
	            return poppedValue;
	        }
	        replace(value)
	        {
	            const replacedValue = this.peek();
	            this._heap[top] = value;
	            this._siftDown();
	            return replacedValue;
	        }
	        _greater(i, j)
	        {
	            return this._comparator(this._heap[i], this._heap[j]);
	        }
	        _swap(i, j)
	        {
	            [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
	        }
	        _siftUp()
	        {
	            let node = this.size() - 1;
	            while (node > top && this._greater(node, parent(node)))
	            {
	                this._swap(node, parent(node));
	                node = parent(node);
	            }
	        }
	        _siftDown()
	        {
	            let node = top;
	            while (
	                (left(node) < this.size() && this._greater(left(node), node)) ||
	                (right(node) < this.size() && this._greater(right(node), node))
	            ) {
	                let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
	                this._swap(node, maxChild);
	                node = maxChild;
	            }
	        }
	    }
    }
    
    public.updateRico = function asrico_updateRico(tick, timeLimit)
    {
        // Tick progress is the indicator
        // that buildings have been checked
        // in the current tick
        let progress = ASSTATE.getTickProgress();
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tableSize = tableSizeX * tableSizeY;
        let elapsedCycle = 0;
        let tickSpeed = ASSTATE.getTickSpeed();
        // polling mode
        while ((progress - 2 * tableSize < tableSize) && (timeLimit < 0 || Date.now() < timeLimit))
        {
            let index = progress - 2 * tableSize + 1;
            if (updateRicoTile(index))
            {
                progress += 1;
            }
            elapsedCycle += 1;
            if (hasBuilding(index) && tickSpeed > 1000) // exception case
            {
                break;
            }
        }
        ASSTATE.setTickProgress(progress);
        let complete = progress - 2 * tableSize >= tableSize;
        return complete;
    }
    
    let isDemandRicoFilled = function asrico_isDemandRicoFilled(demand)
    {
        let flag = true;
        for (let i in demand)
        {
            //if (i == 3) continue;
            flag &= demand[i] <= 0;
        }
        return flag;
    }
    
    let isOfferRicoFilled = function asrico_isOfferRicoFilled(offer)
    {
        let flag = true;
        for (let i in offer)
        {
            //if (i == 3) continue;
            flag &= offer[i] >= 0;
        }
        return flag;
    }
    
    let levelDensityUp = function asrico_levelDensityUp(index)
    {
        let density = ASSTATE.getRicoDensity(index);
        ASSTATE.setRicoDensity(index, density + 1);
    }
    
    let levelDensityDown = function asrico_levelDensityDown(index)
    {
        let density = ASSTATE.getRicoDensity(index);
        if (density <= 0)
        {
            return;
        }
        ASSTATE.setRicoDensity(index, density - 1);
    }
    
    let getRicoOfferSum = function asrico_getRicoOfferSum(offerIndex)
    {
        let demandOffer = ASSTATE.getRicoDemandOffer(offerIndex);
        let sum = 0;
        for (let i in demandOffer)
        {
            if (demandOffer[i] < 0)
            {
                sum += demandOffer[i];
            }
        }
        return sum;
    }
    
    let canLevelUp = function asrico_canLevelUp(index)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level + 1);
        let flag = isCodeValid(code);
        let demandOffer = ASSTATE.getRicoDemandOffer(index);
        flag &= isDemandRicoFilled(demandOffer);
        flag &= isOfferRicoFilled(demandOffer);
        return flag;
    }
    
    let canLevelDown = function asrico_canLevelDown(index)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let notEnough = false;
        let code = getCode(zone, level);
        
        let demandInitial = getInitialDemand(code);
        let offerInitial = getInitialOffer(code);
        
        let parentCode = getCode(zone, level - 1);
        if (!isCodeValid(parentCode))
        {
            return false;
        }
        let parentDemandInitial = getInitialDemand(parentCode);
        let parentOfferInitial = getInitialOffer(parentCode);
        
        let demandOffer = ASSTATE.getRicoDemandOffer(index);
        
        for (let i in parentDemandInitial)
        {
            //if (i == 3) continue; // temp
            if (demandOffer[i] >= 0)
            {
                notEnough |= (parentDemandInitial[i] + demandOffer[i] - demandInitial[i] > 0);
            }
            if (demandOffer[i] <= 0)
            {
                notEnough |= (parentOfferInitial[i] + demandOffer[i] - offerInitial[i] < 0);
            }
        }
        
        return notEnough;
    }
    
    // note: could be extracted out of asrico
    // because it binds to asroad
    let updateRicoTile = function asrico_updateRicoTile(index)
    {
        // machine state
        if (!hasBuilding(index))
        {
            return true;
        }
        
        let step = ASSTATE.getRicoStep();
        if (step == 0)
        {
            if (canLevelUp(index))
            {
                levelDensityUp(index);
            }
            else if (canLevelDown(index))
            {
                levelDensityDown(index);
            }
            // reset
            let code = getDataIdByDensityLevel(index);
            setInitial(code, index);
            incrementStatOfferTotal(index);
            incrementStatDemandTotal(index);
            ASSTATE.setRicoStep(1);
            return false;
        }
        else if (step == 1)
        {
            // process offer
            // initialize traversal
            // risk of unsync if interaction
            // happen at the same time
            let isConnected = ASSTATE.getRoadConnected(index);
            if (!isConnected)
            {
                ASSTATE.setRicoStep(0);
                return true;
            }
            else
            {
                let xy = ASSTATE.getXYFromIndex(index);
                let x = xy[0];
                let y = xy[1];
                ASROAD.initializeTraversal(x, y);
                ASSTATE.setRicoStep(2);
                return false;
            }
        }
        else if (step == 2)
        {
            // process offer
            // run traversal
            let offerSum = getRicoOfferSum(index);
            if (offerSum >= 0)
            {
                ASSTATE.setRicoStep(3);
                return false;
            }
            let costMax = getDistanceMax(index);
            let next = ASROAD.getNextStepTraversal();
            let nx = next[0];
            let ny = next[1];
            let traversed = ASROAD.assessRoad(costMax, nx, ny);
            if (!traversed) // traversal finished
            {
                ASSTATE.setRicoStep(3);
                return false;
            }
            let filledOffer = dispatchOffer(index, nx, ny);
            let additionalCongestion = convertFlowTypeToCongestion(index, filledOffer);
            increaseCongestion(additionalCongestion);
            return false;
        }
        else
        {
            ASROAD.resetTraversalPath();
            ASSTATE.setRicoStep(0);
            return true;
        }
    }
    
    let convertFlowTypeToCongestion = function asrico_convertFlowTypeToCongestion(index, filledOffer)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level);
        return C_R[code][C_RM.TRAFFIC] * filledOffer;
    }
    
    let incrementStatOfferTotal = function asrico_incrementStatOfferTotal(index)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level);
        let data = getInitialOffer(code);
        let total = ASSTATE.getRicoOfferTotal();
        for (let i = 0; i < total.length; i++)
        {
            total[i] += data[i];
        }
        ASSTATE.setRicoOfferTotal(total);
    }
    
    let incrementStatDemandTotal = function asrico_incrementStatDemandTotal(index)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level);
        let data = getInitialDemand(code);
        let total = ASSTATE.getRicoDemandTotal();
        for (let i = 0; i < total.length; i++)
        {
            total[i] += data[i];
        }
        ASSTATE.setRicoDemandTotal(total);
    }
    
    let getDistanceMax = function asrico_getDistanceMax(index)
    {
        return 1000;
    }
    
    let dispatchOffer = function asrico_dispatchOffer(offerIndex, roadX, roadY)
    {
        let demandIndexList = findNearestBuilding(roadX, roadY);
        let offer = ASSTATE.getRicoDemandOffer(offerIndex);
        let filledOffer = 0;
        for (let i in demandIndexList)
        {
            let demandIndex = demandIndexList[i];
            let demand = ASSTATE.getRicoDemandOffer(demandIndex);
            for (let j in demand)
            {
                if (demand[j] < 0 || offer[j] > 0)
                {
                    continue;
                }
                if (demand[j] + offer[j] >= 0)
                {
                    filledOffer -= offer[j];
                    demand[j] += offer[j];
                    offer[j] = 0;
                }
                else
                {
                    filledOffer += demand[j];
                    offer[j] += demand[j];
                    demand[j] = 0;
                }
            }
            ASSTATE.setRicoDemandOffer(demandIndex, demand);
        }
        ASSTATE.setRicoDemandOffer(offerIndex, offer);
        return filledOffer;
    }
    
    let increaseCongestion = function asrico_increaseCongestion(filledOffer)
    {
        if (filledOffer <= 0)
        {
            return;
        }
        const path = ASROAD.getTraversalPath();
        const pathLength = path.length / 2;
        for (let i = 0; i < path.length; i+=2)
        {
            let x = path[i];
            let y = path[i + 1];
            ASROAD.addCongestion(x, y, filledOffer);
        }
    }
    
    public.hasBuilding = function asrico_hasBuilding(index)
    {
        //let index = ASSTATE.getIndex(x, y);
        return hasBuilding(index);
    }
    let hasBuilding = function asrico_hasBuilding(index)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return false;
        }
        let data = public.getRicoType(index);
        let has = !((typeof data === 'undefined') || (data == null));
        
        return has;
    }
    
    const C_TO = {
        N: 0,
        E: 1,
        S: 2,
        W: 3
    };
    
    let getIndexTo = function asrico_getIndexTo(x, y, d)
    {
        const C_XOFFSET = [-1, 0, 1, 0];
        const C_YOFFSET = [0, -1, 0, 1];
        let xd = x + C_XOFFSET[d];
        let yd = y + C_YOFFSET[d];
        let to = ASSTATE.getIndex(xd, yd);
        return to;
    }
    
    let findNearestBuilding = function asrico_findNearestRico(x, y)
    {
        let list = [];
        let index = ASSTATE.getIndex(x, y);
        if (hasBuilding(index))
        {
            list.push(index);
        }
        const lookupX = [x, x, x, x, x-1, x, x+1, x];
        const lookupY = [y, y, y, y, y, y-1, y, y+1];
        const lookupD = [C_TO.N, C_TO.E, C_TO.S, C_TO.W, C_TO.N, C_TO.E, C_TO.S, C_TO.W];
        for (let i = 0; i < 8; i++)
        {
            let to = getIndexTo(lookupX[i], lookupY[i], lookupD[i]);
            if (hasBuilding(to))
            {
                list.push(to);
            }
        }
        return list;
    }
    
    public.getInfoRico = function asrico_getInfoRico(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasBuilding(index))
        {
            return "";
        }
        let code = getDataIdByDensityLevel(index);
        return public.C_NAME + " " + index + " C:" + code +
            " D:" + ASSTATE.getRicoDemandOffer(index) +
            " " + getInitialDemand(code) +
            " " + getInitialOffer(code);
    }
    public.EXPORT.getInfoRico = public.getInfoRico;
    
    return public;
})();

let ASTILEVIEW = (function ()
{
    let public = {};
    public.EXPORT = {};
    
    public.C_NAME = 'ASTILEVIEW';
    
    public.C_TILEVIEW = {
        ZONE : 0,
        DISPLAY : 1,
        ROAD_TRAVERSAL : 2,
        ROAD_CONGESTION : 3,
        RICO_DENSITY : 4
    };
    const C = public.C_TILEVIEW;
    
    const C_MAP = {
        [C.ZONE] : ASZONE.getDataIdByZone,
        [C.DISPLAY] : ASZONE.getDataIdByDisplay,
        [C.ROAD_TRAVERSAL] : ASROAD.getDataIdByTraversalState,
        [C.ROAD_CONGESTION] : ASROAD.getDataIdByCongestion,
        [C.RICO_DENSITY] : ASRICO.getDataIdByDensityLevel
    };
    
    let retrieveAllChangedTileIdLogic = function astileview_retrieveAllChangedTileIdLogic(targetFunction)
    {
        let changeXYT = [];
        while (true)
        {
            let changeIndex = ASSTATE.retrieveChange();
            if (changeIndex == 0)
            {
                return changeXYT;
            }
            else
            {
                let xy = ASSTATE.getXYFromIndex(changeIndex);
                let x = xy[0];
                let y = xy[1];
                changeXYT.push(x);
                changeXYT.push(y);
                changeXYT.push(targetFunction(x, y));
            }
        }
    }
    
    public.retrieveAllChangedTileId = function astileview_retrieveAllChangedTileId(viewName)
    {
        let targetFunction = C_MAP[viewName];
        if (typeof targetFunction == 'function')
        {
            return retrieveAllChangedTileIdLogic(targetFunction);
        }
        else
        {
            throw 'invalid retrieveallchangeid tileview ' + viewName;
        }
    }
    public.EXPORT.retrieveAllChangedTileId = public.retrieveAllChangedTileId;
    
    let getTileIdTableLogic = function astileview_getTileIdTableLogic(targetFunction)
    {
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        let table = [];
        for (let y = 0; y < tableSizeY; y++)
        {
            for (let x = 0; x < tableSizeX; x++)
            {
                let index = x + y*tableSizeX;
                table[index] = targetFunction(x, y);
            }
        }
        return table;
    }
    
    public.getTileIdTable = function astileview_getTileIdTable(viewName)
    {
        let targetFunction = C_MAP[viewName];
        if (typeof targetFunction == 'function')
        {
            return getTileIdTableLogic(targetFunction);
        }
        else
        {
            throw 'invalid gettileid tileview ' + viewName;
        }
    }
    public.EXPORT.getTileIdTable = public.getTileIdTable;
    
    return public;
})();