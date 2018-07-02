const G_CHECK = true;

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
        ROAD_CONNECT_N : 4,
        ROAD_CONNECT_E : 5,
        ROAD_CONNECT_S : 6,
        ROAD_CONNECT_W : 7,
        ROAD_USED_CAPACITY : 8,
        ROAD_MAX_CAPACITY : 9,
        ROAD_TRAVERSAL_PROCESSED : 10,
        ROAD_TRAVERSAL_COST : 11,
        ROAD_TRAVERSAL_PARENT : 12,
        ROAD_DEBUG : 13,
        BUILDING_TYPE : 3, // 1 res 2 com 3 ind 4 off
        BUILDING_DENSITY_LEVEL : 4,
        BUILDING_OFFER_R: 5,
        BUILDING_OFFER_I: 6,
        BUILDING_OFFER_C: 7,
        BUILDING_DEMAND_R : 8,
        BUILDING_DEMAND_I : 9,
        BUILDING_DEMAND_C : 10,
        BUILDING_TICK_UPDATE : 11,
        END : 14
    }
    public.C_DATA = C;
    
    const G = {
        SIZE_X : 0,
        SIZE_Y : 1,
        PLAY : 2,
        TICK : 3,
        FRAME : 4,
        TICK_SPEED : 5,
        TICK_REAL_SPEED : 6,
        RICO_TICK_PROGRESS : 7,
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
        return [((index - 1) / public.getTableSizeY()) | 0, (index - 1) % public.getTableSizeY()];
    }
    
    let r = function r(index, field)
    {
        let target = index == 0 ? field : (index - 1)*C.END + G.END + field;
        if (G_CHECK && (target < 0 || target > m_dataStateView.length))
        {
            throw ('error accessing dataState at ' + index + ' ' + field);
            return;
        }
        return m_dataStateView[target];
    }
    
    let w = function w(index, field, data)
    {
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
        return r(index, roadConnectToFlag[d]);
    }
    
    public.setRoadConnectTo = function asstate_setRoadConnectTo(index, d, data)
    {
        w(index, roadConnectToFlag[d], data);
    }
    
    public.getRoadUsedCapacity = function asstate_getRoadUsedCapacity(index)
    {
        return r(index, C.ROAD_USED_CAPACITY);
    }
    
    public.setRoadUsedCapacity = function asstate_setRoadUsedCapacity(index, data)
    {
        w(index, C.ROAD_USED_CAPACITY, data);
    }
    
    public.getRoadMaxCapacity = function asstate_getRoadMaxCapacity(index)
    {
        return r(index, C.ROAD_MAX_CAPACITY);
    }
    
    public.setRoadMaxCapacity = function asstate_setRoadMaxCapacity(index, data)
    {
        w(index, C.ROAD_MAX_CAPACITY, data);
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
    
    public.getTickRealSpeed = function asstate_getTickRealSpeed()
    {
        return r(0, G.TICK_REAL_SPEED);
    }
    
    public.setTickRealSpeed = function asstate_setTickRealSpeed(data)
    {
        w(0, G.TICK_REAL_SPEED, data);
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
    
    public.getRicoTickProgress = function asstate_getRicoTickProgress()
    {
        return r(0, G.RICO_TICK_PROGRESS);
    }
    
    public.setRicoTickProgress = function asstate_setRicoTickProgress(data)
    {
        w(0, G.RICO_TICK_PROGRESS, data);
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
        public.setChangeFirst(-1);
        public.setChangeLast(-1);
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                var index = public.getIndex(x, y);
                public.clear(index);
                public.setChangeFlag(index, -1);
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
        public.setRawData(new ArrayBuffer(totalSize*Int32Array.BYTES_PER_ELEMENT));
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
    
    let replaceChangeLast = function asstate_replaceChangeLast(newIndex, lastIndex)
    {
        public.setChangeFlag(lastIndex, newIndex);
        public.setChangeFlag(newIndex, newIndex);
        public.setChangeLast(newIndex);
    }
    
    public.notifyChange = function asstate_notifyChange(newIndex)
    {
        let firstIndex = public.getChangeFirst();
        if (firstIndex >= 0)
        {
            let lastIndex = public.getChangeLast();
            replaceChangeLast(newIndex, lastIndex);
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
        if (firstIndex >= 0 && lastIndex >= 0 && firstIndex == lastIndex)
        {
            public.setChangeFirst(-1);
            public.setChangeLast(-1);
            public.setChangeFlag(firstIndex, -1);
        }
        else if (firstIndex >= 0)
        {
            let nextIndex = public.getChangeFlag(firstIndex);
            public.setChangeFirst(nextIndex);
            public.setChangeFlag(firstIndex, -1);
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
        public.setRawData(Int32Array.from(array).buffer);
    }
    
    public.setRawData = function asstate_setRawData(arrayBuffer)
    {
        m_dataStateBuffer = arrayBuffer;
        m_dataStateView = new Int32Array(m_dataStateBuffer);
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
    
    public.C_NAME = 'aszone';
    
    public.C_TYPE = {
        NONE: 0,
        ROAD: 1,
        BUILDING: 2
    }
    
    public.C_TILEENUM = {
        NONE: 0,
        DEFAULT: 1,
        DIRT: 1,
        ROAD: 3,
        RESLOW: 10,
        COMLOW: 20,
        INDLOW: 30,
    }
    const C = public.C_TILEENUM;
    
    public.getTileTextureName = function aszone_getTileTextureName(tileId)
    {
        return public.C_NAME + tileId;
    }
    
    let getColor = function aszone_getColor(r, g, b)
    {
        return (r) * 2**16 + (g) * 2**8 + (b);
    }
    
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
        return MMAPRENDER.createTexture(color, margin, height);
    }
    
    public.zoneTile = [
        C.DIRT,
        C.ROAD, 
        C.RESLOW,
        C.COMLOW,
        C.INDLOW
    ];
    
    public.ricoTile = [
        C.RESLOW
    ];
    
    public.viewTile = [
        C.RESLOW,
        C.ROAD,
        C.INDLOW,
        C.COMLOW,
        C.DIRT,
    ];
    
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

    public.getDataId = function aszone_getDataId(x, y)
    {
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
        const oldZone = public.getDataId(x, y);
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
    
    let m_lastTickTime1 = 0;
    let m_lastTickTime2 = 0;
    let m_lastTickTime3 = 0;
    let m_lastTickTime4 = 0;
    let m_lastTickTime5 = 0;
    let m_countTickTime = 0;
    let m_countTickPerSecond = 0;
    
    public.update = function aszone_update(time, timeLimit)
    {
        if (time - m_countTickTime > 1000)
        {
            ASSTATE.setTickRealSpeed(m_countTickPerSecond);
            m_countTickTime = time;
        }
        const tickSpeed = ASSTATE.getTickSpeed();
        if (tickSpeed == -1)
        {
            return;
        }
        const tick = ASSTATE.getTick();
        const frame = ASSTATE.getFrame();
        let engineComplete = true;
        if (engineComplete)
        {
            engineComplete &= ASRICO.updateRico(tick, timeLimit);
        }
        const enoughTimeElapsed = Math.abs(time - m_lastTickTime1) >= tickSpeed;
        if (engineComplete && enoughTimeElapsed)
        {
            let newTick = tick + 1;
            ASRICO.setNextTick(newTick);
            ASSTATE.setTick(newTick);
            ASSTATE.setFrame(0);
            m_lastTickTime5 = m_lastTickTime4;
            m_lastTickTime4 = m_lastTickTime3;
            m_lastTickTime3 = m_lastTickTime2;
            m_lastTickTime2 = m_lastTickTime1;
            m_lastTickTime1 = time;
            m_countTickPerSecond = (m_lastTickTime1-m_lastTickTime2)/1;
        }
        else if (!engineComplete)
        {
            ASSTATE.setFrame(frame + 1);
        }
    }
    
    return public;
})();

let ASROAD = (function ()
{
    let public = {};
    
    public.C_NAME = 'asroad';
    
    // connected: [] cantor index
    
    const C_TO = {
        N: 0,
        E: 1,
        S: 2,
        W: 3
    };
    const C_XOFFSET = [-1, 0, 1, 0];
    const C_YOFFSET = [0, -1, 0, 1];
    const C_FROM = [2, 3, 0, 1];
    
    public.C_TILEENUM = {
        NONE: 100,
        LOW: 101,
        MID: 102,
        HIG: 103,
        VHI: 104
    }
    const C = public.C_TILEENUM;
    
    public.getTileTextureName = function asroad_getTileTextureName(tileId)
    {
        return public.C_NAME + tileId;
    }
    
    let getColor = function asroad_getColor(r, g, b)
    {
        return (r) * 2**16 + (g) * 2**8 + (b);
    }
    
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
        return MMAPRENDER.createTexture(color, margin, height);
    }
    
    public.roadTile = [
        C.LOW,
        C.MID,
        C.HIG,
        C.NONE,
        C.VHI
    ];
    
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
    let getDataIdByCongestion = function asroad_getTileByCongestion(index)
    {
        let value = hasRoad(index) ? ASSTATE.getRoadUsedCapacity(index) : 0;
        if (value > 90)
        {
            return C.VHI;
        }
        else if (value > 60)
        {
            return C.HIG;
        }
        else if (value > 30)
        {
            return C.MID;
        }
        else if (value > 0)
        {
        	return C.LOW;
        }
        else
        {
        	return C.NONE;
        }
    }
    
    let getDataIdByTraversalState = function asroad_getTileByTraversalState(index)
    {
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
    
    public.getDataId = function asroad_getDataId(x, y)
    {
        const index = ASSTATE.getIndex(x, y);
        if (index < 0)
        {
            return 0;
        }
        if (C_DEBUG_TRAVERSAL)
        {
            return getDataIdByTraversalState(index);
        }
        else
        {
            return getDataIdByCongestion(index);
        }
    }
    
    let getIndexTo = function asroad_getIndexTo(x, y, d)
    {
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
            ASSTATE.setRoadConnectTo(from, d, to);
            ASSTATE.setRoadConnectTo(to, C_FROM[d], from);
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
            ASSTATE.setRoadConnectTo(from, d, -1);
        }
        if (hasRoad(to))
        {
            //delete ASSTATE.getRoad(to).connectTo[C_FROM[d]];
            ASSTATE.setRoadConnectTo(to, C_FROM[d], -1);
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
        //let to = ASSTATE.getRoad(from).connectTo[d];
        let to = ASSTATE.getRoadConnectTo(from, d);
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
            ASSTATE.setRoadType(index, 0);
            ASSTATE.setRoadConnectTo(index, C_TO.N, -1);
            ASSTATE.setRoadConnectTo(index, C_TO.E, -1);
            ASSTATE.setRoadConnectTo(index, C_TO.S, -1);
            ASSTATE.setRoadConnectTo(index, C_TO.W, -1);
            ASSTATE.setRoadUsedCapacity(index, 1);
            ASSTATE.setRoadMaxCapacity(index, 10);
            ASSTATE.setRoadDebug(index, C.LOW)
            changeDataIndex(index);
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
        if (x < 0 || y < 0)
        {
            return;
        }
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
            let usedCapacity = ASSTATE.getRoadUsedCapacity(from);
            setTraversalCost(from, usedCapacity);
            setTraversalParent(from, -1);
            setTraversalProcessed(from);
            expandTraversal(from, isConnectedTo(from, C_TO.N));
            expandTraversal(from, isConnectedTo(from, C_TO.E));
            expandTraversal(from, isConnectedTo(from, C_TO.S));
            expandTraversal(from, isConnectedTo(from, C_TO.W));
            ASSTATE.setRoadDebug(from, C.HIG);
            changeTraversalIndex(from);
        }
    }
    
    const C_TR = {
        FROM: 1,
        COST: 2,
        PARENT: 3,
        PROCESSED: 4
    };
    
    let expandTraversal = function asroad_expandTraversal(parent, node)
    {
        //console.log('expandTraversal d' + data + 'f' + from + 't' + to);
        if (hasRoad(node))
        {
            let usedCapacity = ASSTATE.getRoadUsedCapacity(node);
            if (parent >= 0)
            {
                let cost = getTraversalCost(parent);
                usedCapacity += cost;
                //setTraversalProcessed(data, index);
            }
            let edgeIndex = getTraversalEdgeCount();
            incrementTraversalEdgeCount();
            setTraversalCost(node, usedCapacity);
            setTraversalParent(node, parent);
            setTraversalAdded(node);
            ASSTATE.setRoadDebug(node, C.MID);
            changeTraversalIndex(node);
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
   
    let getCurrentNodeList = function asroad_getCurrentNodeList()
    {
        let startNode = getTraversalStart();
        let nodeList = [startNode];
        let i = 0;
        while (i < nodeList.length)
        {
            let parentNode = nodeList[i];
            addToNodeList(parentNode, C_TO.N, nodeList);
            addToNodeList(parentNode, C_TO.E, nodeList);
            addToNodeList(parentNode, C_TO.S, nodeList);
            addToNodeList(parentNode, C_TO.W, nodeList);
            i++;
        }
        return nodeList;
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
    }
    
    public.printTraversal = function asroad_printTraversal()
    {
        console.log();
        //console.log(data[0]);
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
    
    return public;
})();

let ASRICO = (function ()
{
    let public = {};
    
    public.C_NAME = 'asrico';
    
    public.C_TILEENUM = {
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
    const C = public.C_TILEENUM;
    
    public.getTileTextureName = function asrico_getTileTextureName(tileId)
    {
        return public.C_NAME + tileId;
    }
    
    let getColor = function asrico_getColor(r, g, b)
    {
        return (r) * 2**16 + (g) * 2**8 + (b);
    }
    
    const C_TILETEXTURE = {
        [C.NONE] : [getColor(255, 255, 255), 3],
        [C.RESLOW_0] : [getColor(76, 175, 80), 3],
        [C.RESLOW_1] : [getColor(76, 175, 80), 6],
        [C.RESLOW_2] : [getColor(76, 175, 80), 9],
        [C.INDLOW_0] : [getColor(255, 235, 59), 3],
        [C.INDLOW_1] : [getColor(255, 235, 59), 6],
        [C.INDLOW_2] : [getColor(255, 235, 59), 9],
        [C.COMLOW_0] : [getColor(33, 150, 243), 3],
        [C.COMLOW_1] : [getColor(33, 150, 243), 6],
        [C.COMLOW_2] : [getColor(33, 150, 243), 9],
    };
    
    // [level, type, offer ric, demand ric]
    
    const C_RICOPROPERTY = {
        [C.RESLOW_0] : [0, 1,   0,   0,   0,   0,   0,   0],
        [C.RESLOW_1] : [1, 1,   4,   0,   0,   0,   2,   2],
        [C.RESLOW_2] : [2, 1,  10,   0,   0,   0,   4,   6],
        [C.INDLOW_0] : [0, 2,   0,   0,   0,   0,   0,   0],
        [C.INDLOW_1] : [1, 2,   0,   4,   0,   2,   0,   2],
        [C.INDLOW_2] : [2, 2,   0,  10,   0,   6,   0,   4],
        [C.COMLOW_0] : [0, 3,   0,   0,   0,   0,   0,   0],
        [C.COMLOW_1] : [1, 3,   0,   0,   4,   2,   2,   0],
        [C.COMLOW_2] : [2, 3,   0,   0,  10,   4,   6,   0],
    };
    const C_R = C_RICOPROPERTY;
    
    let getTileTextureMargin = function asrico_getTileTextureMargin(id)
    {
        return 0;
    }
    
    public.createTexture = function asrico_createTexture(id)
    {
        let color = C_TILETEXTURE[id][0];
        let margin = getTileTextureMargin(id);
        let height = C_TILETEXTURE[id][1];
        return MMAPRENDER.createTexture(color, margin, height);
    }
    
    let getDataIdByDensityLevel = function asrico_getDataIdByDensityLevel(index)
    {
        let level = hasBuilding(index) ? ASSTATE.getBuildingData(ASSTATE.C_DATA.BUILDING_DENSITY_LEVEL, index) : 0;
        let type = hasBuilding(index) ? ASSTATE.getBuildingData(ASSTATE.C_DATA.BUILDING_TYPE, index) : 0;
        let id = C.NONE + 10*type + 1*level;
        if (isValidTileId(id))
        {
            return id;
        }
        return C.NONE;
    }
    
    public.getDataId = function asrico_getDataId(x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return C.NONE;
        }
        const index = ASSTATE.getIndex(x, y);
        return getDataIdByDensityLevel(index);
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
        ASSTATE.setRicoTickProgress(0);
        ASSTATE.setRicoStep(0);
    }
    
    public.setNextTick = function asrico_setNextTick(tick)
    {
        ASSTATE.setRicoTickProgress(0);
        ASSTATE.setRicoStep(0);
    }
    
    let addInitial = function asrico_addInitial(code, x, y)
    {
        if (!ASSTATE.isValidCoordinates(x, y))
        {
            return;
        }
        let index = ASSTATE.getIndex(x, y);
        if (!hasBuilding(index))
        {
            setInitial(code, index);
        }
    }
    
    let setInitial = function asrico_setInitial(code, index)
    {
        if (index == null || index < 0)
        {
            return;
        }
        ASSTATE.setZoneType(index, ASZONE.C_TYPE.BUILDING);
        ASSTATE.setBuildingType(index, 1);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_TICK_UPDATE, index, 0);
        let i = 0;
        ASSTATE.setBuildingDensity(index, C_R[code][i++]);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_TYPE, index, C_R[code][i++]);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_OFFER_R, index, C_R[code][i++]);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_OFFER_I, index, C_R[code][i++]);
        ASSTATE.setBuildingData(ASSTATE.C_DATA.BUILDING_OFFER_C, index, C_R[code][i++]);
        let dr = C_R[code][i++];
        let di = C_R[code][i++];
        let dc = C_R[code][i++];
        let demandRico = [dr, di, dc];
        ASSTATE.setBuildingDemandRico(index, demandRico);
        addChangeLogIndex(index);
    }
    
    public.addResLow = function asrico_addResLow(x, y)
    {
        addInitial(C.RESLOW_0, x, y);
    }
   
    public.addComLow = function asrico_addComLow(x, y)
    {
        addInitial(C.COMLOW_0, x, y);
    }
    
    public.addIndLow = function asrico_addIndLow(x, y)
    {
        addInitial(C.INDLOW_0, x, y);
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
        let progress = ASSTATE.getRicoTickProgress();
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tableSize = tableSizeX * tableSizeY;
        let elapsedCycle = 0;
        let tickSpeed = ASSTATE.getTickSpeed();
        // polling mode
        while ((progress < tableSize) && (Date.now() < timeLimit))
        {
            let index = progress;
            if (updateBuilding(index))
            {
                progress += 1;
            }
            elapsedCycle += 1;
            ASSTATE.setRicoTickProgress(progress);
            if (tickSpeed > 1000) // exception case
            {
                break;
            }
        }
        let complete = ASSTATE.getRicoTickProgress() >= tableSize;
        return complete;
    }
    
    let isDemandRicoFilled = function asrico_isDemandRicoFilled(demand)
    {
        return demand[0] <= 0 && demand[1] <= 0 && demand[2] <= 0;
    }
    
    let levelDensityUp = function asrico_levelDensityUp(index)
    {
        let density = ASSTATE.getBuildingDensity(index);
        ASSTATE.setBuildingDensity(index, density + 1);
        let code = getDataIdByDensityLevel(index);
        //console.log(code);
        setInitial(code, index);
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
                console.log('level up ' + index);
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
            let next = ASROAD.getNextStepTraversal();
            let nx = next[0];
            let ny = next[1];
            if (nx < 0 || ny < 0) // traversal finished
            {
                ASSTATE.setRicoStep(3);
            }
            return false;
        }
        else
        {
            ASROAD.resetTraversalPath();
            ASSTATE.setRicoStep(0);
            return true;
        }
    }
    
    let hasBuilding = function asrico_hasBuilding(i)
    {
        if (typeof i === 'undefined' || i == null || i < 0)
        {
            return false;
        }
        let data = ASSTATE.getZoneType(i);
        return !((typeof data === 'undefined') || (data == null)) && (data == ASZONE.C_TYPE.BUILDING);
    }
    
    return public;
})();