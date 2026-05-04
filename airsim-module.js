// LOADED BY (worker thread)
//   pse-edit-modules.js
// IS (worker thread)
//   airsim-module.js
// LOADS (worker thread)
//   ???

const G_CHECK = true;
const G_CACHE_NODE = true;

var ASSTATE = {};
var ASROADW = {};

var ASWENGINE = (function ()
{
    let public = {};
    public.EXPORT = {};

    public.C_NAME = 'ASWENGINE';
    
    public.initializeModule = function aswengine_initializeModule(... args)
    {
        ASSTATE = G_WASM_ENGINE.ASSTATE.new();
        ASROADW = G_WASM_ENGINE.ASROAD.new();
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

    public.setTickSpeed = function aswengine_setTickSpeed(data) //
    {
        ASSTATE.setTickSpeed(data);
    }
    public.EXPORT.setTickSpeed = public.setTickSpeed;

    public.getSerializable = function aswengine_getSerializable()
    {
        return ASSTATE.getSerializable();
    }
    public.EXPORT.getSerializable = public.getSerializable;

    public.setSerializable = function aswengine_setSerializable(string)
    {
        ASSTATE.setSerializable(string);
        ASROAD.resetInternal();
    }
    public.EXPORT.setSerializable = public.setSerializable;
    
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

// ---------------------
var ASZONE = (function ()
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
    let m_accumZone = 0, m_accumRoad = 0, m_accumRico = 0;
    let m_lastZone = 0, m_lastRoad = 0, m_lastRico = 0;

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
        let t0 = Date.now();
        engineComplete &= engineComplete ? public.updateZone(tick, timeLimit) : false;
        m_accumZone += Date.now() - t0;
        let t1 = Date.now();
        engineComplete &= engineComplete ? ASROAD.updateRoad(tick, timeLimit) : false;
        m_accumRoad += Date.now() - t1;
        let t2 = Date.now();
        engineComplete &= engineComplete ? ASRICO.updateRico(tick, timeLimit) : false;
        m_accumRico += Date.now() - t2;
        const enoughTimeElapsed = Math.abs(time - m_lastTickTime) >= tickSpeed;
        if (engineComplete && enoughTimeElapsed)
        {
            m_lastZone = m_accumZone;
            m_lastRoad = m_accumRoad;
            m_lastRico = m_accumRico;
            m_accumZone = 0;
            m_accumRoad = 0;
            m_accumRico = 0;
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

    public.getInfoTiming = function aszone_getInfoTiming()
    {
        return [m_lastZone, m_lastRoad, m_lastRico];
    }
    public.EXPORT.getInfoTiming = public.getInfoTiming;
    
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
                let xMod = x % 15;
                if (x % 5 == 0 || y % 5 == 0)
                {
                    paintZone(x, y, roadId);
                }
                else if (xMod >= 1 && xMod <= 4)
                {
                    paintZone(x, y, resId);
                }
                else if (xMod >= 6 && xMod <= 9)
                {
                    paintZone(x, y, comId);
                }
                else if ((xMod == 11 || xMod == 12) && y == 1)
                {
                    paintZone(x, y, C.POWLOW);
                }
                else if (xMod >= 11 && xMod <= 14)
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

var ASROAD = (function ()
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
    
    let getRoadType = function asroad_getRoadType(index) //
    {
        return ASROADW.getRoadType(ASSTATE, index);
    }
    
    let changeDataIndex = function asroad_changeDataIndex(index) //
    {
        ASROADW.changeDataIndex(ASSTATE, index);
    }
    
    let changeTraversalIndex = function asroad_changeTraversalIndex(index) //
    {
        ASROADW.changeTraversalIndex(ASSTATE, index);
        /*if (C_DEBUG_TRAVERSAL)
        {
            ASSTATE.notifyChange(index);
        }*/
    }
    
    // for display
    public.getDataIdByCongestion = function asroad_getDataIdByCongestion(x, y)
    {
        return ASROADW.getDataIdByCongestion(ASSTATE, x, y);
    }
    
    public.getDataIdByTraversalState = function asroad_getDataIdByTraversalState(x, y)
    {
        return ASROADW.getDataIdByTraversalState(ASSTATE, x, y);
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
    
    let hasRoad = function asroad_hasRoad(index)
    {
        return ASROADW.hasRoad(ASSTATE, index);
    }
    public.hasRoad = hasRoad;
    
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
        return ASROADW.getRoadMaximumCarFlow(ASSTATE, index);
    }
    
    let getRoadSpeed = function asroad_getRoadSpeed(index)
    {
        return ASROADW.getRoadSpeed(ASSTATE, index);
    }
    
    let getRoadCarFlowRatio = function asroad_getRoadCarFlowRatio(index)
    {
        return ASROADW.getRoadCarFlowRatio(ASSTATE, index);
    }
    
    let getRoadLastCarFlowRatio = function asroad_getRoadLastCarFlowRatio(index)
    {
        return ASROADW.getRoadLastCarFlowRatio(ASSTATE, index);
    }
    
    let getRoadTrafficDecay = function asroad_getRoadTrafficDecay(index)
    {
        return ASROADW.getRoadTrafficDecay(ASSTATE, index);
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
    
    public.getTraversalPath = function asroad_getTraversalPath()
    {
        let lastNode = ASSTATE.getRoadTraversalCurrentIndex();
        if (!ASSTATE.isValidIndex(lastNode))
        {
            return [-1, -1];
        }
        let reversePathNode = [];
        while (!ASRICO.hasBuilding(lastNode))
        {
            reversePathNode.push(lastNode);
            lastNode = ASSTATE.getRoadTraversalParent(lastNode);
        }
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
    public.EXPORT.getTraversalPath = public.getTraversalPath;

    public.resetTraversalPath = function asroad_resetTraversalPath()
    {
        ASROADW.resetTraversal(ASSTATE);
    }
    public.EXPORT.resetTraversalPath = public.resetTraversalPath;

    public.resetInternal = function asroad_resetInternal()
    {
    }

    public.printTraversal = function asroad_printTraversal()
    {
        console.log();
    }
    public.EXPORT.printTraversal = public.printTraversal;
    
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

var ASRICO = (function ()
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
    const C_RICO_SCALE = 100;
    const C_RICOPROPERTY = {
        [getCode(C_Z.RESLOW, 0)] : [0,  1,     0,     0,     0,   100],
        [getCode(C_Z.RESLOW, 1)] : [1,  1,  -200,     0,   200,   100],
        [getCode(C_Z.RESLOW, 2)] : [2,  1,  -400,     0,   400,   100],
        [getCode(C_Z.RESLOW, 3)] : [3,  1,  -600,     0,   600,   100],
        [getCode(C_Z.RESLOW, 4)] : [4,  1,  -800,     0,   800,   100],
        [getCode(C_Z.RESLOW, 5)] : [5,  1, -1000,     0,  1000,   200],
        [getCode(C_Z.RESHIG, 0)] : [0,  2,     0,     0,     0,   100],
        [getCode(C_Z.RESHIG, 1)] : [1,  2, -1000,     0,  1000,   200],
        [getCode(C_Z.RESHIG, 2)] : [2,  2, -1600,     0,  1600,   200],
        [getCode(C_Z.RESHIG, 3)] : [3,  2, -2400,     0,  2400,   300],
        [getCode(C_Z.RESHIG, 4)] : [4,  2, -3400,     0,  3400,   400],
        [getCode(C_Z.RESHIG, 5)] : [5,  2, -5000,     0,  5000,   500],
        [getCode(C_Z.INDLOW, 0)] : [0,  3,     0,     0,     0,   100],
        [getCode(C_Z.INDLOW, 1)] : [1,  3,   200,  -200,     0,   200],
        [getCode(C_Z.INDLOW, 2)] : [2,  3,   400,  -400,     0,   200],
        [getCode(C_Z.INDLOW, 3)] : [3,  3,   600,  -600,     0,   300],
        [getCode(C_Z.INDLOW, 4)] : [4,  3,   800,  -800,     0,   300],
        [getCode(C_Z.INDLOW, 5)] : [5,  3,  1000, -1000,     0,   400],
        [getCode(C_Z.INDHIG, 0)] : [0,  5,     0,     0,     0,   100],
        [getCode(C_Z.INDHIG, 1)] : [1,  5,  1000, -1000,     0,   500],
        [getCode(C_Z.INDHIG, 2)] : [2,  5,  1600, -1600,     0,   800],
        [getCode(C_Z.INDHIG, 3)] : [3,  5,  2400, -2400,     0,  1200],
        [getCode(C_Z.INDHIG, 4)] : [4,  5,  3400, -3400,     0,  1700],
        [getCode(C_Z.INDHIG, 5)] : [5,  5,  5000, -5000,     0,  2500],
        [getCode(C_Z.COMLOW, 0)] : [0,  2,     0,     0,     0,   100],
        [getCode(C_Z.COMLOW, 1)] : [1,  2,   100,   100,  -200,   200],
        [getCode(C_Z.COMLOW, 2)] : [2,  2,   200,   200,  -400,   200],
        [getCode(C_Z.COMLOW, 3)] : [3,  2,   300,   300,  -600,   300],
        [getCode(C_Z.COMLOW, 4)] : [4,  2,   400,   400,  -800,   300],
        [getCode(C_Z.COMLOW, 5)] : [5,  2,   500,   500, -1000,   400],
        [getCode(C_Z.COMHIG, 0)] : [0,  3,     0,     0,     0,   100],
        [getCode(C_Z.COMHIG, 1)] : [1,  3,   500,   500, -1000,   500],
        [getCode(C_Z.COMHIG, 2)] : [2,  3,   800,   800, -1600,   700],
        [getCode(C_Z.COMHIG, 3)] : [3,  3,  1200,  1200, -2400,   900],
        [getCode(C_Z.COMHIG, 4)] : [4,  3,  1700,  1700, -3400,  1100],
        [getCode(C_Z.COMHIG, 5)] : [5,  3,  2500,  2500, -5000,  1300],
        [getCode(C_Z.POWLOW, 0)] : [0,  0,     0,     0,     0, -20000]
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
        let demandProp = getInitialDemandOffer(code);
        ASSTATE.setRicoMaxReceivedR(index, demandProp[0]);
        ASSTATE.setRicoMaxReceivedI(index, demandProp[1]);
        ASSTATE.setRicoMaxReceivedC(index, demandProp[2]);
        ASSTATE.setRicoMaxReceivedP(index, demandProp[3]);
        ASSTATE.setRicoLevelStreak(index, 0);
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
        ASSTATE.setRicoDemandOfferR(index, demandOffer[0]);
        ASSTATE.setRicoDemandOfferI(index, demandOffer[1]);
        ASSTATE.setRicoDemandOfferC(index, demandOffer[2]);
        ASSTATE.setRicoDemandOfferP(index, demandOffer[3]);
        ASSTATE.setRicoTotalReceivedR(index, 0);
        ASSTATE.setRicoTotalReceivedI(index, 0);
        ASSTATE.setRicoTotalReceivedC(index, 0);
        ASSTATE.setRicoTotalReceivedP(index, 0);
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
        let r = ASSTATE.getRicoDemandOfferR(offerIndex);
        let i = ASSTATE.getRicoDemandOfferI(offerIndex);
        let c = ASSTATE.getRicoDemandOfferC(offerIndex);
        let p = ASSTATE.getRicoDemandOfferP(offerIndex);
        return (r < 0 ? r : 0) + (i < 0 ? i : 0) + (c < 0 ? c : 0) + (p < 0 ? p : 0);
    }
    
    let canLevelUp = function asrico_canLevelUp(index)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level + 1);
        let flag = isCodeValid(code);
        let demandOffer = [
            ASSTATE.getRicoDemandOfferR(index),
            ASSTATE.getRicoDemandOfferI(index),
            ASSTATE.getRicoDemandOfferC(index),
            ASSTATE.getRicoDemandOfferP(index)
        ];
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
        
        let demandOffer = [
            ASSTATE.getRicoDemandOfferR(index),
            ASSTATE.getRicoDemandOfferI(index),
            ASSTATE.getRicoDemandOfferC(index),
            ASSTATE.getRicoDemandOfferP(index)
        ];

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
            let code = getDataIdByDensityLevel(index);
            setInitial(code, index);
            incrementStatOfferTotal(index);
            incrementStatDemandTotal(index);
            ASSTATE.setRicoStep(1);
            return false;
        }
        else
        {
            let isConnected = ASSTATE.getRoadConnected(index);
            if (isConnected && getRicoOfferSum(index) < 0)
            {
                let xy = ASSTATE.getXYFromIndex(index);
                let nodeList = ASROADW.runTraversal(ASSTATE, xy[0], xy[1]);
                for (let i = 0; i < nodeList.length; i++)
                {
                    if (getRicoOfferSum(index) >= 0) break;
                    let node = nodeList[i];
                    let nxy = ASSTATE.getXYFromIndex(node);
                    ASSTATE.setRoadTraversalCurrentIndex(node);
                    let filledOffer = dispatchOffer(index, nxy[0], nxy[1]);
                    let additionalCongestion = convertFlowTypeToCongestion(index, filledOffer);
                    increaseCongestion(additionalCongestion);
                }
                ASROAD.resetTraversalPath();
            }
            ASSTATE.setRicoStep(0);
            return true;
        }
    }
    
    let convertFlowTypeToCongestion = function asrico_convertFlowTypeToCongestion(index, filledOffer)
    {
        let zone = ASSTATE.getZoneId(index);
        let level = ASSTATE.getRicoDensity(index);
        let code = getCode(zone, level);
        return (C_R[code][C_RM.TRAFFIC] * filledOffer / C_RICO_SCALE) | 0;
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
        let offer = [
            ASSTATE.getRicoDemandOfferR(offerIndex),
            ASSTATE.getRicoDemandOfferI(offerIndex),
            ASSTATE.getRicoDemandOfferC(offerIndex),
            ASSTATE.getRicoDemandOfferP(offerIndex)
        ];
        let filledOffer = 0;
        for (let i in demandIndexList)
        {
            let demandIndex = demandIndexList[i];
            let demand = [
                ASSTATE.getRicoDemandOfferR(demandIndex),
                ASSTATE.getRicoDemandOfferI(demandIndex),
                ASSTATE.getRicoDemandOfferC(demandIndex),
                ASSTATE.getRicoDemandOfferP(demandIndex)
            ];
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
            ASSTATE.setRicoDemandOfferR(demandIndex, demand[0]);
            ASSTATE.setRicoDemandOfferI(demandIndex, demand[1]);
            ASSTATE.setRicoDemandOfferC(demandIndex, demand[2]);
            ASSTATE.setRicoDemandOfferP(demandIndex, demand[3]);
        }
        ASSTATE.setRicoDemandOfferR(offerIndex, offer[0]);
        ASSTATE.setRicoDemandOfferI(offerIndex, offer[1]);
        ASSTATE.setRicoDemandOfferC(offerIndex, offer[2]);
        ASSTATE.setRicoDemandOfferP(offerIndex, offer[3]);
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
            " D:" + [ASSTATE.getRicoDemandOfferR(index), ASSTATE.getRicoDemandOfferI(index), ASSTATE.getRicoDemandOfferC(index), ASSTATE.getRicoDemandOfferP(index)] +
            " " + getInitialDemand(code) +
            " " + getInitialOffer(code);
    }
    public.EXPORT.getInfoRico = public.getInfoRico;
    
    return public;
})();

var ASTILEVIEW = (function ()
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