const G_CHECK = true;
const G_CACHE_NODE = true;

let ASSTATE = (function()
{
    let public = {};
    
    let m_dataStateBuffer;
    let m_dataStateView;
    
    // map structure
    const C = {
        ZONE : 0,
        CHANGE : 1,
        ZONE_TYPE : 2, // 0 none 1 road 2 building 3 fixed
        ROAD_TYPE : 3,
        ROAD_CONNECT : 4,
        ROAD_CAR_FLOW : 5,
        ROAD_CAR_LAST_FLOW : 6,
        ROAD_TRAVERSAL_PROCESSED : 7,
        ROAD_TRAVERSAL_COST : 8,
        ROAD_TRAVERSAL_PARENT : 9,
        ROAD_DEBUG : 10,
        BUILDING_TYPE : 3, // 1 res 2 com 3 ind 4 off
        BUILDING_DENSITY_LEVEL : 4,
        BUILDING_OFFER_R: 5,
        BUILDING_OFFER_I: 6,
        BUILDING_OFFER_C: 7,
        BUILDING_DEMAND_R : 8,
        BUILDING_DEMAND_I : 9,
        BUILDING_DEMAND_C : 10,
        BUILDING_TICK_UPDATE : 11,
        END : 12
    }
    public.C_DATA = C;
    
    const G = {
        SIZE_X : 0,
        SIZE_Y : 1,
        PLAY : 2,
        TICK : 3,
        FRAME : 4,
        TICK_SPEED : 5,
        UNUSED : 6,
        TICK_PROGRESS : 7,
        RICO_STEP : 8,
        ROAD_TRAVERSAL_START : 9,
        ROAD_TRAVERSAL_LAST : 14,
        ROAD_TRAVERSAL_CURRENT_INDEX : 10,
        ROAD_TRAVERSAL_EDGE_COUNT : 11,
        CHANGE_FIRST : 12,
        CHANGE_LAST : 13,
        END : 15
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
        if (G_CHECK && typeof field == 'undefined')
        {
            throw ('error accessing undefined field');
        }
        let target = index == 0 ? field : (index - 1)*C.END + G.END + field;
        if (typeof m_dataStateView == 'undefined')
        {
            throw ('dataStateView not initialized for ' + index + ' ' + field);
            return;
        }
        if (G_CHECK && (target < 0 || target > m_dataStateView.length))
        {
            throw ('error accessing dataState at ' + index + ' ' + field);
            return;
        }
        return m_dataStateView[target];
    }
    
    let w = function w(index, field, data)
    {
        if (G_CHECK && typeof field == 'undefined')
        {
            throw ('error writing undefined field');
        }
        let target = index == 0 ? field : (index - 1)*C.END + G.END + field;
        if (G_CHECK && (target < 0 || target > m_dataStateView.length))
        {
            throw ('error writing to dataState at ' + index + ' ' + field + ' ' + data);
            return;
        }
        m_dataStateView[target] = data;
    }
    
    public.clear = function asstate_clear(index)
    {
        if (index == 0)
        {
            for (let i = 0; i < G.END; i++)
            {
                m_dataStateView[i] = 0;
            }
        }
        else
        {
            let targetBase = (index - 1)*C.END + G.END;
            for (let i = 0; i < C.END; i++)
            {
                m_dataStateView[targetBase + i] = 0;
            }
        }
    }
    
    public.getDataZoneAtIndex = function asstate_getDataZoneAtIndex(index)
    {
        return r(index, C.ZONE);
    }
    
    public.setDataZoneAtIndex = function asstate_setDataZoneAtIndex(index, data)
    {
        w(index, C.ZONE, data);
    }
    
    public.getChangeFlag = function asstate_getChangeFlag(index)
    {
        return r(index, C.CHANGE);
    }
    
    public.setChangeFlag = function asstate_setChangeFlag(index, data)
    {
        w(index, C.CHANGE, data);
    }
    
    public.getZoneType = function asstate_getZoneType(index)
    {
        return r(index, C.ZONE_TYPE);
    }
    
    public.setZoneType = function asstate_setZoneType(index, data)
    {
        w(index, C.ZONE_TYPE, data);
    }
    
    public.getRoadType = function asstate_getRoadType(index)
    {
        return r(index, C.ROAD_TYPE);
    }
    
    public.setRoadType = function asstate_setRoadType(index, data)
    {
        w(index, C.ROAD_TYPE, data);
    }
    
    public.getBuildingType = function asstate_getBuildingType(index)
    {
        return r(index, C.BUILDING_TYPE);
    }
    
    public.setBuildingType = function asstate_setBuildingType(index, data)
    {
        w(index, C.BUILDING_TYPE, data);
    }
    
    const roadConnectToFlag = [
        C.ROAD_CONNECT_N,
        C.ROAD_CONNECT_E,
        C.ROAD_CONNECT_S,
        C.ROAD_CONNECT_W
    ];
    
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
    
    public.getRoadCarLastFlow = function asstate_getRoadCarLastFlow(index)
    {
        return r(index, C.ROAD_CAR_LAST_FLOW);
    }
    
    public.setRoadCarLastFlow = function asstate_setRoadCarLastFlow(index, data)
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
        //console.log(r(index, C.ROAD_TRAVERSAL_COST));
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
    
    public.getBuildingDemandRico = function asstate_getBuildingDemandRico(index)
    {
        let dr = r(index, C.BUILDING_DEMAND_R);
        let di = r(index, C.BUILDING_DEMAND_I);
        let dc = r(index, C.BUILDING_DEMAND_C);
        return [dr, di, dc];
    }
    
    public.setBuildingDemandRico = function asstate_setBuildingDemandRico(index, demand)
    {
        w(index, C.BUILDING_DEMAND_R, demand[0]);
        w(index, C.BUILDING_DEMAND_I, demand[1]);
        w(index, C.BUILDING_DEMAND_C, demand[2]);
    }
    
    public.getBuildingOfferRico = function asstate_getBuildingOfferRico(index)
    {
        let or = r(index, C.BUILDING_OFFER_R);
        let oi = r(index, C.BUILDING_OFFER_I);
        let oc = r(index, C.BUILDING_OFFER_C);
        return [or, oi, oc];
    }
    
    public.setBuildingOfferRico = function asstate_setBuildingOfferRico(index, offer)
    {
        w(index, C.BUILDING_OFFER_R, offer[0]);
        w(index, C.BUILDING_OFFER_I, offer[1]);
        w(index, C.BUILDING_OFFER_C, offer[2]);
    }
    
    public.getBuildingDensity = function asstate_getBuildingDensity(index)
    {
        return r(index, C.BUILDING_DENSITY_LEVEL);
    }
    
    public.setBuildingDensity = function asstate_setBuildingDensity(index, data)
    {
        w(index, C.BUILDING_DENSITY_LEVEL, data);
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
    
    public.getChangeFirst = function asstate_getChangeFirst()
    {
        return r(0, G.CHANGE_FIRST);
    }
    
    public.setChangeFirst = function asstate_setChangeFirst(data)
    {
        w(0, G.CHANGE_FIRST, data);
    }
    
    public.getChangeLast = function asstate_getChangeLast()
    {
        return r(0, G.CHANGE_LAST);
    }
    
    public.setChangeLast = function asstate_setChangeLast(data)
    {
        w(0, G.CHANGE_LAST, data);
    }
    
    public.initialize = function asstate_initialize(tableSizeX, tableSizeY)
    {
        public.setTableSize(tableSizeX, tableSizeY);
        public.setPlay(-1);
        public.setTick(0);
        public.setFrame(0);
        public.setTickSpeed(0);
        public.setChangeFirst(0);
        public.setChangeLast(0);
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                var index = public.getIndex(x, y);
                public.clear(index);
                public.setChangeFlag(index, 0);
            }
        }
        public.setRoadTraversalStart(-1);
        public.setRoadTraversalCurrentIndex(-1);
        public.setRoadTraversalEdgeCount(-1);
    }
    
    public.setTableSize = function asstate_setTableSize(sizeX, sizeY)
    {
        let totalSize = (G.END + sizeX*sizeY*C.END); //* Int32Array.BYTES_PER_ELEMENT;
        console.log(totalSize);
        public.setRawData(new ArrayBuffer(totalSize*Int16Array.BYTES_PER_ELEMENT));
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
    
    let replaceChangeFirst = function asstate_replaceChangeFirst(newIndex)
    {
        public.setChangeFirst(newIndex);
        public.setChangeLast(newIndex);
        public.setChangeFlag(newIndex, newIndex);
    }
    
    let replaceChangeLast = function asstate_replaceChangeLast(newIndex)
    {
        let lastIndex = public.getChangeLast();
        public.setChangeFlag(lastIndex, newIndex);
        public.setChangeFlag(newIndex, newIndex);
        public.setChangeLast(newIndex);
    }
    
    public.notifyChange = function asstate_notifyChange(newIndex)
    {
        let firstIndex = public.getChangeFirst();
        if (firstIndex > 0)
        {
            let middleIndex = public.getChangeFlag(newIndex);
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
    
    public.retrieveChange = function asstate_retrieveChange()
    {
        let firstIndex = public.getChangeFirst();
        let lastIndex = public.getChangeLast();
        if (firstIndex > 0 && lastIndex > 0 && firstIndex == lastIndex)
        {
            public.setChangeFirst(0);
            public.setChangeLast(0);
            public.setChangeFlag(firstIndex, 0);
        }
        else if (firstIndex > 0)
        {
            let nextIndex = public.getChangeFlag(firstIndex);
            public.setChangeFirst(nextIndex);
            public.setChangeFlag(firstIndex, 0);
        }
        return firstIndex;
    }
    
    public.getSerializable = function asstate_getSerializable()
    {
        console.log(Array.from(m_dataStateView));
        return JSON.stringify(Array.from(m_dataStateView));
    }
    
    public.setSerializable = function asstate_setSerializable(string)
    {
        let array = JSON.parse(string);
        public.setRawData(Int16Array.from(array).buffer);
        ASROAD.resetInternal();
    }
    
    public.setRawData = function asstate_setRawData(arrayBuffer)
    {
        m_dataStateBuffer = arrayBuffer;
        m_dataStateView = new Int16Array(m_dataStateBuffer);
    }
    
    public.getRawData = function asstate_getRawData()
    {
        return m_dataStateBuffer;
    }
    
    return public;
})();

// ---------------------
let ASZONE = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASZONE';
    
    public.C_TYPE = {
        NONE: 0,
        ROAD: 1,
        BUILDING: 2
    }
    
    public.C_TILEENUM = ASTILE.C_TILE_ZONE;
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
                public.setZone(x, y, defaultId);
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
        return ASSTATE.getDataZoneAtIndex(index);
    }
    let setDataId = function aszone_setDataId(x, y, zone)
    {
        const index = ASSTATE.getIndex(x, y);
        ASSTATE.clear(index);
        ASSTATE.setDataZoneAtIndex(index, zone);
    }
    
    //----------------
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
        const oldZone = public.getDataIdByZone(x, y);
        if (oldZone != zone)
        {
            if (oldZone == C.ROAD)
            {
                ASROAD.removeRoad(x, y);
            }
            else if (oldZone == C.RESLOW)
            {
                ASRICO.removeBuilding(x, y);
            }
            else if (oldZone == C.COMLOW)
            {
                ASRICO.removeBuilding(x, y);
            }
            else if (oldZone == C.INDLOW)
            {
                ASRICO.removeBuilding(x, y);
            }
        }
        setDataId(x, y, zone);
        // update other systems
        if (zone == C.ROAD)
        {
            ASROAD.addRoad(x, y);
        }
        else if (zone == C.RESLOW)
        {
            ASRICO.addResLow(x, y);
        }
        else if (zone == C.COMLOW)
        {
            ASRICO.addComLow(x, y);
        }
        else if (zone == C.INDLOW)
        {
            ASRICO.addIndLow(x, y);
        }
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
        engineComplete &= engineComplete ? ASROAD.updateRoad(tick, timeLimit) : false;
        engineComplete &= engineComplete ? ASRICO.updateRico(tick, timeLimit) : false;
        const enoughTimeElapsed = Math.abs(time - m_lastTickTime) >= tickSpeed;
        if (engineComplete && enoughTimeElapsed)
        {
            let newTick = tick + 1;
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
                    public.setZone(x, y, roadId);
                }
                else if (x < 5)
                {
                    public.setZone(x, y, resId)
                }
                else if (x < 10)
                {
                    public.setZone(x, y, comId);
                }
                else if (x < 15)
                {
                    public.setZone(x, y, indId);
                }
            }
        }
    }
    
    return public;
})();

let ASROAD = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASROAD';
    
    // connected: [] cantor index
    
    const C_TO = {
        N: 0,
        E: 1,
        S: 2,
        W: 3
    };
    const C_FROM = [2, 3, 0, 1];
    
    public.C_TILEENUM = ASTILE.C_TILE_ROAD;
    const C = public.C_TILEENUM;
    
    const C_TYPE_ID = {
        NONE : 0,
        PATH : 1,
        ROAD : 2,
        HIGHWAY : 3
    }
    
    // in m/s
    const C_TYPE_SPEED = {
        [C_TYPE_ID.NONE] : 2,
        [C_TYPE_ID.PATH] : 5,
        [C_TYPE_ID.ROAD] : 14,
        [C_TYPE_ID.HIGHWAY] : 25
    }
    
    const C_TYPE_LANE = {
        [C_TYPE_ID.NONE] : 1,
        [C_TYPE_ID.PATH] : 1,
        [C_TYPE_ID.ROAD] : 1,
        [C_TYPE_ID.HIGHWAY] : 3
    }
    
    const C_TILE_LENGTH = 100; // m
    const C_TICK_DURATION = 1 ; // s
    const C_MAX_SPEED = 50; // m / s
    const C_INTER_CAR = 1; // s
    const C_CAR_LENGTH = 4; // m
    
    // ----------------
    
    let C_DEBUG_TRAVERSAL = true;
    
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
            return C.NONE;
        }
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return C.NONE;
        }
        let ratio = getRoadSpeedDecrease(index);
        if (ratio > 0.75)
        {
            return C.LOW;
        }
        else if (ratio > 0.5)
        {
            return C.MID;
        }
        else if (ratio > 0.25)
        {
            return C.HIG;
        }
        else if (ratio > 0)
        {
        	return C.VHI;
        }
        else
        {
        	return C.NONE;
        }
    }
    
    public.getDataIdByTraversalState = function asroad_getTileByTraversalState(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C.NONE;
        }
        let index = ASSTATE.getIndex(x, y);
        let value = hasRoad(index) ? ASSTATE.getRoadDebug(index) : 0;
        if (value >= 104)
        {
            return C.VHI;
        }
        else if (value >= 103)
        {
            return C.HIG; // in queue and processed
        }
        else if (value >= 102)
        {
            return C.MID; // current
        }
        else if (value >= 101)
        {
        	return C.LOW; // in queue
        }
        else if (value >= 0)
        {
        	return C.NONE; // unexplored
        }
        else
        {
            console.log('getTileByTraversalState error ' + index);
        }
    }
    
    let getIndexTo = function asroad_getIndexTo(x, y, d)
    {
        const C_XOFFSET = [-1, 0, 1, 0];
        const C_YOFFSET = [0, -1, 0, 1];
        let xd = x + C_XOFFSET[d];
        let yd = y + C_YOFFSET[d];
        let to = ASSTATE.getIndex(xd, yd);
        return to;
    }
    
    let connectNodes = function asroad_connectNodes(x, y, d)
    {
        let from = ASSTATE.getIndex(x, y);
        let to = getIndexTo(x, y, d);
        //console.log('connectnode x'+x+'y'+y+'xd'+xd+'yd'+yd);
        if (hasRoad(from) && hasRoad(to))
        {
            ASSTATE.setRoadConnectTo(from, d, 1);
            ASSTATE.setRoadConnectTo(to, C_FROM[d], 1);
        }
    }
    
    let disconnectNodes = function asroad_disconnectNodes(x, y, d)
    {
        let from = ASSTATE.getIndex(x, y);
        let to = getIndexTo(x, y, d);
        if (to < 0)
        {
            return;
        }
        // note: disconnect only if to is valid
        // even if it has no road
        if (hasRoad(from))
        {
            //delete ASSTATE.getRoad(from).connectTo[d];
            ASSTATE.setRoadDisconnectTo(from, d, 0);
        }
        if (hasRoad(to))
        {
            //delete ASSTATE.getRoad(to).connectTo[C_FROM[d]];
            ASSTATE.setRoadDisconnectTo(to, C_FROM[d], 0);
        }
    }
    
    let hasRoad = function asroad_hasRoad(i)
    {
        if (typeof i === 'undefined' || i == null || i < 0)
        {
            return false;
        }
        let data = ASSTATE.getZoneType(i);
        return !((typeof data === 'undefined') || (data == null)) && (data == ASZONE.C_TYPE.ROAD);
    }
    
    let isConnectedTo = function asroad_isConnectedTo(from, d)
    {
        if (!hasRoad(from))
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
        if (!hasRoad(to))
        {
            return -1;
        }
        //console.log('isConnectedTo f' + from + 't' + to + 'c' + m_network[from].connectTo);
        return to;
    }
    
    public.addRoad = function asroad_addRoad(x, y)
    {
        if (x < 0 || y < 0)
        {
            return;
        }
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            ASSTATE.setZoneType(index, ASZONE.C_TYPE.ROAD);
            ASSTATE.setRoadType(index, C_TYPE_ID.ROAD);
            ASSTATE.setRoadDisconnectTo(index, C_TO.N, 0);
            ASSTATE.setRoadDisconnectTo(index, C_TO.E, 0);
            ASSTATE.setRoadDisconnectTo(index, C_TO.S, 0);
            ASSTATE.setRoadDisconnectTo(index, C_TO.W, 0);
            ASSTATE.setRoadCarLastFlow(index, 0);
            ASSTATE.setRoadCarFlow(index, 0);
            ASSTATE.setRoadDebug(index, C.LOW)
            changeDataIndex(index);
            m_cacheNodeRefresh = true;
            // traversal v2 related
            ASSTATE.setRoadTraversalCost(index, 0);
        }
        connectNodes(x, y, C_TO.N);
        connectNodes(x, y, C_TO.E);
        connectNodes(x, y, C_TO.S);
        connectNodes(x, y, C_TO.W);
    }

    public.removeRoad = function asroad_removeRoad(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return;
        }
        disconnectNodes(x, y, C_TO.N);
        disconnectNodes(x, y, C_TO.E);
        disconnectNodes(x, y, C_TO.S);
        disconnectNodes(x, y, C_TO.W);
        changeDataIndex(index);
        m_cacheNodeRefresh = true;
    }
    
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
        while ((progress < tableSize) && (timeLimit < 0 || Date.now() < timeLimit))
        {
            let index = progress + 1;
            updateRoadTile(index);
            progress += 1;
            elapsedCycle += 1;
            if (hasRoad(index) && tickSpeed > 1000) // exception case
            {
                break;
            }
        }
        ASSTATE.setTickProgress(progress);
        let complete = progress >= tableSize;
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
        ASSTATE.setRoadCarLastFlow(index, carFlow);
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
        //LC * (TD - TL / TS) / IC
        let type = ASSTATE.getRoadType(index);
        let maxSpeed = C_TYPE_SPEED[type];
        let laneCount = C_TYPE_LANE[type];
        let maxFlow = laneCount * C_TICK_DURATION / (C_CAR_LENGTH / maxSpeed + C_INTER_CAR);
        return maxFlow;
    }
    
    let getRoadSpeed = function asroad_getRoadSpeed(index)
    {
        // LN * TL / TC / IC
        let type = ASSTATE.getRoadType(index);
        let maxSpeed = C_TYPE_SPEED[type];
        let ratio = getRoadSpeedDecrease(index);
        return maxSpeed * ratio | 0;
    }
    
    let getRoadSpeedDecrease = function asroad_getRoadSpeedDecrease(index)
    {
        let type = ASSTATE.getRoadType(index);
        let maxFlow = getRoadMaximumCarFlow(index);
        let currentFlow = ASSTATE.getRoadCarFlow(index);
        let ratio = maxFlow / currentFlow;
        return ratio >= 1 ? 1 : ratio;
    }
    
    let getRoadTrafficDecay = function asroad_getRoadTrafficDecay(index)
    {
        // LN / TF / IC * TD
        let type = ASSTATE.getRoadType(index);
        let laneCount = C_TYPE_LANE[type];
        let carFlow = ASSTATE.getRoadCarFlow(index);
        let decay = (laneCount / carFlow / C_INTER_CAR * C_TICK_DURATION);
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
        if (hasRoad(from))
        {
            let nodeIndex = getTraversalEdgeCount();
            incrementTraversalEdgeCount();
            setTraversalCurrentIndex(from);
            let cost = getTraversalCostIncrease(from);
            setTraversalCost(from, cost);
            setTraversalParent(from, -1);
            setTraversalProcessed(from);
            expandTraversal(from, isConnectedTo(from, C_TO.N));
            expandTraversal(from, isConnectedTo(from, C_TO.E));
            expandTraversal(from, isConnectedTo(from, C_TO.S));
            expandTraversal(from, isConnectedTo(from, C_TO.W));
            ASSTATE.setRoadDebug(from, C.HIG);
            changeTraversalIndex(from);
            m_cacheNodeRefresh = true;
        }
    }
    
    const C_TR = {
        FROM: 1,
        COST: 2,
        PARENT: 3,
        PROCESSED: 4
    };
    
    let getTraversalCostIncrease = function asroad_getTraversalCostIncrease(roadIndex)
    {
        let speed = getRoadSpeed(roadIndex);
        return 200 / speed;
    }
    
    let expandTraversal = function asroad_expandTraversal(parent, node)
    {
        //console.log('expandTraversal d' + data + 'f' + from + 't' + to);
        if (hasRoad(node))
        {
            let currentCost = getTraversalCostIncrease(node);
            if (parent >= 0)
            {
                let previousCost = getTraversalCost(parent);
                currentCost += previousCost;
                //setTraversalProcessed(data, index);
            }
            let edgeIndex = getTraversalEdgeCount();
            incrementTraversalEdgeCount();
            setTraversalCost(node, currentCost);
            setTraversalParent(node, parent);
            setTraversalAdded(node);
            ASSTATE.setRoadDebug(node, C.MID);
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
        for (let i = 0; i < nodeCount; i++)
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
        ASSTATE.setRoadDebug(node, C.HIG);
        expandIfNotTraversed(node, C_TO.N);
        expandIfNotTraversed(node, C_TO.E);
        expandIfNotTraversed(node, C_TO.S);
        expandIfNotTraversed(node, C_TO.W);
        changeTraversalIndex(node);
        return ASSTATE.getXYFromIndex(node);
    }
    
    public.getNextStepTraversal = function asroad_getNextStepTraversal()
    {
        // start explore
        let minNode = identifyNextNode();
        if (minNode >= 0)
        {
            return traverseNextNode(minNode);
        }
        else
        {
            //console.log('end');
            return [-1, -1];
        }
    }
    
    public.getTraversalPath = function asroad_getTraversalPath()
    {
        let lastNode = getTraversalCurrentIndex();
        if (lastNode < 0)
        {
            console.log('invalid');
            return [-1, -1];
        }
        else
        {
            let reversePathNode = [];
            while (lastNode >= 0)
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
    
    public.resetTraversalPath = function asroad_resetTraversalPath()
    {
        let nodeList = getCurrentNodeList();
        let edgeCount = nodeList.length;
        for (let i = 0; i < edgeCount; i++)
        {
            let node = nodeList[i];
            if (hasRoad(node))
            {
                ASSTATE.setRoadDebug(node, C.LOW);
                changeTraversalIndex(node);
            }
            clearTraversal(node, i);
        }
        m_cacheNodeRefresh = true;
    }
    
    public.resetInternal = function asroad_resetInternal()
    {
        m_cacheNodeRefresh = true;
    }
    
    public.printTraversal = function asroad_printTraversal()
    {
        console.log();
        //console.log(data[0]);
    }

    public.assessRoad = function asroad_assessroad(costMax, roadX, roadY)
    {
        let roadIndex = ASSTATE.getIndex(roadX, roadY);
        if (!hasRoad(roadIndex))
        {
            return false;
        }
        let costSoFar = ASSTATE.getRoadTraversalCost(roadIndex);
        return costSoFar < costMax;
    }
    
    public.findNearestRoad = function asroad_findNearestRoad(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (hasRoad(index))
        {
            return index;
        }
        const lookupX = [x, x, x, x, x-1, x, x+1, x];
        const lookupY = [y, y, y, y, y, y-1, y, y+1];
        const lookupD = [C_TO.N, C_TO.E, C_TO.S, C_TO.W, C_TO.N, C_TO.E, C_TO.S, C_TO.W];
        for (let i = 0; i < 8; i++)
        {
            let to = getIndexTo(lookupX[i], lookupY[i], lookupD[i]);
            if (hasRoad(to))
            {
                return to;
            }
        }
        return -1;
    }
    
    public.getInfo = function asroad_getInfo(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasRoad(index))
        {
            return "";
        }
        return public.C_NAME + " " + index + " Sp:" +
            getRoadSpeed(index) + " Cf:" + 
            ASSTATE.getRoadCarFlow(index) + " Mx:" +
            ASSTATE.getRoadCarLastFlow(index);
    }
    
    return public;
})();

let ASRICO = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASRICO';
    
    public.C_TILEENUM = ASTILE.C_TILE_RICO;
    const C = public.C_TILEENUM;
    
    // [level, type, offer ric, demand ric]
    const C_RICOPROPERTY_MAP = {
        LEVEL : 0,
        TYPE : 1,
        OFFER_R : 2,
        OFFER_I : 3,
        OFFER_C : 4,
        DEMAND_R : 5,
        DEMAND_I : 6,
        DEMAND_C : 7
    };
    const C_RM = C_RICOPROPERTY_MAP;
    const C_RICOPROPERTY = {
        [C.RESLOW_0] : [0, 1,   0,   0,   0,   0,   0,   0],
        [C.RESLOW_1] : [1, 1,  20,   0,   0,   0,  10,  10],
        [C.RESLOW_2] : [2, 1,  50,   0,   0,   0,  20,  30],
        [C.INDLOW_0] : [0, 2,   0,   0,   0,   0,   0,   0],
        [C.INDLOW_1] : [1, 2,   0,  20,   0,  10,   0,  10],
        [C.INDLOW_2] : [2, 2,   0,  50,   0,  30,   0,  20],
        [C.COMLOW_0] : [0, 3,   0,   0,   0,   0,   0,   0],
        [C.COMLOW_1] : [1, 3,   0,   0,  20,  10,  10,   0],
        [C.COMLOW_2] : [2, 3,   0,   0,  50,  20,  30,   0],
    };
    const C_R = C_RICOPROPERTY;
    
    let getInitialOffer = function asrico_getInitialOffer(code)
    {
        let values = C_R[code];
        if (typeof values == 'undefined' || values == null)
        {
            return [-1, -1, -1];
        }
        let or = C_R[code][C_RM.OFFER_R];
        let oi = C_R[code][C_RM.OFFER_I];
        let oc = C_R[code][C_RM.OFFER_C];
        return [or, oi, oc];
    }
    
    let getInitialDemand = function asrico_getInitialDemand(code)
    {
        let values = C_R[code];
        if (typeof values == 'undefined' || values == null)
        {
            return [-1, -1, -1];
        }
        let dr = C_R[code][C_RM.DEMAND_R];
        let di = C_R[code][C_RM.DEMAND_I];
        let dc = C_R[code][C_RM.DEMAND_C];
        return [dr, di, dc];
    }
    
    public.getDataIdByDensityLevel = function asrico_getDataIdByDensityLevel(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        return getDataIdByDensityLevel(index);
    }
    let getDataIdByDensityLevel = function asrico_getDataIdByDensityLevel(index)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return C.NONE;
        }
        let level = hasBuilding(index) ? ASSTATE.getBuildingData(ASSTATE.C_DATA.BUILDING_DENSITY_LEVEL, index) : 0;
        let type = hasBuilding(index) ? ASSTATE.getBuildingData(ASSTATE.C_DATA.BUILDING_TYPE, index) : 0;
        let id = C.NONE + 10*type + 1*level;
        if (isValidTileId(id))
        {
            return id;
        }
        return C.NONE;
    }
    
    let isValidTileId = function asrico_isValidTileId(id)
    {
        let index = Object.values(C).indexOf(id);
        return index > -1;
    }
    
    // ---------
    
    let addChangeLogIndex = function asrico_addChangeLogIndex(index)
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
    
    let addInitial = function asrico_addInitial(code, index)
    {
        if (!hasBuilding(index))
        {
            setInitial(code, index);
        }
    }
    
    let setInitial = function asrico_setInitial(code, index)
    {
        if (!ASSTATE.isValidIndex(index))
        {
            return;
        }
        ASSTATE.setZoneType(index, ASZONE.C_TYPE.BUILDING);
        ASSTATE.setBuildingType(index, 1);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_TICK_UPDATE, index, 0);
        ASSTATE.setBuildingDensity(index, C_R[code][C_RM.LEVEL]);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_TYPE, index, C_R[code][C_RM.TYPE]);
        let offerRico = getInitialOffer(code);
        let residualOfferRico = ASSTATE.getBuildingOfferRico(index);
        for (let i in offerRico)
        {
            offerRico[i] += residualOfferRico[i];
        }
        ASSTATE.setBuildingOfferRico(index, offerRico);
        let demandRico = getInitialDemand(code);
        ASSTATE.setBuildingDemandRico(index, demandRico);
        addChangeLogIndex(index);
    }
    
    public.addResLow = function asrico_addResLow(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        addInitial(C.RESLOW_0, index);
    }
   
    public.addComLow = function asrico_addComLow(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        addInitial(C.COMLOW_0, index);
    }
    
    public.addIndLow = function asrico_addIndLow(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        addInitial(C.INDLOW_0, index);
    }
    
    public.removeBuilding = function asrico_removeBuilding(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasBuilding(index))
        {
            return;
        }
        addChangeLogIndex(index);
        return;
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
        while ((progress - tableSize < tableSize) && (timeLimit < 0 || Date.now() < timeLimit))
        {
            let index = progress - tableSize + 1;
            if (updateBuilding(index))
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
        let complete = progress - tableSize >= tableSize;
        return complete;
    }
    
    let isDemandRicoFilled = function asrico_isDemandRicoFilled(demand)
    {
        return demand[0] <= 0 && demand[1] <= 0 && demand[2] <= 0;
    }
    
    let levelDensityUp = function asrico_levelDensityUp(index)
    {
        let density = ASSTATE.getBuildingDensity(index);
        if (density >= 2)
        {
            return;
        }
        ASSTATE.setBuildingDensity(index, density + 1);
        let code = getDataIdByDensityLevel(index);
        //console.log(code);
        setInitial(code, index);
    }
    
    let getOfferRicoSum = function asrico_getOfferRicoSum(offerIndex)
    {
        let offer = ASSTATE.getBuildingOfferRico(offerIndex);
        let sum = 0;
        for (let i in offer)
        {
            sum += offer[i];
        }
        return sum;
    }
    
    // note: could be extracted out of asrico
    // because it binds to asroad
    let updateBuilding = function asrico_updateBuilding(index)
    {
        // machine state
        if (!hasBuilding(index))
        {
            return true;
        }
        
        let step = ASSTATE.getRicoStep();
        if (step == 0)
        {
            // process demand
            let demandRico = ASSTATE.getBuildingDemandRico(index);
            if (isDemandRicoFilled(demandRico))
            {
                levelDensityUp(index);
                //console.log('level up ' + index);
            }
            ASSTATE.setRicoStep(1);
            return false;
        }
        else if (step == 1)
        {
            // process offer
            // initialize traversal
            // risk of unsync if interaction
            // happen at the same time
            let xy = ASSTATE.getXYFromIndex(index);
            let x = xy[0];
            let y = xy[1];
            let roadIndex = ASROAD.findNearestRoad(x, y);
            if (roadIndex < 0)
            {
                ASSTATE.setRicoStep(0);
                return true;
            }
            else
            {
                let roadXY = ASSTATE.getXYFromIndex(roadIndex);
                let roadX = roadXY[0];
                let roadY = roadXY[1];
                ASROAD.initializeTraversal(roadX, roadY);
                ASSTATE.setRicoStep(2);
                return false;
            }
        }
        else if (step == 2)
        {
            // process offer
            // run traversal
            let offerSum = getOfferRicoSum(index);
            if (offerSum <= 0)
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
            increaseCongestion(filledOffer);
            return false;
        }
        else
        {
            ASROAD.resetTraversalPath();
            ASSTATE.setRicoStep(0);
            return true;
        }
    }
    
    let getDistanceMax = function asrico_getDistanceMax(index)
    {
        return 1000;
    }
    
    let dispatchOffer = function asrico_dispatchOffer(offerIndex, roadX, roadY)
    {
        let demandIndexList = findNearestBuilding(roadX, roadY);
        let offer = ASSTATE.getBuildingOfferRico(offerIndex);
        let filledOffer = 0;
        for (let i in demandIndexList)
        {
            let demandIndex = demandIndexList[i];
            let demand = ASSTATE.getBuildingDemandRico(demandIndex);
            for (let j in demand)
            {
                if (demand[j] >= offer[j])
                {
                    filledOffer += offer[j];
                    demand[j] -= offer[j];
                    offer[j] = 0;
                }
                else
                {
                    filledOffer += demand[j];
                    offer[j] -= demand[j];
                    demand[j] = 0;
                }
            }
            ASSTATE.setBuildingDemandRico(demandIndex, demand);
        }
        ASSTATE.setBuildingOfferRico(offerIndex, offer);
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
    
    let hasBuilding = function asrico_hasBuilding(i)
    {
        if (!ASSTATE.isValidIndex(i))
        {
            return false;
        }
        let data = ASSTATE.getZoneType(i);
        return !((typeof data === 'undefined') || (data == null)) && (data == ASZONE.C_TYPE.BUILDING);
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
    
    public.getInfo = function asrico_getInfo(x, y)
    {
        let index = ASSTATE.getIndex(x, y);
        if (!hasBuilding(index))
        {
            return "";
        }
        let code = getDataIdByDensityLevel(index);
        return public.C_NAME + " " + index + " C:" + code +
            " D:" + ASSTATE.getBuildingDemandRico(index) +
            " " + getInitialDemand(code) +
            " O:" + ASSTATE.getBuildingOfferRico(index) +
            " " + getInitialOffer(code);
    }
    
    return public;
})();

let ASTILEVIEW = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASTILEVIEW';
    
    public.C_TILEVIEW = {
        ZONE : 0,
        ROAD_TRAVERSAL : 1,
        ROAD_CONGESTION : 2,
        RICO_DENSITY : 3
    };
    const C = public.C_TILEVIEW;
    
    const C_MAP = {
        [C.ZONE] : ASZONE.getDataIdByZone,
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
    
    return public;
})();