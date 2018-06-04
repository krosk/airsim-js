let Nano = require('nano-ecs')();
let PF = require('pathfinding');
let Benchmark = require('benchmark');

'use strict';

const G_CHECK = true;

(function ()
{
    let exLog = console.log;
    console.log = function (msg)
    {
        exLog.apply(this, arguments);
        if (typeof g_debugOverlay != 'undefined')
        {
            //exLog.apply(this, arguments);
            g_debugOverlay.innerHTML += msg + "<br>";
        }
    }
    
    console.clear = function ()
    {
        if (typeof g_debugOverlay != 'undefined')
        {
            //exLog.apply(this, arguments);
            g_debugOverlay.innerHTML = "";
        }
    }
})();

// from https://github.com/github/fetch/pull/92#issuecomment-140665932
function fetchLocal(url)
{
    return new Promise(function(resolve, reject)
    {
        let xhr = new XMLHttpRequest;
        xhr.onload = function()
        {
            function contains(value, searchFor)
            {
                return (value || '').indexOf(searchFor) > -1;
            }
            
            if (xhr.status == 0)
            {
                resolve(xhr.responseText);
            }
            else
            {
                resolve(
                    new Response(xhr.responseText, {status: xhr.status})
                );
            }
        }
        xhr.onerror = function()
        {
            reject(
                new TypeError('Local request failed')
            );
        }
        xhr.open('GET', url);
        xhr.send(null);
    });
}

function adaptativeFetch(url)
{
    return fetch(url)
    .then(response => {
        console.log('fetch success');
        return response;
    }).catch(error => {
        return fetchLocal("program.wasm")
	    .then(response => {
            console.log('xhr request success');
            return response;
        }).catch(error => {
            console.log('failed to fetch');
            console.log(error);
            reject(error);
	    });
	});
}

// function naming conventions
// Change state: verb
// no change: get

let g_state = WaitingState;
let g_engineLoaded = false;

function OnReady()
{
    adaptativeFetch("program.wasm")
    .then(response => {
        response;
        g_engineLoaded = true;
    });
    
    g_stats = new Stats();

    g_updateTimestamp = Date.now();

    g_app = new PIXI.Application(window.innerWidth, window.innerHeight);

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    let amount = (g_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;
    if (amount == 5)
    {
        //g_app.renderer.context.mozImageSmoothingEnabled = false
        //g_app.renderer.context.webkitImageSmoothingEnabled = false;
    }

    g_app.renderer.view.style["transform"] = "translatez(0)";
    document.body.appendChild(g_app.view);
    g_app.renderer.view.style.position = "absolute";

    InitializeDebugOverlay();

    g_interactionManager = g_app.renderer.plugins.interaction;
    console.log("touch " + g_interactionManager.supportsTouchEvents);
    g_interactionManager.moveWhenInside = true;

    document.body.appendChild(g_stats.domElement);

    /*
    PIXI.loader.add("img/cityTiles_sheet.json")
        .on("progress", LoaderProgressHandler)
        .load(LoaderSetup);
    */
    
    g_state = StartState;

    window.onresize = Resize;
    Resize();

    g_app.ticker.add(Update);

    console.log("Ready");
}

function InitializeDebugOverlay()
{
    g_debugOverlay = document.createElement("div");
    g_debugOverlay.className = "debug";
    g_debugOverlay.innerHTML = "";
    g_debugOverlay.style.position = "absolute";
    g_debugOverlay.style.color = "#0ff";
    g_debugOverlay.style.fontSize = "16px";
    g_debugOverlay.style.userSelect = "none";
    document.body.appendChild(g_debugOverlay);

    g_debugOverlay.style.left = 0 + "px";
    g_debugOverlay.style.top = 58 + "px";
    g_debugOverlay.style.maxWidth = 180 + "px";
    g_debugOverlay.style.maxHeight = 180 + "px";
    g_debugOverlay.style.overflow = "scroll";

    g_counter = document.createElement("div");
    g_counter.className = "counter";
    g_counter.innerHTML = 0;
    g_counter.style.position = "absolute";
    g_counter.style.color = "#0ff";
    g_counter.style.fontSize = "16px";
    g_counter.style.userSelect = "none";
    document.body.appendChild(g_counter);

    g_counter.style.left = 100 + "px";
    g_counter.style.top = 0 + "px";
}

function LoaderProgressHandler(loader, resource)
{
    console.log(resource.url);
    console.log(loader.progress);
}

function LoaderSetup()
{
    console.log("image loaded");
    g_state = StartState;
}

function Resize()
{
    console.log('resizing');
    let width = window.innerWidth - 8;
    let height = window.innerHeight - 8;

    g_app.renderer.view.style.left = 0;
    g_app.renderer.view.style.top = 0;
    g_app.renderer.resize(width, height);
    
    ASMAPUI.resize();
}

function WaitingState()
{
    // do nothing, wait for loader
}

function AddPaxRandom()
{
    let width = ASMAP.getWidth();
    let height = ASMAP.getHeight();
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);
    ASPAX.create(x, y);
}

function pfFormatTestGrid(grid, w, h)
{
    for (i = 0; i < h - 3; i++)
    {
        for (j = 1; j < w - 6; j += 6)
        {
            grid.setWalkableAt(j, i, false);
            grid.setWalkableAt(j + 3, h - i - 1, false);
        }
    }
}

function StartState()
{
    console.log("Start");
    ASMAP.initialize(16, 16);
    pfFormatTestGrid(ASMAP.Grid, ASMAP.Width, ASMAP.Height);
    for (i = 1; i < 0xFF * 12; i++)
    {
        //AddPaxRandom();
    }
    g_state = EngineState;
}

function EngineState()
{
    ASMAP.update(g_updateDelta, g_updateTimestamp);
    //ASRENDER.update(g_updateDelta, g_updateTimestamp);
    //ASRANDOMMOVE.update(g_updateDelta, g_updateTimestamp);
}

let g_frameCounter = 0;
let g_updateTimestamp = Date.now();
let g_updateDelta = 0;

function Update()
{
    g_updateDelta = Date.now() - g_updateTimestamp;
    g_updateTimestamp = Date.now();
    g_stats.begin();
    g_state();
    g_stats.end();
    g_frameCounter++;
    let endUpdateTimestamp = Date.now() - g_updateTimestamp;
    if (endUpdateTimestamp > 1000 / 60.0)
    {
        //console.log(endUpdateTimestamp);
    }
    else
    {
        //console.log(g_frameCounter);
    }
}
// ---------------------
let MUTIL = (function ()
{
    let public = {};
    
    public.mathCantor = function mutil_mathCantor(X, Y)
    {
        return (X + Y) * (X + Y + 1) / 2 + Y;
    }

    public.mathReverseCantorPair = function mutil_mathReverseCantorPair(z)
    {
        let pair = [];
        let t = Math.floor((-1 + Math.sqrt(1 + 8 * z)) / 2);
        let x = t * (t + 3) / 2 - z;
        let y = z - t * (t + 1) / 2;
        pair[0] = x;
        pair[1] = y;
        return pair;
    }
    
    return public;
})();
// ---------------------
let ASMAP = (function ()
{
    let public = {};

    public.initialize = function asmap_initialize(w, h)
    {
        ASSTATE.initialize(w, h);
        ASZONE.initialize();
        ASZONE.initializeTexture();
        ASROAD.initializeTexture();
        ASRICO.initialize();
        ASRICO.initializeTexture();
        MMAPDATA.initialize(w, h, ASZONE);
        MMAPRENDER.initialize(doSingleClick, doDoubleClick);
        ASMAPUI.initialize();
    }

    public.getWidth = function asmap_getWidth()
    {
        return MMAPDATA.getMapTableSizeX();
    }

    public.getHeight = function asmap_getHeight()
    {
        return MMAPDATA.getMapTableSizeY();
    }

    public.update = function asmap_update(dt, time)
    {
        let slowdown = MMAPRENDER.update(dt, time);
        if (ASROAD.hasChangeLog())
        {
            ASROAD.commitChangeLog(1024);
        }
        else if (ASRICO.hasChangeLog())
        {
            ASRICO.commitChangeLog(1024);
        }
        else if (ASSTATE.getPlay() != 0)
        {
            ASZONE.update(slowdown, time);
        }
    }
    
    let doZoneViewSingleClick = function asmap_doZoneViewSingleClick(x, y)
    {
        let selectedId = ASMAPUI.getCurrentZoneId();
        if (selectedId == ASZONE.C_TILEENUM.ROAD)
        {
            ASROAD.addRoad(x, y);
        }
         else
        {
            ASROAD.removeRoad(x, y);
        }
        ASZONE.setZone(x, y, selectedId);
        //console.log(ASROAD.findNearestRoad(x, y));
    }
    
    let doRoadViewSingleClick = function asmap_doRoadViewSingleClick(x, y)
    {
        let selectedId = ASMAPUI.getCurrentRoadId();
        if (selectedId == ASROAD.C_TILEENUM.LOW)
        {
            ASROAD.initializeTraversal(x, y);
            //console.log('start traversal x' + x + 'y' + y + 'c' + m_roadTraversalTemp);
        }
        else if (selectedId == ASROAD.C_TILEENUM.MID)
        {
            let next = ASROAD.getNextStepTraversal();
            //console.log('incre traversal x' + next[0] + 'y' + next[1] + 'c' + m_roadTraversalTemp);
        }
        else if (selectedId == ASROAD.C_TILEENUM.HIG)
        {
            let pathXY = ASROAD.getTraversalPath();
            //console.log('finish traversal');
            console.log(pathXY);
        }
        else if (selectedId == ASROAD.C_TILEENUM.NONE)
        {
            ASROAD.resetTraversalPath();
        }
        else if (selectedId == ASROAD.C_TILEENUM.VHI)
        {
            ASROAD.printTraversal();
        }
    }
    
    let doSingleClick = function asmap_doSingleClick(x, y)
    {
        if (ASMAPUI.isZoneMode())
        {
            doZoneViewSingleClick(x, y);
        }
        if (ASMAPUI.isRoadMode())
        {
            doRoadViewSingleClick(x, y);
        }
    }
    
    let doDoubleClick = function asmap_doDoubleClick(x, y)
    {
        console.log('d' + x + ',' + y);
    }

    return public;
})();
// ---------------------
let ASMAPUI = (function ()
{
    let public = {};
    
    let C_ICON_HEIGHT = 48;
    let C_ICON_WIDTH = 64;
    
    let m_uiLayer;
    let m_uiZoneSpriteTable = {};
    let m_uiViewSpriteTable = {};
    let m_uiRoadSpriteTable = {};
    let m_uiRicoSpriteTable = {};
    let m_uiSaveSpriteTable = {};
    let m_uiPlaySpriteTable = {};
    
    let m_currentZoneId = 0;
    let m_currentViewId = 0;
    let m_currentRoadId = 0;
    let m_currentRicoId = 0;
    let m_currentSaveId = 0;
    let m_currentPlayId = 0;
    
    public.initialize = function asmapui_initialize()
    {
        m_uiLayer = new PIXI.Container();
        g_app.stage.addChild(m_uiLayer);
        m_uiLayer.interactive = false;
        
        m_currentViewId = ASZONE.viewTile[0];
        m_currentZoneId = ASZONE.zoneTile[0];
        m_currentRoadId = ASROAD.roadTile[0];
        m_currentRicoId = ASZONE.ricoTile[0];
        m_currentSaveId = ASZONE.saveTile[0];
        m_currentPlayId = ASZONE.playTile[0];
        
        public.resize();
    }
    
    let buildMenu = function asmapui_buildMenu(tileEnums, tileTable, tileFunction, level)
    {
        let landscape = MMAPRENDER.isOrientationLandscape();
        let c = 0;
        let backgroundWidth = 0;
        let backgroundHeight = 0;
        let maxWidth = 0;
        let maxHeight = 0;
        for (let i in tileEnums)
        {
            let tileId = tileEnums[i];
            let sprite = tileFunction(tileId);
            m_uiLayer.addChild(sprite);
            tileTable[tileId] = sprite;
            if (maxWidth < sprite.width)
            {
                maxWidth = sprite.width;
            }
            if (maxHeight < sprite.height)
            {
                maxHeight = sprite.height;
            }
            sprite.visible = false;
        }
        if (landscape)
        {
            backgroundWidth = C_ICON_WIDTH;
            backgroundHeight = getLayerHeight();
        }
        else
        {
            backgroundWidth = getLayerWidth();
            backgroundHeight = C_ICON_HEIGHT;
        }
        for (let i in tileEnums)
        {
            let tileId = tileEnums[i];
            let sprite = tileTable[tileId];
            if (landscape)
            {
                sprite.x = getLayerWidth() - backgroundWidth*(1+level);
                sprite.y = c*maxHeight;
            }
            else
            {
                sprite.x = c*maxWidth;
                sprite.y = getLayerHeight() - backgroundHeight*(1+level);
            }
            c++;
        }
        
        let background = createMenuBackground(backgroundWidth, backgroundHeight);
        m_uiLayer.addChildAt(background, 0);
        if (landscape)
        {
            background.x = getLayerWidth() - background.width * (1+level);
        }
        else
        {
            background.y = getLayerHeight() - background.height * (1+level);
        }
    }
    
    public.resize = function asmapui_resize()
    {
        if (typeof m_uiLayer === 'undefined')
        {
            return;
        }
        
        let landscape = MMAPRENDER.isOrientationLandscape();
        
        m_uiLayer.removeChildren();
        m_uiZoneSpriteTable = {};
        m_uiViewSpriteTable = {};
        m_uiRoadSpriteTable = {};
        m_uiRicoSpriteTable = {};
        m_uiSaveSpriteTable = {};
        m_uiPlaySpriteTable = {};
        
        let c = 0;
        let maxHeight = 0;
        let maxWidth = 0;
        let zoneEnums = ASZONE.zoneTile;
        buildMenu(zoneEnums, m_uiZoneSpriteTable, createZoneSprite, 1);
        
        let roadEnums = ASROAD.roadTile;
        buildMenu(roadEnums, m_uiRoadSpriteTable, createRoadSprite, 1);
        
        let ricoEnums = ASZONE.ricoTile;
        buildMenu(ricoEnums, m_uiRicoSpriteTable, createRicoSprite, 1);
        
        let saveEnums = ASZONE.saveTile;
        buildMenu(saveEnums, m_uiSaveSpriteTable, createSaveSprite, 1);
        
        let playEnums = ASZONE.playTile;
        buildMenu(playEnums, m_uiPlaySpriteTable, createPlaySprite, 1);

        let viewEnums = ASZONE.viewTile;
        buildMenu(viewEnums, m_uiViewSpriteTable, createViewSprite, 0);
        
        focusZoneSprite();
        focusViewSprite();
        focusRoadSprite();
        focusRicoSprite();
        focusSaveSprite();
        focusPlaySprite();
    }
    
    public.getCurrentZoneId = function asmapui_getCurrentZoneId()
    {
        return m_currentZoneId;
    }
    
    let isViewMode = function asmapui_isViewMode(mode)
    {
        const viewEnums = ASZONE.viewTile;
        return getCurrentViewId() == viewEnums[mode];
    }
    
    public.isZoneMode = function asmapui_isZoneMode()
    {
        return isViewMode(0);
    }
    
    public.isRoadMode = function asmapui_isRoadMode()
    {
        return isViewMode(1);
    }
    
    public.isRicoMode = function asmapui_isRicoMode()
    {
        return isViewMode(2);
    }
    
    public.isSaveMode = function asmapui_isSaveMode()
    {
        return isViewMode(3);
    }
    
    public.isPlayMode = function asmapui_isPlayMode()
    {
        return isViewMode(4);
    }
    
    let getCurrentViewId = function asmapui_getCurrentViewId()
    {
        return m_currentViewId;
    }
    
    public.getCurrentRoadId = function asmapui_getCurrentRoadId()
    {
        return m_currentRoadId;
    }
    
    let focusSprite = function asmapui_focusSprite(spriteTable, currentId, visible)
    {
        let keys = Object.keys(spriteTable);
        for (let i in keys)
        {
            let id = keys[i];
            let sprite = spriteTable[id];
            sprite.alpha = id == currentId ? 1 : 0.25;
            sprite.visible = visible;
        }
    }
    
    let focusZoneSprite = function asmapui_focusZoneSprite()
    {
        focusSprite(m_uiZoneSpriteTable, m_currentZoneId, public.isZoneMode());
    }
    
    let focusViewSprite = function asmapui_focusViewSprite()
    {
        focusSprite(m_uiViewSpriteTable, m_currentViewId, true);
    }
    
    let focusRoadSprite = function asmapui_focusRoadSprite()
    {
        focusSprite(m_uiRoadSpriteTable, m_currentRoadId, public.isRoadMode());
    }
    
    let focusRicoSprite = function asmapui_focusRicoSprite()
    {
        focusSprite(m_uiRicoSpriteTable, m_currentRicoId, public.isRicoMode());
    }
    
    let focusSaveSprite = function asmapui_focusSaveSprite()
    {
        focusSprite(m_uiSaveSpriteTable, m_currentSaveId, public.isSaveMode());
    }
    
    let focusPlaySprite = function asmapui_focusPlaySprite()
    {
        focusSprite(m_uiPlaySpriteTable, m_currentPlayId, public.isPlayMode());
    }
    
    let getLayerWidth = function asmapui_getLayerWidth()
    {
        return g_app.renderer.width;
    }
    let getLayerHeight = function asmap_getLayerHeight()
    {
        return g_app.renderer.height;
    }
    
    let createSprite = function asmapui_createSprite(id, callback, library)
    {
        let textureName = library.getTileTextureName(id);
        let textureCache = PIXI.utils.TextureCache[textureName];
        let sprite = new PIXI.Sprite(textureCache);
        sprite.interactive = true;
        sprite.on('pointerdown',
            function(e){callback(e, id);});
        return sprite;
    }
    
    let createZoneSprite = function asmapui_createZoneSprite(tileId)
    {
        return createSprite(tileId, onZoneSpritePress, ASZONE);
    }
    
    let createViewSprite = function asmapui_createViewSprite(viewId)
    {
        return createSprite(viewId, onViewSpritePress, ASZONE);
    }
    
    let createRoadSprite = function asmapui_createRoadSprite(roadId)
    {
        return createSprite(roadId, onRoadSpritePress, ASROAD);
    }
    
    let createRicoSprite = function asmapui_createRicoSprite(ricoId)
    {
        return createSprite(ricoId, onRicoSpritePress, ASZONE);
    }
    
    let createSaveSprite = function asmapui_createSaveSprite(saveId)
    {
        return createSprite(saveId, onSaveSpritePress, ASZONE);
    }
    
    let createPlaySprite = function asmapui_cratePlaySprite(playId)
    {
        return createSprite(playId, onPlaySpritePress, ASZONE);
    }
    
    let createMenuBackground = function asmapui_createMenuBackground(width, height)
    {
        let graphics = new PIXI.Graphics();

        let black = 0x000000;
        let white = 0xFFFFFF;
        graphics.beginFill(white);
        graphics.lineStyle(1, black);
        
        let H = height;
        let W = width;

        // draw a rectangle
        graphics.moveTo(0, 0);
        graphics.lineTo(W, 0);
        graphics.lineTo(W, H);
        graphics.lineTo(0, H);
        
        graphics.endFill();
        
        let texture = g_app.renderer.generateTexture(graphics);
        let sprite = new PIXI.Sprite(texture)
        return sprite;
    }
    
    let onZoneSpritePress = function asmapui_onZoneSpritePress(event, zoneId)
    {
        m_currentZoneId = zoneId;
        focusZoneSprite();
    }
    
    let refreshMapDisplay = function asmapui_refreshMapDisplay()
    {
        let viewEnums = ASZONE.viewTile;
        if (public.isZoneMode())
        {
            MMAPDATA.switchData(ASZONE);
        }
        else if (public.isRoadMode())
        {
            MMAPDATA.switchData(ASROAD);
        }
        else if (public.isRicoMode())
        {
            MMAPDATA.switchData(ASRICO);
        }
    }
    
    let onViewSpritePress = function asmapui_onViewSpritePress(event, viewId)
    {
        let refresh = m_currentViewId != viewId;
        m_currentViewId = viewId;
        focusViewSprite();
        focusZoneSprite();
        focusRoadSprite();
        focusRicoSprite();
        focusSaveSprite();
        focusPlaySprite();
        if (refresh)
        {
            refreshMapDisplay();
        }
    }
    
    let onRoadSpritePress = function asmapui_onRoadSpritePress(event, roadId)
    {
        m_currentRoadId = roadId;
        focusRoadSprite();
    }
    
    let onRicoSpritePress = function asmapui_onRicoSpritePress(event, ricoId)
    {
        m_currentRicoId = ricoId;
        focusRicoSprite();
    }
    
    let onSaveSpritePress = function asmapui_onSaveSpritePress(event, saveId)
    {
        m_currentSaveId = saveId;
        focusSaveSprite();
        let saveEnums = ASZONE.saveTile;
        if (m_currentSaveId == saveEnums[0])
        {
            //console.log("Saving");
            let asstateData = ASSTATE.getSerializable();
            localStorage.setItem('ASSTATE', asstateData);
            //let asroadData = ASROAD.getSerializable();
            //localStorage.setItem('ASROAD', asroadData);
            console.log("Saved");
        }
        else if (m_currentSaveId == saveEnums[1])
        {
            //console.log("Loading");
            let asstateData = localStorage.getItem('ASSTATE');
            ASSTATE.setSerializable(asstateData);
            //let asroadData = localStorage.getItem('ASROAD');
            //ASROAD.setSerializable(asroadData);
            console.log("Loaded");
            //let viewEnums = ASZONE.viewTile;
            //m_currentViewId = viewEnums[0];
        }
    }
    
    let onPlaySpritePress = function asmapui_oñPlaySpritePress(event, playId)
    {
        m_currentPlayId = playId;
        focusPlaySprite();
        let playEnums = ASZONE.playTile;
        if (m_currentPlayId == playEnums[0])
        {
            //console.log("play");
            ASSTATE.setPlay(-1);
        }
        else if (m_currentPlayId == playEnums[1])
        {
            //console.log("stop");
            ASSTATE.setPlay(0);
        }
        else if (m_currentPlayId == playEnums[2])
        {
            //console.log("frame");
            ASSTATE.setPlay(1);
        }
    }
    
    return public;
})();
// ---------------------
let ASSTATE = (function()
{
    let public = {};
    
    let m_dataState = [];
    
    // map structure
    const C = {
        ZONE : 0,
        ZONE_TYPE : 1, // 0 none 1 road 2 building 3 fixed
        ROAD_TYPE : 2,
        ROAD_CONNECT_N : 3,
        ROAD_CONNECT_E : 4,
        ROAD_CONNECT_S : 5,
        ROAD_CONNECT_W : 6,
        ROAD_USED_CAPACITY : 7,
        ROAD_MAX_CAPACITY : 8,
        ROAD_TRAVERSAL_FROM : 9,
        ROAD_TRAVERSAL_PROCESSED : 10,
        ROAD_TRAVERSAL_COST : 11,
        ROAD_TRAVERSAL_PARENT : 12,
        ROAD_DEBUG : 13,
        BUILDING_TYPE : 2, // 1 res 2 com 3 ind 4 off
        BUILDING_DENSITY_LEVEL : 3,
        BUILDING_OFFER_R: 4,
        BUILDING_OFFER_I: 5,
        BUILDING_OFFER_C: 6,
        BUILDING_DEMAND_R : 7,
        BUILDING_DEMAND_I : 8,
        BUILDING_DEMAND_C : 9,
        BUILDING_TICK_UPDATE : 10,
    }
    public.C_DATA = C;
    
    const G = {
        SIZE_X : 0,
        SIZE_Y : 1,
        PLAY : 2,
        TICK : 3,
        FRAME : 4,
        TICK_SPEED : 5,
        RICO_TICK_PROGRESS : 6,
        RICO_STEP : 7,
        ROAD_TRAVERSAL_START : 8,
        ROAD_TRAVERSAL_CURRENT_INDEX : 9,
        ROAD_TRAVERSAL_EDGE_COUNT : 10,
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
    
    let r = function r(index, subIndex)
    {
        if (G_CHECK && (typeof m_dataState[index] === 'undefined' || m_dataState[index] == null))
        {
            throw ('error accessing dataState at ' + index + ' ' + subIndex);
            return;
        }
        return m_dataState[index][subIndex];
    }
    
    let w = function w(index, field, data)
    {
        if (G_CHECK && (typeof m_dataState[index] === 'undefined' || m_dataState[index] == null))
        {
            throw ('error accessing dataState at ' + index + ' ' + field);
            return;
        }
        m_dataState[index][field] = data;
    }
    
    public.clear = function asstate_clear(index)
    {
        m_dataState[index] = [];
    }
    
    public.getDataZoneAtIndex = function asstate_getDataZoneAtIndex(index)
    {
        return r(index, C.ZONE);
    }
    
    public.setDataZoneAtIndex = function asstate_setDataZoneAtIndex(index, data)
    {
        w(index, C.ZONE, data);
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
    
    public.getRoadTraversalFrom = function asstate_getRoadTraversalFrom(index)
    {
        return r(index, C.ROAD_TRAVERSAL_FROM);
    }
    
    public.setRoadTraversalFrom = function asstate_setRoadTraversalFrom(index, data)
    {
        w(index, C.ROAD_TRAVERSAL_FROM, data);
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
    
    public.initialize = function asstate_initialize(tableSizeX, tableSizeY)
    {
        public.clear(0);
        public.setTableSizeX(tableSizeX);
        public.setTableSizeY(tableSizeY);
        public.setTick(0);
        public.setFrame(0);
        for (let x = 0; x < tableSizeX; x++)
        {
            for (let y = 0; y < tableSizeY; y++)
            {
                var index = public.getIndex(x, y);
                public.clear(index);
            }
        }
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
    
    public.getSerializable = function asstate_getSerializable()
    {
        console.log(m_dataState);
        return JSON.stringify(m_dataState);
    }
    
    public.setSerializable = function asstate_setSerializable(string)
    {
        let master = JSON.parse(string);
        m_dataState = master;
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
        INDLOW: 30
    }
    const C = public.C_TILEENUM;
    
    public.initializeTexture = function aszone_initializeTexture()
    {
        let values = Object.values(C);
        for (let i in values)
        {
            let id = values[i] | 0;
            let textureName = public.getTileTextureName(id);
            let graphics = createTexture(id);
            let texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
        }
    }
    
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
    
    let createTexture = function aszone_createTexture(id)
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
        C.DIRT
    ];
    
    public.saveTile = [
        C.COMLOW,
        C.RESLOW
    ];
    
    public.playTile = [
        C.RESLOW, // play
        C.ROAD, // pause
        C.INDLOW // frame by frame
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
    
    public.update = function aszone_update(slowdown, time)
    {
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tick = ASSTATE.getTick();
        const frame = ASSTATE.getFrame();
        const incrementTick = ASRICO.updateRico(tick, slowdown);
        if (incrementTick)
        {
            ASSTATE.setTick(tick + 1);
            ASSTATE.setFrame(0);
        }
        else
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
    
    public.initializeTexture = function asroad_initializeTexture()
    {
        let values = Object.values(C);
        for (let i in values)
        {
            let id = values[i] | 0;
            let textureName = public.getTileTextureName(id);
            let graphics = createTexture(id);
            let texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
        }
    }
    
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
    
    let createTexture = function asroad_createTexture(id)
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
    
    let m_changeLog = [];
    
    public.hasChangeLog = function asroad_hasChangeLog()
    {
        return m_changeLog.length;
    }
    
    public.commitChangeLog = function asroad_commitChangeLog(tileCount)
    {
        let refreshCount = m_changeLog.length;
        if (tileCount * 2 < refreshCount)
        {
            refreshCount = tileCount * 2;
        }
        for (let i = 0; i < refreshCount; i+=2)
        {
            let tileX = m_changeLog[i];
            let tileY = m_changeLog[i + 1];
    
            MMAPDATA.refreshTile(tileX, tileY);
        }
        if (refreshCount > 0)
        {
            m_changeLog.splice(0, refreshCount);
        }
    }
    
    let addChangeLogIndex = function asroad_addChangeLogIndex(index)
    {
        let xy = ASSTATE.getXYFromIndex(index);
        let x = xy[0];
        let y = xy[1];
        m_changeLog.push(x);
        m_changeLog.push(y);
    }
    
    // for display
    let getDataIdByCongestion = function asroad_getTileByCongestion(index)
    {
        let value = hasRoad(index) ? ASSTATE.getRoadUsedCapacity(index) : 0;
        if (valie > 90)
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
            ASSTATE.setRoadConnectTo(from, d, );
        }
        if (hasRoad(to))
        {
            //delete ASSTATE.getRoad(to).connectTo[C_FROM[d]];
            ASSTATE.setRoadConnectTo(to, C_FROM[d], );
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
            ASSTATE.setRoadConnectTo(index, C_TO.N, );
            ASSTATE.setRoadConnectTo(index, C_TO.E, );
            ASSTATE.setRoadConnectTo(index, C_TO.S, );
            ASSTATE.setRoadConnectTo(index, C_TO.W, );
            ASSTATE.setRoadUsedCapacity(index, 1);
            ASSTATE.setRoadMaxCapacity(index, 10);
            ASSTATE.setRoadDebug(index, C.LOW)
            addChangeLogIndex(index);
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
        addChangeLogIndex(index);
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
        //setTraversalFrom(data, index, 0);
        setTraversalProcessedNot(node, index);
        setTraversalParent(node, -1);
        setTraversalCost(node, 0);
        addChangeLogIndex(node);
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
            addChangeLogIndex(from);
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
            addChangeLogIndex(node);
        }
    }
   
    let getCurrentNodeList = function asroad_getCurrentNodeList()
    {
        let startNode = getTraversalStart();
        let nodeList = [startNode];
        let i = 0;
        let addToNodeList = function (parentNode, dir, nodeList)
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
        let nodeList = getCurrentNodeList();
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
        addChangeLogIndex(node);
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
        if (true)
        {
            let nodeList = getCurrentNodeList();
            let edgeCount = nodeList.length;
            for (let i = 0; i < edgeCount; i++)
            {
                let node = nodeList[i];
                if (hasRoad(node))
                {
                    ASSTATE.setRoadDebug(node, C.LOW);
                }
                clearTraversal(node, i);
            }
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
    
    public.initializeTexture = function asrico_initializeTexture()
    {
        let values = Object.values(C);
        for (let i in values)
        {
            let id = values[i] | 0;
            let textureName = public.getTileTextureName(id);
            let graphics = createTexture(id);
            let texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
        }
    }
    
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
    
    let createTexture = function asrico_createTexture(id)
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
        if (!MMAPDATA.isValidCoordinates(x, y))
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
    
    let m_changeLog = [];
    
    public.hasChangeLog = function asrico_hasChangeLog()
    {
        return m_changeLog.length;
    }
    
    public.commitChangeLog = function asrico_commitChangeLog(tileCount)
    {
        let refreshCount = m_changeLog.length;
        if (tileCount * 2 < refreshCount)
        {
            refreshCount = tileCount * 2;
        }
        for (let i = 0; i < refreshCount; i+=2)
        {
            let tileX = m_changeLog[i];
            let tileY = m_changeLog[i + 1];
    
            MMAPDATA.refreshTile(tileX, tileY);
        }
        if (refreshCount > 0)
        {
            m_changeLog.splice(0, refreshCount);
        }
    }
    
    let addChangeLogIndex = function asrico_addChangeLogIndex(index)
    {
        let xy = ASSTATE.getXYFromIndex(index);
        let x = xy[0];
        let y = xy[1];
        m_changeLog.push(x);
        m_changeLog.push(y);
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
        if (!MMAPDATA.isValidCoordinates(x, y))
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
    
    const C_MINCYCLEPERCALL = 1;
    const C_MAXCYCLEPERCALL = 1000;
    let m_cyclePerCall = C_MAXCYCLEPERCALL;
    
    public.updateRico = function asrico_updateRico(tick, slowdown)
    {
        // Tick progress is the indicator
        // that buildings have been checked
        // in the current tick
        let progress = ASSTATE.getRicoTickProgress();
        const tableSizeX = ASSTATE.getTableSizeX();
        const tableSizeY = ASSTATE.getTableSizeY();
        const tableSize = tableSizeX * tableSizeY;
        const increaseCall = progress < tableSize;
        if (slowdown)
        {
            m_cyclePerCall--;
            if (m_cyclePerCall < C_MINCYCLEPERCALL)
            {
                m_cyclePerCall = C_MINCYCLEPERCALL;
            }
        }
        else if (increaseCall)
        {
            m_cyclePerCall++;
            if (m_cyclePerCall >= C_MAXCYCLEPERCALL)
            {
                m_cyclePerCall = C_MAXCYCLEPERCALL;
            }
        }
        let elapsedCycle = 0;
        let playValue = ASSTATE.getPlay();
        if (playValue > 0)
        {
            //console.log("frame play");
            //playValue--;
            //ASSTATE.setPlay(playValue);
            elapsedCycle = m_cyclePerCall - 1;
        }
        // polling mode
        while ((elapsedCycle < m_cyclePerCall) && (progress < tableSize))
        {
            let index = progress;
            if (updateBuilding(index))
            {
                progress += 1;
            }
            elapsedCycle += 1;
            ASSTATE.setRicoTickProgress(progress);
        }
        let incrementTick = ASSTATE.getRicoTickProgress() >= tableSize;
        if (incrementTick)
        {
            public.setNextTick(tick + 1);
        }
        return incrementTick;
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

// ---------------------
// wrapper for data layers to interface
// with mmap render
let MMAPDATA = (function ()
{
    let public = {};

    let m_mapTableSizeX = 0;
    let m_mapTableSizeY = 0;
    let m_mapChangeLog = [];
    
    let m_dataLibrary; // module such as ASZONE

    public.getDataLibrary = function mmapdata_getDataLibrary()
    {
        return m_dataLibrary;
    }
    public.switchData = function mmapdata_switchData(dataLibrary)
    {
        m_dataLibrary = dataLibrary;
        public.refreshAllTiles();
        //console.log("switch to " + m_dataLibrary.C_NAME);
    }
    public.getMapTableSizeX = function mmapdata_getMapTableSizeX()
    {
        return m_mapTableSizeX;
    }
    public.getMapTableSizeY = function mmapdata_getMapTableSizeY()
    {
        return m_mapTableSizeY;
    }
    public.initialize = function mmapdata_initialize(x, y, dataLibrary)
    {
        m_mapTableSizeX = x;
        m_mapTableSizeY = y;
        m_dataLibrary = dataLibrary;
    }
    public.isValidTileId = function mmapdata_isValidTileId(id)
    {
        let index = Object.values(m_dataLibrary.C_TILEENUM).indexOf(id)
        return index > -1;
    }
    public.getRandomTileId = function mmapdata_getRandomTileId()
    {
        let tileEnumValues = ASZONE.zoneTile;
        let tileEnumCount = tileEnumValues.length;
        let randomIndex = Math.floor(Math.random() * tileEnumCount);
        let randomId = tileEnumValues[randomIndex];
        return randomId;
    }
    public.randomizeTile = function (count)
    {
        for (let i = 0; i < count; i++)
        {
            let x = Math.floor(m_mapTableSizeX * Math.random());
            let y = Math.floor(m_mapTableSizeY * Math.random());
            let id = public.getRandomTileId();
            public.setTileId(x, y, id);
        }
    }
    public.commitChangeLog = function mmapdata_commitChangeLog()
    {
        if (m_mapChangeLog.length == 1)
        {
            m_mapChangeLog = [];
            return [-1]; // refresh all
        }
        let updatedTiles = [];// convention [x, y, x, y, ...]
        for (let i = 0; i < m_mapChangeLog.length; i+=2)
        {
            let tileX = m_mapChangeLog[i];
            let tileY = m_mapChangeLog[i + 1];
            
            // possible callbacks here
            updatedTiles.push(tileX);
            updatedTiles.push(tileY);
        }
        m_mapChangeLog = [];
        return updatedTiles;
    }
    public.refreshAllTiles = function mmapdata_refreshAllTiles()
    {
        m_mapChangeLog = [-1];
    }
    public.refreshTile = function mmapdata_refreshTile(x, y)
    {
        m_mapChangeLog.push(x);
        m_mapChangeLog.push(y);
    }
    public.getTileId = function mmapdata_getTileId(tileX, tileY)
    {
        let id = m_dataLibrary.getDataId(tileX, tileY); //getMapTableData()[index];
        if (typeof id === 'undefined')
        {
            throw 'mmapData get uninitialized ' + id + ' ' + m_dataLibrary.C_NAME;
        }
        return id;
    }
    //let isTileIdTypeWalkable = function mmapdata_isTileIdTypeWalkable(id)
    //{
    //    return id <= m_dataLibrary.C_TILEENUM.ROAD;
    //}
    public.isValidCoordinates = function mmapdata_isValidCoordinates(tileX, tileY)
    {
        let isOutOfBound = tileX < 0 || tileX >= public.getMapTableSizeX() || tileY < 0 || tileY >= public.getMapTableSizeY();
        return !isOutOfBound;
    }

    return public;
})();

// a map batch regroups multiple tiles
// abstraction layer for pixi container and sprite
let MMAPBATCH = (function ()
{
    let public = {};

    let m_mapLayer;

    let m_mapSpriteBatch = [];
    let m_mapSpriteBatchCount = 0;
    let m_mapSpriteBatchLifetime = {}; // cantor index
    public.getBatchMapIndex = function mmapbatch_getBatchMapIndex(batchX, batchY)
    {
        return MUTIL.mathCantor(batchX, batchY);
        //return batchX * MMAPDATA.getMapTableSizeY() + batchY;
    }
    public.getBatchMapIndexReverse = function mmapbatch_getBatchMapIndexReverse(batchIndex)
    {
        return MUTIL.mathReverseCantorPair(batchIndex);
        /*let pair = [];
        pair[0] = (batchIndex / MMAPDATA.getMapTableSizeY()) | 0;
        pair[1] = batchIndex - pair[0] * MMAPDATA.getMapTableSizeY();
        return pair;*/
    }
    
    // sprites grouped by batch
    // in batchMapIndex order
    let m_mapSpriteId = []; // mapIndex
    let getMapSpriteIdIndex = function mmapbatch_getMapSpriteIdIndex(x, y)
    {
        return MUTIL.mathCantor(x, y);
        //return x * MMAPDATA.getMapTableSizeY() + y;
    }

    public.C_BATCH_SIZE_X = 8;
    public.C_BATCH_SIZE_Y = 8;
    
    public.C_BATCH_LIFETIME = 60;
    public.C_MAX_BATCH_COUNT = 300;

    public.initialize = function mmapbatch_initialize()
    {
        m_mapLayer = new PIXI.Container();
        g_app.stage.addChild(m_mapLayer);
        m_mapLayer.interactive = true;
        m_mapLayer.on('pointerdown', MMAPTOUCH.onMapDisplayDragStart);
        m_mapLayer.on('pointermove', MMAPTOUCH.onMapDisplayDragMove);
        m_mapLayer.on('pointerupoutside', MMAPTOUCH.onMapDisplayDragEnd);
        m_mapLayer.on('pointerup', MMAPTOUCH.onMapDisplayDragEnd);
    }

    let getBatchMapIndexByTile = function mmapbatch_getBatchMapIndexByTile(tileX, tileY)
    {
        let X = Math.floor(tileX / public.C_BATCH_SIZE_X);
        let Y = Math.floor(tileY / public.C_BATCH_SIZE_Y);
        return public.getBatchMapIndex(X, Y);
    }

    let findIndexForNewBatch = function mmapbatch_findIndexForNewBatch(batchX, batchY)
    {
        let batchMapIndex = public.getBatchMapIndex(batchX, batchY);
        let arrayIndex = batchMapIndex;
        while (arrayIndex >= 0)
        {
            if (hasBatchByIndex(arrayIndex))
            {
                let batch = m_mapSpriteBatch[arrayIndex];
                return m_mapLayer.getChildIndex(batch) + 1;
            }
            arrayIndex--;
        }
        return 0;
    }
    
    public.getBatchRenderIndex = function mmapbatch_getBatchRenderIndex(batchX, batchY)
    {
        if (hasBatch(batchX, batchY))
        {
            let batch = getBatch(batchX, batchY);
            return m_mapLayer.getChildIndex(batch);
        }
        else
        {
            return -1;
        }
    }

    /*
    let setSpriteInteraction = function mmapbatch_setSpriteInteraction(sprite)
    {
        sprite.interactive = true;
        sprite.on('pointerdown', MMAPTOUCH.onSpriteDisplayDragStart);
        sprite.on('pointermove', MMAPTOUCH.onSpriteDisplayDragMove);
        sprite.on('pointerupoutside', MMAPTOUCH.onSpriteDisplayDragEnd);
        sprite.on('pointerup', MMAPTOUCH.onSpriteDisplayDragEnd);
    }
    */
    
    let m_buildBatchPool = [];
    let m_buildBatchTotalCount = 0;
    let buildBatch = function mmapbatch_buildBatch()
    {
        if (m_buildBatchPool.length <= 0)
        {
            m_buildBatchTotalCount++;
            let batch = new PIXI.Container();
            for (let x = 0; x < public.C_BATCH_SIZE_X; x++)
            {
                for (let y = 0; y < public.C_BATCH_SIZE_Y; y++)
                {
                    let textureName = MMAPRENDER.getTileTextureName(0);
                    let textureCache = PIXI.utils.TextureCache[textureName];
                    let sprite = new PIXI.Sprite(textureCache);

                    sprite.visible = true;

                    //setSpriteInteraction(sprite);
                    
                    batch.addChild(sprite);
                }
            }
            return batch;
        }
        else
        {
            return m_buildBatchPool.pop();
        }
    }
    
    public.getBatchTotalCount = function mmapbatch_getBatchTotalCount()
    {
        return m_buildBatchTotalCount;
    }
    
    public.getBatchPoolCount = function mmapbatch_getBatchPoolCount()
    {
        return m_buildBatchPool.length;
    }
    
    let getSpriteFromBatch = function mmapbatch_getSpriteFromBatch(batch, iTileX, iTileY)
    {
        return batch.getChildAt(iTileY + iTileX * public.C_BATCH_SIZE_Y);
    }
    
    public.printMapLayerState = function mmapbatch_printMapLayerState()
    {
        console.clear();
        let keys = Object.keys(m_mapSpriteBatch);
        for (let i in keys)
        {
            let id = keys[i];
            let pair = public.getBatchMapIndexReverse(id);
            let batchX = pair[0];
            let batchY = pair[1];
            if (hasBatchByIndex(id))
            {
                console.log(batchX + '.' + batchY + '.' + public.getBatchTotalCount());
            }
        }
    }

    // create one if none exists, excepted 
    // if coordinates are negative.
    // batch has z-ordered sprites
    // batch exists <=> sprite exists
    let getBatch = function mmapbatch_getBatch(batchX, batchY)
    {
        let batchMapIndex = public.getBatchMapIndex(batchX, batchY);
        if (!hasBatch(batchX, batchY))
        {
            let batch = buildBatch();

            batch.visible = false;

            batch.cacheAsBitmap = true;

            let addIndex = findIndexForNewBatch(batchX, batchY);
            //console.log(addIndex);

            m_mapLayer.addChildAt(batch, addIndex);

            //let batchCount = m_mapLayer.children.length;

            m_mapSpriteBatch[batchMapIndex] = batch;
            m_mapSpriteBatchLifetime[batchMapIndex] = public.C_BATCH_LIFETIME;
            m_mapSpriteBatchCount++;

            let cTileX = public.getBatchXToStartTileX(batchX);
            let cTileY = public.getBatchYToStartTileY(batchY);
            //console.log('created container for ' + cTileX + ',' + cTileY + ',' + batchCount);

            let eTileX = public.getBatchXToEndTileX(batchX);
            let eTileY = public.getBatchYToEndTileY(batchY);
            for (let x = cTileX; x < eTileX; x++)
            {
                for (let y = cTileY; y < eTileY; y++)
                {
                    let sprite = getSpriteFromBatch(batch, x - cTileX, y - cTileY);
                    sprite.visible = true;

                    let spriteMapIndex = getMapSpriteIdIndex(x, y)
                    m_mapSpriteId[spriteMapIndex] = -1;
                }
            }
        }
        return m_mapSpriteBatch[batchMapIndex];
    }
    
    public.removeBatch = function mmapbatch_removeBatch(batchX, batchY)
    {
        if (hasBatch(batchX, batchY))
        {
            let batch = getBatch(batchX, batchY);
            m_mapLayer.removeChild(batch);
            
            let batchMapIndex = public.getBatchMapIndex(batchX, batchY);
            delete m_mapSpriteBatch[batchMapIndex];
            m_mapSpriteBatchCount--;
            delete m_mapSpriteBatchLifetime[batchMapIndex];
            
            let options = {children: true};

            let cTileX = public.getBatchXToStartTileX(batchX);
            let cTileY = public.getBatchYToStartTileY(batchY);
            let eTileX = public.getBatchXToEndTileX(batchX);
            let eTileY = public.getBatchYToEndTileY(batchY);
            for (let x = cTileX; x < eTileX; x++)
            {
                for (let y = cTileY; y < eTileY; y++)
                {
                    let spriteMapIndex = getMapSpriteIdIndex(x, y)
                    delete m_mapSpriteId[spriteMapIndex];
                }
            }

            //batch.destroy(options);
            //batch.visible = false;
            m_buildBatchPool.push(batch);
        }
    }

    let hasBatchByIndex = function mmapbatch_hasBatchByIndex(batchMapIndex)
    {
        return !(typeof m_mapSpriteBatch[batchMapIndex] === 'undefined' || m_mapSpriteBatch[batchMapIndex] == null);
    }

    let hasBatch = function mmapbatch_hasBatch(batchX, batchY)
    {
        let mapIndex = public.getBatchMapIndex(batchX, batchY);
        return hasBatchByIndex(mapIndex);
    }
    
    public.getBatchCount = function mmapbatch_getBatchCount()
    {
        return m_mapSpriteBatchCount;
    }

    let hasSprite = function mmapbatch_hasSprite(tileX, tileY)
    {
        let batchX = public.getTileXToBatchX(tileX);
        let batchY = public.getTileYToBatchY(tileY);
        return hasBatch(batchX, batchY);
    }

    public.setSprite = function mmapbatch_setSprite(tileX, tileY, id, x, y)
    {
        let spriteMapIndex = getMapSpriteIdIndex(tileX, tileY);
        let batchX = public.getTileXToBatchX(tileX);
        let batchY = public.getTileYToBatchY(tileY);
        if (!hasSprite(tileX, tileY))
        {
            let batch = getBatch(batchX, batchY);
        }
        // it is likely this
        if (m_mapSpriteId[spriteMapIndex] != id)
        {
            let batch = getBatch(batchX, batchY);
            batch.cacheAsBitmap = false;

            let cTileX = public.getBatchXToStartTileX(batchX);
            let cTileY = public.getBatchYToStartTileY(batchY);
            let textureName = MMAPRENDER.getTileTextureName(id);
            let textureCache = PIXI.utils.TextureCache[textureName];
            let sprite = getSpriteFromBatch(batch, tileX - cTileX, tileY - cTileY);
            sprite.setTexture(textureCache);
            sprite.x = x - sprite.width / 2;
            sprite.y = y - sprite.height;
            m_mapSpriteId[spriteMapIndex] = id;

            batch.cacheAsBitmap = true;
        }
    }

    public.getTileXToStartTileX = function mmapbatch_getTileXToStartTileX(tileX)
    {
        return public.getTileXToBatchX(tileX) * public.C_BATCH_SIZE_X;
    }

    public.getTileYToStartTileY = function mmapbatch_getTileYToStartTileY(tileY)
    {
        return public.getTileYToBatchY(tileY) * public.C_BATCH_SIZE_Y;
    }

    // end tile excluded
    public.getTileXToEndTileX = function mmapbatch_getTileXToEndTileX(tileX)
    {
        return public.getTileXToStartTileX(tileX) + public.C_BATCH_SIZE_X;
    }

    public.getTileYToEndTileY = function mmapbatch_getTileYToEndTileY(tileY)
    {
        return public.getTileYToStartTileY(tileY) + public.C_BATCH_SIZE_Y;
    }

    public.getTileXToBatchX = function mmapbatch_getTileXToBatchX(tileX)
    {
        return Math.floor(Math.floor(tileX) / public.C_BATCH_SIZE_X);
    }

    public.getTileYToBatchY = function mmapbatch_getTileYToBatchY(tileY)
    {
        return Math.floor(Math.floor(tileY) / public.C_BATCH_SIZE_Y);
    }

    public.getBatchXToStartTileX = function mmapbatch_getBatchXToStartTileX(batchX)
    {
        return batchX * public.C_BATCH_SIZE_X;
    }

    public.getBatchYToStartTileY = function mmapbatch_getBatchYToStartTileY(batchY)
    {
        return batchY * public.C_BATCH_SIZE_Y;
    }

    public.getBatchXToEndTileX = function mmapbatch_getBatchXToEndTileX(batchX)
    {
        return (batchX + 1) * public.C_BATCH_SIZE_X;
    }

    public.getBatchYToEndTileY = function mmapbatch_getBatchYToEndTileY(batchY)
    {
        return (batchY + 1) * public.C_BATCH_SIZE_Y;
    }

    public.setBatchVisible = function mmapbatch_setBatchVisible(batchX, batchY, flag)
    {
        getBatch(batchX, batchY).visible = flag;
    }

    public.getMapLayer = function mmapbatch_getMapLayer()
    {
        return m_mapLayer;
    }

    public.setBatchScale = function mmapbatch_setBatchScale(batchX, batchY, scaleX, scaleY)
    {
        let batch = getBatch(batchX, batchY);
        batch.scale.x = scaleX;
        batch.scale.y = scaleY;
    }

    public.setVisibilityFlagInRadius = function mmapbatch_setVisibilityFlagInRadius(flag, centerTileX, centerTileY, radius, flagValue)
    {
        let centerBatchX = public.getTileXToBatchX(centerTileX);
        let centerBatchY = public.getTileYToBatchY(centerTileY);
        for (let i = -radius; i <= radius; i++)
        {
            for (let j = -radius; j <= radius; j++)
            {
                let batchX = centerBatchX + i;
                let batchY = centerBatchY + j;
                let startTileX = public.getBatchXToStartTileX(batchX);
                let startTileY = public.getBatchYToStartTileY(batchY);
                if (batchX >= 0 && batchY >= 0 && MMAPDATA.isValidCoordinates(startTileX, startTileY))
                {
                    let index = public.getBatchMapIndex(batchX, batchY);
                    if (typeof flag[index] === 'undefined')
                    {
                        flag[index] = {};
                    }
                    flag[index].visible = flagValue;
                }
            }
        }
    }

    public.getBatchIndexInRadius = function mmapbatch_getBatchIndexInRadius(centerTileX, centerTileY, radius)
    {
        let batchList = [];
        let centerBatchX = public.getTileXToBatchX(centerTileX);
        let centerBatchY = public.getTileYToBatchY(centerTileY);
        for (let i = -radius; i <= radius; i++)
        {
            for (let j = -radius; j <= radius; j++)
            {
                let batchX = centerBatchX + i;
                let batchY = centerBatchY + j;
                let startTileX = public.getBatchXToStartTileX(batchX);
                let startTileY = public.getBatchYToStartTileY(batchY);
                if (batchX >= 0 && batchY >= 0 && MMAPDATA.isValidCoordinates(startTileX, startTileY))
                {
                    let index = public.getBatchMapIndex(batchX, batchY);
                    batchList.push(index);
                }
            }
        }
        return batchList;
    }

    public.setVisibilityFlagInList = function mmapbatch_setVisibilityFlagInList(flag, batchList, flagValue)
    {
        for (let i in batchList)
        {
            let batchMapIndex = batchList[i];
            if (typeof flag[batchMapIndex] === 'undefined')
            {
                flag[batchMapIndex] = {};
            }
            flag[batchMapIndex].visible = flagValue;
        }
    }

    public.setTextureFlagInNewBatch = function mmapbatch_setTextureFlagInNewBatch(flag, refreshCall)
    {
        let keys = Object.keys(flag);
        for (let i in keys)
        {
            let k = keys[i];
            let pair = public.getBatchMapIndexReverse(k);
            let batchX = pair[0];
            let batchY = pair[1];
            let exists = hasBatch(batchX, batchY);
            if (!exists || refreshCall)
            {
                flag[k].loadTexture = true;
            }
        }
    }

    public.setTextureFlagInRadiusAndUpdatedTiles = function mmapbatch_setTextureFlagInRadiusAndUpdatedTiles(flag, centerTileX, centerTileY, radius, updatedTiles)
    {
        let centerBatchX = public.getTileXToBatchX(centerTileX);
        let centerBatchY = public.getTileYToBatchY(centerTileY);
        for (let i = 0; i < updatedTiles.length; i+=2)
        {
            let tileX = updatedTiles[i];
            let tileY = updatedTiles[i+1];
            let batchX = public.getTileXToBatchX(tileX);
            let batchY = public.getTileYToBatchY(tileY);
            if (Math.abs(batchX - centerBatchX) <= radius && Math.abs(batchY - centerBatchY) <= radius)
            {
                let mapIndex = public.getBatchMapIndex(batchX, batchY);
                if (typeof flag[mapIndex] === 'undefined')
                {
                    flag[mapIndex] = {};
                }
                flag[mapIndex].loadTexture = true;
            }
        }
    }
    
    public.setLifetimeFlagInList = function mmapbatch_setLifetimeFlagInList(flag, batchList)
    {
        for (let i in batchList)
        {
            let index = batchList[i];
            m_mapSpriteBatchLifetime[index] = public.C_BATCH_LIFETIME;
        }
        let keys = Object.keys(m_mapSpriteBatchLifetime);
        for (let i in keys)
        {
            let mapIndex = keys[i];
            m_mapSpriteBatchLifetime[mapIndex]--;
            if (m_mapSpriteBatchLifetime[mapIndex] <= 0)
            {
                if (typeof flag[mapIndex] === 'undefined')
                {
                    flag[mapIndex] = {};
                }
                flag[mapIndex].remove = true;
            }
        }
    }

    return public;
})();

// sub unit of MMAPRENDER
let MMAPTOUCH = (function ()
{
    let public = {};

    let m_touchData = [];
    let m_dragging = false;
    let m_zooming = false;
    let m_startScaleX = 1;
    let m_startScaleY = 1;
    let m_startDistance = 0;
    let m_startPointerScreenX = 0;
    let m_startPointerScreenY = 0;
    let m_startCameraMapX = 0;
    let m_startCameraMapY = 0;
    // 
    let m_clickTimeout = false;
    let m_clickCount = 0;
    const C_CLICKDELAYMS = 200;

    let getDistanceBetween = function mmaptouch_getDistanceBetween(pos1x, pos1y, pos2x, pos2y)
    {
        let sqx = Math.pow(pos2x - pos1x, 2);
        let sqy = Math.pow(pos2y - pos1y, 2);
        let value = Math.sqrt(sqx + sqy);
        return value;
    }

    public.onMapDisplayDragStart = function mmaptouch_onMapDisplayDragStart(event)
    {
        let touchIndex = m_touchData.indexOf(event.data);
        if (touchIndex >= 0)
        {
            //console.log('skip');
            return;
        }
        m_touchData.push(event.data);
        //console.log('touch ' + event.data.identifier + '/' + m_touchData.length);
        mapDisplayDragRefresh(this);
    }

    public.onMapDisplayDragEnd = function mmaptouch_onMapDisplayDragEnd(event)
    {
        let touchIndex = m_touchData.indexOf(event.data);
        if (touchIndex >= 0)
        {
            m_touchData.splice(touchIndex, 1);
        }
        mapDisplayDragRefresh(this);
        //console.log('untouch ' + event.data.identifier + '/' + m_touchData.length);
    }

    public.onMapDisplayDragMove = function mmaptouch_onMapDisplayDragMove()
    {
        if (m_dragging || m_zooming)
        {
            updateCameraDrag(this);
        }
    }
    
    public.isStatePan = function mmaptouch_isStatePan()
    {
        return m_dragging;
    }
    
    public.isStateZoom = function mmaptouch_isStateZoom()
    {
        return m_zooming;
    }
    
    public.getTouchCount = function mmaptouch_getTouchCount()
    {
        return m_touchData.length;
    }
    
    public.getClickCount = function mmaptouch_getClickCount()
    {
        return m_clickCount;
    }
    
    let clickDecisionTimeout = function mmaptouch_clickDecisionTimeout()
    {
        if (!m_clickTimeout)
        {
            m_clickCount = 0;
            return;
        }
        let touchCount = m_touchData.length;
        if (touchCount == 0)
        {
            if (m_clickCount == 1)
            {
                MMAPRENDER.processSingleClick(m_startPointerScreenX, m_startPointerScreenY);
            }
            else if (m_clickCount == 2)
            {
                MMAPRENDER.processDoubleClick(m_startPointerScreenX, m_startPointerScreenY);
            }
        }
        else if (touchCount == 1)
        {
            if (m_clickCount == 1)
            {
                //console.log("zoom no pan");
                m_dragging = false;
                m_zooming = true;
            }
            else if (m_clickCount == 0)
            {
                // not enabled here
                // because of latency
                //m_dragging = true;
                //m_zooming = false;
            }
        }
        else if (touchCount == 2)
        {
            if (m_clickCount == 0)
            {
                // not enabled here
                // because of latency
                //m_dragging = true;
                //m_zooming = true;
            }
        }
        m_clickCount = 0;
        m_clickTimeout = false;
    }
    
    let mapDisplayDragReset = function mmaptouch_mapDisplayDragReset(_this)
    {
        m_startScaleX = 1;
        m_startScaleY = 1;
        
        m_dragging = false;
        m_zooming = false;
        
        m_startDistance = 0;
    }
    
    let mapDisplayDragSingle = function mmaptouch_mapDisplayDragSingle(_this)
    {
        // remember initial scale
        m_startScaleX = _this.scale.x;
        m_startScaleY = _this.scale.y;
        
        m_dragging = true;
        m_zooming = false;
        
        let startPointerScreen = m_touchData[0].getLocalPosition(_this.parent);
        m_startPointerScreenX = startPointerScreen.x;
        m_startPointerScreenY = startPointerScreen.y;
        
        m_startDistance = 0;
        
        m_startCameraMapX = MMAPRENDER.getCameraMapX();
        m_startCameraMapY = MMAPRENDER.getCameraMapY();
    }
    
    let mapDisplayDragDouble = function mmaptouch_mapDisplayDragDouble(_this)
    {
        // remember initial scale
        m_startScaleX = _this.scale.x;
        m_startScaleY = _this.scale.y;
        
        m_dragging = true;
        m_zooming = true;
        
        let pos1 = m_touchData[0].getLocalPosition(_this.parent);
        let pos2 = m_touchData[1].getLocalPosition(_this.parent);
        m_startPointerScreenX = (pos1.x + pos2.x) / 2;
        m_startPointerScreenY = (pos1.y + pos2.y) / 2;
        
        m_startDistance = getDistanceBetween(pos1.x, pos1.y, pos2.x, pos2.y);
        
        let cameraScreenX = MMAPRENDER.getCameraScreenX();
        let cameraScreenY = MMAPRENDER.getCameraScreenY();
        
        let deltaPointerCameraScreenX = cameraScreenX - m_startPointerScreenX;
        let deltaPointerCameraScreenY = cameraScreenY - m_startPointerScreenY;
        
        m_startCameraMapX = MMAPRENDER.getCameraMapX() - deltaPointerCameraScreenX / MMAPRENDER.getCameraScaleX();
        m_startCameraMapY = MMAPRENDER.getCameraMapY() - deltaPointerCameraScreenY / MMAPRENDER.getCameraScaleY();
    }

    let mapDisplayDragRefresh = function mmaptouch_mapDisplayDragRefresh(_this)
    {
        let touchCount = m_touchData.length;
        if (touchCount == 0)
        {
            mapDisplayDragReset(_this);
            
            if (m_clickTimeout)
            {
                m_clickCount++;
            }
        }
        else if (touchCount == 1)
        {
            let wasZooming = m_zooming;
            
            mapDisplayDragSingle(_this);
            
            if (!m_clickTimeout && !wasZooming)
            {
                m_clickTimeout = true;
                setTimeout(clickDecisionTimeout, C_CLICKDELAYMS);
            }
        }
        else if (touchCount == 2)
        {
            let wasZooming = m_zooming;
            
            mapDisplayDragDouble(_this);
            
            if (!m_clickTimeout && !wasZooming)
            {
                m_clickTimeout = true;
                setTimeout(clickDecisionTimeout, C_CLICKDELAYMS);
            }
        }
    }
    
    let disableClickTimeoutOnMove = function mmaptouch_disableClickTimeoutOnMove(p1x, p1y, p2x, p2y)
    {
        if (m_clickTimeout)
        {
            let d = getDistanceBetween(p1x, p1y, p2x, p2y);
            if (d > 4)
            {
                m_clickTimeout = false;
            }
        }
    }
    
    let updateCameraPan = function mmaptouch_updateCameraPan(pointerScreenX, pointerScreenY)
    {
        let deltaPointerScreenX = m_startPointerScreenX - pointerScreenX;
        let deltaPointerScreenY = m_startPointerScreenY - pointerScreenY;
        
        let cameraScreenX = MMAPRENDER.getCameraScreenX();
        let cameraScreenY = MMAPRENDER.getCameraScreenY();
        
        // camera moves according to differential movement of pointer
        let cameraMapX = m_startCameraMapX + deltaPointerScreenX / MMAPRENDER.getCameraScaleX();
        let cameraMapY = m_startCameraMapY + deltaPointerScreenY / MMAPRENDER.getCameraScaleY();
        
        MMAPRENDER.setCameraMap(cameraMapX, cameraMapY);
    }
    
    let updateCameraPanZoom = function mmaptouch_updateCameraPanZoom(pointerScreenX, pointerScreenY)
    {
        let cameraScreenX = MMAPRENDER.getCameraScreenX();
        let cameraScreenY = MMAPRENDER.getCameraScreenY();
        
        let deltaPointerCameraScreenX = cameraScreenX - pointerScreenX;
        let deltaPointerCameraScreenY = cameraScreenY - pointerScreenY;
        
        // camera moves according to differential movement of pointer
        let cameraMapX = m_startCameraMapX + deltaPointerCameraScreenX / MMAPRENDER.getCameraScaleX();
        let cameraMapY = m_startCameraMapY + deltaPointerCameraScreenY / MMAPRENDER.getCameraScaleY();
        
        MMAPRENDER.setCameraMap(cameraMapX, cameraMapY);
    }
    
    let updateCameraZoom = function mmaptouch_updateCameraZoom(pointerScreenX, pointerScreenY)
    {
        let deltaPointerScreenY = m_startPointerScreenY - pointerScreenY;
        
        let ratio = (-2*deltaPointerScreenY + MMAPRENDER.getCameraScreenY()) / MMAPRENDER.getCameraScreenY();
        let cameraScaleX = m_startScaleX * ratio;
        let cameraScaleY = m_startScaleY * ratio;
        
        MMAPRENDER.setCameraScale(cameraScaleX, cameraScaleY);
    }

    let updateCameraDrag = function mmaptouch_updateCameraDrag(_this)
    {
        if (m_dragging && !m_zooming)
        {
            let pointerScreen = m_touchData[0].getLocalPosition(_this.parent);
            
            disableClickTimeoutOnMove(pointerScreen.x, pointerScreen.y, m_startPointerScreenX, m_startPointerScreenY);
            
            updateCameraPan(pointerScreen.x, pointerScreen.y);
        }
        else if (m_dragging && m_zooming)
        {
            let pos1 = m_touchData[0].getLocalPosition(_this.parent);
            let pos2 = m_touchData[1].getLocalPosition(_this.parent);
            let pointerScreenX = (pos1.x + pos2.x) / 2;
            let pointerScreenY = (pos1.y + pos2.y) / 2;
            let newDistance = getDistanceBetween(pos1.x, pos1.y, pos2.x, pos2.y);
            let ratio = newDistance / m_startDistance;
            let cameraScaleX = m_startScaleX * ratio;
            let cameraScaleY = m_startScaleY * ratio;
            
            MMAPRENDER.setCameraScale(cameraScaleX, cameraScaleY);
            
            disableClickTimeoutOnMove(pointerScreenX, pointerScreenY, m_startPointerScreenX, m_startPointerScreenY);
            
            updateCameraPanZoom(pointerScreenX, pointerScreenY);
        }
        else if (!m_dragging && m_zooming)
        {
            let pointerScreen = m_touchData[0].getLocalPosition(_this.parent);
            
            disableClickTimeoutOnMove(pointerScreen.x, pointerScreen.y, m_startPointerScreenX, m_startPointerScreenY);
            
            updateCameraZoom(pointerScreen.x, pointerScreen.y);
        }
    }

    return public;
})();

let MMAPRENDER = (function ()
{
    let public = {};

    //let C_TEXTURE_BASE_SIZE_X = 130;
    //let C_TEXTURE_BASE_SIZE_Y = 66;

    let C_TEXTURE_BASE_SIZE_X = 64;
    let C_TEXTURE_BASE_SIZE_Y = 32;
    public.getTextureBaseSizeX = function mmaprender_getTextureBaseSizeX()
    {
        return C_TEXTURE_BASE_SIZE_X;
    }
    public.getTextureBaseSizeY = function mmaprender_getTextureBaseSizeY()
    {
        return C_TEXTURE_BASE_SIZE_Y;
    }
    public.C_MIN_ZOOM = 0.25;

    let getRainbowProfile = function mmaprender_getRainbowProfile(n)
    {
        let total = 0xFF * 6;
        n = n % total;
        if (n < 0xFF)
        {
            return n;
        }
        else if (n < 0xFF * 3)
        {
            return 0xFF;
        }
        else if (n < 0xFF * 4)
        {
            return 0xFF * 4 - n;
        }
        else
        {
            return 0;
        }
    }

    let getRainbowColor = function mmaprender_getRainbowColor(i, t)
    {
        let n = (0xFF * 6 * i / t);
        let r = getRainbowProfile(n + 0xFF * 2) << 16;
        let g = getRainbowProfile(n) << 8;
        let b = getRainbowProfile(n + 0xFF * 4);
        return r + g + b;
    }
    
    public.isOrientationLandscape = function mmaprender_isOrientationLandscape()
    {
        let landscape = g_app.renderer.width > g_app.renderer.height;
        return landscape;
    }

    let viewWidth = function mmaprender_viewWidth()
    {
        return g_app.renderer.width;
    }
    let viewHeight = function mmaprender_viewHeight()
    {
        return g_app.renderer.height;
    }
    let cameraScreenX = function mmaprender_cameraScreenX()
    {
        return viewWidth() / 2;
    }
    let cameraScreenY = function mmaprender_cameraScreenY()
    {
        return viewHeight() / 2;
    }
    public.getCameraScreenX = function mmaprender_getCameraScreenX()
    {
        return cameraScreenX();
    }
    public.getCameraScreenY = function mmaprender_getCameraScreenY()
    {
        return cameraScreenY();
    }

    let m_cameraMapX = 0;
    let m_cameraMapY = 0;
    let m_cameraScaleX = 1;
    let m_cameraScaleY = 1;

    let m_cameraMapVelocityX = 0;
    let m_cameraMapVelocityY = 0;
    let m_cameraScaleVelocity = 0;

    let m_cameraMapXRendered = 0;
    let m_cameraMapYRendered = 0;
    let m_cameraScaleXRendered = 1;
    let m_cameraScaleYRendered = 1;
    let m_cameraCenterTileXRendered = null;
    let m_cameraCenterTileYRendered = null;
    let m_cameraBatchRadiusRendered = 1;
    let m_cameraBatchListRendered = null;
    
    let m_singleClickCallback;
    let m_doubleClickCallback;

    public.initialize = function mmaprender_initialize(singleClick, doubleClick)
    {
        m_cameraMapX = 0;
        m_cameraMapY = 0;
        MMAPBATCH.initialize();
        m_singleClickCallback = singleClick;
        m_doubleClickCallback = doubleClick;
    }
    
    public.getTileTextureName = function mmaprender_getTileTextureName(tileId)
    {
        return MMAPDATA.getDataLibrary().getTileTextureName(tileId);
    }
    
    public.createTexture = function mmaprender_createTexture(color, margin, height)
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

    // sprites are rendered at their
    // absolute (x,y) and never change
    // position.
    // batches are added at (0,0) and 
    // never change their position.
    // however the map container will move

    let tileToMapX = function (tileX, tileY)
    {
        return C_TEXTURE_BASE_SIZE_X / 2 * (tileX - tileY);
    }

    let tileToMapY = function (tileX, tileY)
    {
        return C_TEXTURE_BASE_SIZE_Y / 2 * (tileX + tileY);
    }

    // not to be used to check selection
    // does not take into account sprite height
    // nor z level
    let mapToTileX = function (mapX, mapY)
    {
        return mapX / C_TEXTURE_BASE_SIZE_X + (mapY + 1 + C_TEXTURE_BASE_SIZE_Y) / C_TEXTURE_BASE_SIZE_Y;
    }

    let mapToTileY = function (mapX, mapY)
    {
        return (mapY + 1 + C_TEXTURE_BASE_SIZE_Y) / C_TEXTURE_BASE_SIZE_Y - mapX / C_TEXTURE_BASE_SIZE_X;
    }

    let getScreenToMapX = function mmaprender_getScreenToMapX(screenX)
    {
        return m_cameraMapX + (screenX - cameraScreenX()) / m_cameraScaleX;
    }

    let getScreenToMapY = function mmaprender_getScreenToMapY(screenY)
    {
        return m_cameraMapY + (screenY - cameraScreenY()) / m_cameraScaleY;
    }

    let getScreenToTileX = function mmaprender_getScreenToTileX(screenX, screenY)
    {
        let mapX = getScreenToMapX(screenX);
        let mapY = getScreenToMapY(screenY);
        return mapToTileX(mapX, mapY);
    }

    let getScreenToTileY = function mmaprender_getScreenToTileY(screenX, screenY)
    {
        let mapX = getScreenToMapX(screenX);
        let mapY = getScreenToMapY(screenY);
        return mapToTileY(mapX, mapY);
    }

    public.setTile = function mmaprender_setTile(tileX, tileY, id)
    {
        let x = tileToMapX(tileX, tileY);
        let y = tileToMapY(tileX, tileY);
        MMAPBATCH.setSprite(tileX, tileY, id, x, y);
    }

    public.getCameraMapX = function mmaprender_getCameraMapX()
    {
        return m_cameraMapX;
    }

    public.getCameraMapY = function mmaprender_getCameraMapY()
    {
        return m_cameraMapY;
    }

    public.getCameraScaleX = function mmaprender_getCameraScaleX()
    {
        return m_cameraScaleX;
    }

    public.getCameraScaleY = function mmaprender_getCameraScaleY()
    {
        return m_cameraScaleY;
    }
    
    public.getTileZOrder = function mmaprender_getTileZOrder(tileX, tileY)
    {
        let batchX = MMAPBATCH.getTileXToBatchX(tileX);
        let batchY = MMAPBATCH.getTileYToBatchY(tileY);
        return MMAPBATCH.getBatchRenderIndex(batchX, batchY);
    }

    let updateCameraVelocity = function mmaprender_updateCameraVelocity()
    {
        let cameraMapX = m_cameraMapX + m_cameraMapVelocityX / m_cameraScaleX;
        let cameraMapY = m_cameraMapY + m_cameraMapVelocityY / m_cameraScaleY;
        let cameraScaleX = m_cameraScaleX + m_cameraScaleVelocity;
        let cameraScaleY = m_cameraScaleY + m_cameraScaleVelocity;
        public.setCameraScale(cameraScaleX, cameraScaleY);
        public.setCameraMap(cameraMapX, cameraMapY);
    }

    public.setCameraMap = function mmaprender_setCameraMap(mapX, mapY)
    {
        m_cameraMapX = mapX;
        m_cameraMapY = mapY;
        
        let mapLayer = MMAPBATCH.getMapLayer();
        mapLayer.pivot.x = m_cameraMapX;
        mapLayer.pivot.y = m_cameraMapY;
        mapLayer.x = cameraScreenX();
        mapLayer.y = cameraScreenY();
        
        public.updateDebug();
    }
    
    public.updateDebug = function mmaprender_updateDebug()
    {
        let tileX = getCenterTileX();
        let tileY = getCenterTileY();
        let cameraScale = (m_cameraScaleX * 100) | 0;
        
        let interactState = 'i(' + (MMAPTOUCH.isStatePan() ? 'P' : '-') + (MMAPTOUCH.isStateZoom() ? 'Z' : '-') + (MMAPTOUCH.getTouchCount()) + (MMAPTOUCH.getClickCount()) + ') ';
        let tickElapsed = 'k(' + ASSTATE.getTick() + ') ';
        let frameElapsed = 'f(' + ASSTATE.getFrame()+ ') ';
        let changeLog = 'C(' + ASROAD.hasChangeLog() + ') ';
        let cache = 'c(' + Object.keys(PIXI.utils.TextureCache).length + ') ';
        let memUsage = 'o(' + performance.memory.usedJSHeapSize / 1000 + ') ';
        let mapCoords = 'm(' + (m_cameraMapX | 0) + ',' + (m_cameraMapY | 0) + ',' + cameraScale + ') ';
        let tileCoords = 't(' + tileX + ',' + tileY + ') ';
        let batchCoords = 'b(' + MMAPBATCH.getTileXToBatchX(tileX) + ',' + MMAPBATCH.getTileYToBatchY(tileY) + ') ';
        let batchCount = 'B(' + MMAPBATCH.getBatchCount() + '+' + MMAPBATCH.getBatchPoolCount() + '/' + MMAPBATCH.getBatchTotalCount() + ') ';
        g_counter.innerHTML = interactState + mapCoords + tileCoords + tickElapsed + frameElapsed + changeLog;
    }

    public.setCameraScale = function mmaprender_setCameraScale(scaleX, scaleY)
    {
        m_cameraScaleX = scaleX;
        if (m_cameraScaleX < public.C_MIN_ZOOM)
        {
            m_cameraScaleX = public.C_MIN_ZOOM;
        }
        m_cameraScaleY = scaleY;
        if (m_cameraScaleY < public.C_MIN_ZOOM)
        {
            m_cameraScaleY = public.C_MIN_ZOOM;
        }
        let mapLayer = MMAPBATCH.getMapLayer();
        mapLayer.scale.x = m_cameraScaleX;
        mapLayer.scale.y = m_cameraScaleY;
    }

    public.setCameraMapVelocity = function mmaprender_setCameraMapVelocity(mapVelocityX, mapVelocityY)
    {
        m_cameraMapVelocityX = mapVelocityX;
        m_cameraMapVelocityY = mapVelocityY;
    }

    public.setCameraScaleVelocity = function mmaprender_setCameraScaleVelocity(scaleVelocity)
    {
        m_cameraScaleVelocity = scaleVelocity;
    }

    let getCenterTileX = function mmaprender_getCenterTileX()
    {
        return Math.floor(getScreenToTileX(viewWidth() / 2, viewHeight() / 2));
    }

    let getCenterTileY = function mmaprender_getCenterTileY()
    {
        return Math.floor(getScreenToTileY(viewWidth() / 2, viewHeight() / 2));
    }

    let getVisibleTileRadius = function mmaprender_getVisibleTileRadius()
    {
        let topLeftCornerTileX = Math.floor(getScreenToTileX(0, 0));
        let topLeftCornerTileY = Math.floor(getScreenToTileY(0, 0));

        let cornerToCenterTileDistance = Math.floor(Math.sqrt(Math.pow(topLeftCornerTileX - getCenterTileX(), 2) + Math.pow(topLeftCornerTileY - getCenterTileY(), 2)));
        return cornerToCenterTileDistance;
    }

    let getBatchRadiusForScreen = function mmaprender_getBatchRadiusForScreen(centerBatchX, centerBatchY, screenX, screenY)
    {
        let tileX = Math.floor(getScreenToTileX(screenX, screenY));
        let tileY = Math.floor(getScreenToTileY(screenX, screenY));
        let batchX = MMAPBATCH.getTileXToBatchX(tileX);
        let batchY = MMAPBATCH.getTileYToBatchY(tileY);
        //console.log('rad ' + batchX + ' ' + batchY );
        let deltaBatchX = centerBatchX - batchX;
        let deltaBatchY = centerBatchY - batchY;
        let batchRadius = Math.floor(Math.sqrt(Math.pow(deltaBatchX, 2) + Math.pow(deltaBatchY, 2))) + 1;
        return batchRadius;
    }

    let getVisibleBatchRadius = function mmaprender_getVisibleBatchRadius()
    {
        let centerBatchX = MMAPBATCH.getTileXToBatchX(getCenterTileX());
        let centerBatchY = MMAPBATCH.getTileYToBatchY(getCenterTileY());

        let x = 0;
        let y = 0;
        let topLeftBatchRadius = getBatchRadiusForScreen(
        centerBatchX,
        centerBatchY,
        x, y);
        return topLeftBatchRadius;
    }

    let getBatchIndexInScreen = function mmaprender_getBatchIndexInScreen()
    {
        let minBatchEdge = Math.min(MMAPBATCH.C_BATCH_SIZE_X, MMAPBATCH.C_BATCH_SIZE_Y);
        let deltaScreenX = minBatchEdge * C_TEXTURE_BASE_SIZE_X * m_cameraScaleX;
        let deltaScreenY = minBatchEdge * C_TEXTURE_BASE_SIZE_Y * m_cameraScaleY;

        let maxScreenX = viewWidth();
        let maxScreenY = viewHeight();

        let batchList = [];

        for (let stepScreenX = 0; stepScreenX <= maxScreenX + deltaScreenX; stepScreenX += deltaScreenX)
        {
            for (let stepScreenY = 0; stepScreenY <= maxScreenY + deltaScreenY; stepScreenY += deltaScreenY)
            {
                let tileX = Math.floor(getScreenToTileX(stepScreenX, stepScreenY));
                let tileY = Math.floor(getScreenToTileY(stepScreenX, stepScreenY));
                let batchX = MMAPBATCH.getTileXToBatchX(tileX);
                let batchY = MMAPBATCH.getTileYToBatchY(tileY);
                batchList.push(MMAPBATCH.getBatchMapIndex(batchX, batchY));
            }
        }

        for (let stepScreenX = -deltaScreenX / 2; stepScreenX <= maxScreenX + deltaScreenX; stepScreenX += deltaScreenX)
        {
            for (let stepScreenY = -deltaScreenY / 2; stepScreenY <= maxScreenY + deltaScreenY; stepScreenY += deltaScreenY)
            {
                let tileX = Math.floor(getScreenToTileX(stepScreenX, stepScreenY));
                let tileY = Math.floor(getScreenToTileY(stepScreenX, stepScreenY));
                let batchX = MMAPBATCH.getTileXToBatchX(tileX);
                let batchY = MMAPBATCH.getTileYToBatchY(tileY);
                batchList.push(MMAPBATCH.getBatchMapIndex(batchX, batchY));
            }
        }

        return batchList;
    }

    let getBatchIndexInScreen2 = function mmaprender_getBatchIndexInScreen2()
    {
        let minBatchEdge = Math.min(MMAPBATCH.C_BATCH_SIZE_X, MMAPBATCH.C_BATCH_SIZE_Y);
        let deltaScreenX = minBatchEdge * C_TEXTURE_BASE_SIZE_X * m_cameraScaleX;
        let deltaScreenY = minBatchEdge * C_TEXTURE_BASE_SIZE_Y * m_cameraScaleY;

        let totalStepX = Math.floor(viewWidth() / deltaScreenX) + 2;
        let totalStepY = Math.floor(viewHeight() / deltaScreenY) + 2;

        let batchList = [];

        let baseTileX = Math.floor(getScreenToTileX(0, 0));
        let baseTileY = Math.floor(getScreenToTileY(0, 0));

        // tileY +\-
        // tileX -/+
        for (let stepX = -1; stepX <= totalStepX; stepX += 1)
        {
            for (let stepY = -1; stepY <= totalStepY; stepY += 1)
            {
                // probably only works with square batch
                let tileX = baseTileX + stepX * minBatchEdge + stepY * minBatchEdge;
                let tileY = baseTileY - stepX * minBatchEdge + stepY * minBatchEdge;
                let batchX = MMAPBATCH.getTileXToBatchX(tileX);
                let batchY = MMAPBATCH.getTileYToBatchY(tileY);
                // note: tileX and tileY ay not be valid coordinates,
                // however batchY + 1 may be, so check only upon adding
                if (MMAPDATA.isValidCoordinates(tileX, tileY))
                {
                    batchList.push(MMAPBATCH.getBatchMapIndex(batchX, batchY));
                }
                let tileYAlt = MMAPBATCH.getBatchYToStartTileY(batchY + 1);
                if (MMAPDATA.isValidCoordinates(tileX, tileYAlt))
                {
                    batchList.push(MMAPBATCH.getBatchMapIndex(batchX, batchY + 1));
                }
            }
        }

        return batchList;
    }

    let processBatchFlag = function mmaprender_processBatchFlag(batchPerCall, batchFlag)
    {
        let keys = Object.keys(batchFlag);
        let count = 0;
        let textureLoadCount = 0;
        // pre order
        let loadedTextureKeys = [];
        let toLoadTextureKeys = [];
        for (let i in keys)
        {
            let k = keys[i];
            let pair = MMAPBATCH.getBatchMapIndexReverse(k);
            let batchX = pair[0];
            let batchY = pair[1];
            let textureFlag = batchFlag[k].loadTexture;
            if (textureFlag)
            {
                toLoadTextureKeys.push(k);
            }
            else
            {
                loadedTextureKeys.push(k);
            }
        }
        let orderedKeys = loadedTextureKeys;
        for (let i in toLoadTextureKeys)
        {
            orderedKeys.push(toLoadTextureKeys[i]);
            //break; // process only one texture load per call
        }
        for (let i in orderedKeys)
        {
            let k = orderedKeys[i];
            let pair = MMAPBATCH.getBatchMapIndexReverse(k);
            let batchX = pair[0];
            let batchY = pair[1];
            let textureFlag = batchFlag[k].loadTexture;
            if (textureFlag)
            {
                let startTileX = MMAPBATCH.getBatchXToStartTileX(batchX);
                let startTileY = MMAPBATCH.getBatchYToStartTileY(batchY);
                let endTileX = MMAPBATCH.getBatchXToEndTileX(batchX);
                let endTileY = MMAPBATCH.getBatchYToEndTileY(batchY);
                for (let x = startTileX; x < endTileX; x++)
                {
                    for (let y = startTileY; y < endTileY; y++)
                    {
                        if (MMAPDATA.isValidCoordinates(x, y))
                        {
                            let tileId = MMAPDATA.getTileId(x, y);
                            public.setTile(x, y, tileId);
                            count++;
                        }
                    }
                }
            }
            let visibleFlag = batchFlag[k].visible;
            if (typeof visibleFlag != 'undefined')
            {
                MMAPBATCH.setBatchVisible(batchX, batchY, visibleFlag);
            }
            let removeFlag = batchFlag[k].remove;
            if (typeof removeFlag != 'undefined')
            {
                MMAPBATCH.removeBatch(batchX, batchY);
            }
            delete batchFlag[k];
            count++;
            if (count >= batchPerCall)
            {
                if (i < orderedKeys.length - 1)
                {
                    // leftovers, probably need to zoom
                    // especially if moving batches is
                    // already taking all computation
                    // and leaves nothing to texture 
                }
                return false;
            }
        }
        return true;
    }

    // hold getBatchMapIndex
    let m_batchFlag = {};
    let m_batchPerCall = 1;
    let m_lastTime = 0;
    let m_refreshCall = true;

    public.C_FPS = 30;
    public.C_MINBATCHPERCALL = 1;
    public.C_MAXBATCHPERCALL = 800;

    public.update = function mmaprender_update(dt, time)
    {
        let updatedTiles = MMAPDATA.commitChangeLog();
        if (updatedTiles.length == 1)
        {
            m_refreshCall = true;
            updatedTiles = [];
        }
        
        // remarks: one single call to texture change
        // is likely to cause a complete refresh of the
        // m_mapDisplay container, even if the
        // texture change occurs outside viewport.
        // under no texture change, calls to visible
        // may affect performance.
        // Container size raises the cost of refresh.
        // 1/ Possible strategy is to keep sprite grain
        // but regroup them into multiple, smaller
        // containers DONE
        // a call to visible or texture change may 
        // refresh smaller container instead,
        // leading to shorter delay
        // has ability to turn containers into cached
        // bitmap? DONE
        // note: better performance reached when
        // visibility is controlled at higher level
        // 2/ the texture change is one of the
        // factor that leads to fps slowdown
        // consider performing texture change to
        // elements that come into view, and not
        // earlier. Impact may lead to stuttering during
        // scrolls DONE
        // 3/ stutering happens on scroll, which is
        // mitigated by a loading queue that process 
        // limited number of batches. position and 
        // visibility are prioritized, last are 
        // texture loading. DONE
        // 4/ container creation could also be in cause,
        // consider pooling?
        // 5/ consider not using radius but
        // exact list of batches on screen? DONE
        // 6/ upon instantiation of 1k+ batches
        // browser is out of memory. consider
        // deleting batches if out of viewport?
        // or putting them in pool
        // Note that a batch contains sprites so themselves
        // should also be deleted

        let time0 = Date.now();

        updateCameraVelocity();

        if (m_cameraBatchListRendered === null)
        {
            
        }
        else
        {
            MMAPBATCH.setVisibilityFlagInList(
            m_batchFlag,
            m_cameraBatchListRendered,
            false);
        }

        let currentCenterTileX = getCenterTileX();
        let currentCenterTileY = getCenterTileY();
        let currentRadius = getVisibleTileRadius();
        let currentBatchRadius = getVisibleBatchRadius();

        let currentBatchList = getBatchIndexInScreen2();

        MMAPBATCH.setVisibilityFlagInList(
        m_batchFlag,
        currentBatchList,
        true);
        
        MMAPBATCH.setLifetimeFlagInList(
        m_batchFlag,
        currentBatchList);

        let time1 = Date.now();

        MMAPBATCH.setTextureFlagInNewBatch(
        m_batchFlag,
        m_refreshCall);

        MMAPBATCH.setTextureFlagInRadiusAndUpdatedTiles(
        m_batchFlag,
        currentCenterTileX,
        currentCenterTileY,
        currentBatchRadius,
        updatedTiles);

        let time2 = Date.now();
        
        let fullyProcessed = processBatchFlag(m_batchPerCall, m_batchFlag);
        //let increaseBatchPerCall = Object.keys(m_batchFlag).length > 0;
        let increaseBatchPerCall = !fullyProcessed;

        let slowdown = false;
        if (dt > 1000 / public.C_FPS)
        {
            m_batchPerCall--;
            if (m_batchPerCall < public.C_MINBATCHPERCALL)
            {
                m_batchPerCall = public.C_MINBATCHPERCALL;
            }
            slowdown = true;
        }
        else if (increaseBatchPerCall)
        {
            m_batchPerCall++;
            if (m_batchPerCall >= public.C_MAXBATCHPERCALL)
            {
                m_batchPerCall = public.C_MAXBATCHPERCALL;
            }
        }

        let time3 = Date.now();

        // checking whether it is texture load
        /*
        if (time1 - time0 > 16)
        {
            console.log(time1 - time0 + 'p');
        }
        if (time2 - time1 > 16)
        {
            console.log(time2 - time1 + 't');
        }
        if (time3 - time2 > 16)
        {
            console.log(time3 - time2 + 'f');
        }
        */
        
        //MMAPBATCH.printMapLayerState();

        m_cameraMapXRendered = m_cameraMapX;
        m_cameraMapYRendered = m_cameraMapY;
        m_cameraScaleXRendered = m_cameraScaleX;
        m_cameraScaleYRendered = m_cameraScaleY;
        m_cameraCenterTileXRendered = currentCenterTileX;
        m_cameraCenterTileYRendered = currentCenterTileY;
        m_cameraBatchRadiusRendered = currentBatchRadius;
        m_cameraBatchListRendered = currentBatchList;
        m_refreshCall = false;
        
        return slowdown;
    }
    
    public.processSingleClick = function mmaprender_processSingleClick(screenX, screenY)
    {
        let tileX = getScreenToTileX(screenX, screenY) | 0;
        let tileY = getScreenToTileY(screenX, screenY) | 0;
        m_singleClickCallback(tileX, tileY);
    }
    
    public.processDoubleClick = function mmaprender_processDoubleClick(screenX, screenY)
    {
        let tileX = getScreenToTileX(screenX, screenY) | 0;
        let tileY = getScreenToTileY(screenX, screenY) | 0;
        m_doubleClickCallback(tileX, tileY);
    }

    return public;
})();
// ---------------------
let ASCOMPONENT = (function ()
{
    let public = {};
    let s_entityId = 0;

    public.Id = function Id()
    {
        this.id = s_entityId++;
    }

    public.Position = function Position()
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    public.Renderable = function Renderable()
    {
        // 0 is never rendered
        // the lower it is,
        // the first it is
        // to be skipped
        this.level = ASRENDER.C_MAXLEVEL;
    }

    return public;
})();
// ---------------------
let ASPAX = (function ()
{
    let public = {};

    public.create = function aspax_create(x, y)
    {
        let entity = Nano.createEntity();
        entity.
        addComponent(ASCOMPONENT.Id).
        addComponent(ASCOMPONENT.Position).
        addComponent(ASCOMPONENT.Renderable);
        entity.position.x = x;
        entity.position.y = y;
        entity.renderable.level = entity.id.id % ASRENDER.C_MAXLEVEL;
        return entity;
    }

    return public;
})();
// ---------------------
let ASRENDER = (function ()
{
    let public = {};

    public.C_FPS = 30;
    public.C_MINLEVEL = 0;
    public.C_MAXLEVEL = 100;

    let m_lastTime = 0;

    let m_renderLevel = public.C_MINLEVEL;

    public.update = function asrender_update(dt, time)
    {
        m_lastTime = time;
        let candidates = Nano.queryComponents([
        ASCOMPONENT.Id,
        ASCOMPONENT.Position,
        ASCOMPONENT.Renderable]);
        if (dt > 1000 / public.C_FPS)
        {
            m_renderLevel--;
            if (m_renderLevel < public.C_MINLEVEL)
            {
                m_renderLevel = public.C_MINLEVEL;
            }
        }
        else
        {
            m_renderLevel++;
            if (m_renderLevel >= public.C_MAXLEVEL)
            {
                m_renderLevel = public.C_MAXLEVEL;
            }
        }
        candidates.forEach(function (entity)
        {
            ASPIXIRENDER.setSpriteToPosition(
            entity.id.id,
            entity.position.x,
            entity.position.y,
            entity.renderable.level < m_renderLevel);
        });
    }

    return public;
})();
// --------------------
let ASRANDOMMOVE = (function ()
{
    let public = {};

    let m_lastTime = 0;

    public.update = function asrandommove_update(dt, time)
    {
        if (time - m_lastTime < 1000)
        {
            //return;
        }
        m_lastTime = time;
        let ut = 1000 / 60;

        let candidates = Nano.queryComponents([
        ASCOMPONENT.Position, ]);
        candidates.forEach(function (entity)
        {
            entity.position.x = (entity.position.x + dt / ut) % ASMAP.getWidth();
            //entity.position.y += dt/ut*(Math.floor(Math.random() * 3) - 1);
        });
    }

    return public;
})();
// ---------------------
function pfTest(IPF, s)
{
    let grid = new IPF.Grid(s, s);
    pfFormatTestGrid(grid, s, s);
    let jpf = new IPF.JumpPointFinder();
    let path = jpf.findPath(0, 0, s - 10, 0, grid);

    //console.log(path);
}

function BenchhState()
{
    let suite = new Benchmark.Suite;
    let s = 400;

    let pgrid = new PF.Grid(s, s);
    pfFormatTestGrid(pgrid, s, s);
    let pjpf = new PF.JumpPointFinder();

    let agrid = new ASPF.Grid(s, s);
    pfFormatTestGrid(agrid, s, s);
    let ajpf = new ASPF.JumpPointFinder();

    // add tests
    suite.add('PF', function ()
    {
        let grid = pgrid.clone();
        let path = pjpf.findPath(0, 0, s - 10, s - 10, grid);
    })
        .add('ASPF', function ()
    {
        let path = ajpf.findPath(0, 0, s - 10, s - 10, agrid);
    })
    // add listeners
    .on('cycle', function (event)
    {
        console.log(String(event.target));
    })
        .on('complete', function ()
    {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run(
    {
        async: false
    });

    console.log('run');

    g_state = BenchLoopState;
}

function BenchState()
{
    let w = 200;
    let h = 275;
    let grid = new ASPF.Grid(w, h);
    pfFormatTestGrid(grid, w, h);
    ASPIXIRENDER.drawGrid(grid, w, h);
    //let ajpf = new ASPF.JumpPointFinder();
    //ajpf.findPath(0, 0, 290, 290, grid);
    //console.log(ajpf.findPath(0, 0, 7, 0, grid));
    //console.log('end');
    g_state = WaitingState;
}

let Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

floor = Math.floor, min = Math.min;


/*
  Default comparison function to be used
   */

defaultCmp = function (x, y)
{
    if (x < y)
    {
        return -1;
    }
    if (x > y)
    {
        return 1;
    }
    return 0;
};


/*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

insort = function (a, x, lo, hi, cmp)
{
    let mid;
    if (lo == null)
    {
        lo = 0;
    }
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    if (lo < 0)
    {
        throw new Error('lo must be non-negative');
    }
    if (hi == null)
    {
        hi = a.length;
    }
    while (lo < hi)
    {
        mid = floor((lo + hi) / 2);
        if (cmp(x, a[mid]) < 0)
        {
            hi = mid;
        }
        else
        {
            lo = mid + 1;
        }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
};


/*
  Push item onto heap, maintaining the heap invariant.
   */

heappush = function (array, item, cmp)
{
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
};


/*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

heappop = function (array, cmp)
{
    let lastelt, returnitem;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length)
    {
        returnitem = array[0];
        array[0] = lastelt;
        _siftup(array, 0, cmp);
    }
    else
    {
        returnitem = lastelt;
    }
    return returnitem;
};


/*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

heapreplace = function (array, item, cmp)
{
    let returnitem;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
};


/*
  Fast version of a heappush followed by a heappop.
   */

heappushpop = function (array, item, cmp)
{
    let _ref;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0)
    {
        _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
        _siftup(array, 0, cmp);
    }
    return item;
};


/*
  Transform list into a heap, in-place, in O(array.length) time.
   */

heapify = function (array, cmp)
{
    let i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    _ref1 = (function ()
    {
        _results1 = [];
        for (let _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--)
        {
            _results1.push(_j);
        }
        return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++)
    {
        i = _ref1[_i];
        _results.push(_siftup(array, i, cmp));
    }
    return _results;
};


/*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

updateItem = function (array, item, cmp)
{
    let pos;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1)
    {
        return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
};


/*
  Find the n largest elements in a dataset.
   */

nlargest = function (array, n, cmp)
{
    let elem, result, _i, _len, _ref;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length)
    {
        return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++)
    {
        elem = _ref[_i];
        heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
};


/*
  Find the n smallest elements in a dataset.
   */

nsmallest = function (array, n, cmp)
{
    let elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    if (n * 10 <= array.length)
    {
        result = array.slice(0, n).sort(cmp);
        if (!result.length)
        {
            return result;
        }
        los = result[result.length - 1];
        _ref = array.slice(n);
        for (_i = 0, _len = _ref.length; _i < _len; _i++)
        {
            elem = _ref[_i];
            if (cmp(elem, los) < 0)
            {
                insort(result, elem, 0, null, cmp);
                result.pop();
                los = result[result.length - 1];
            }
        }
        return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j)
    {
        _results.push(heappop(array, cmp));
    }
    return _results;
};

_siftdown = function (array, startpos, pos, cmp)
{
    let newitem, parent, parentpos;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos)
    {
        parentpos = (pos - 1) >> 1;
        parent = array[parentpos];
        if (cmp(newitem, parent) < 0)
        {
            array[pos] = parent;
            pos = parentpos;
            continue;
        }
        break;
    }
    return array[pos] = newitem;
};

_siftup = function (array, pos, cmp)
{
    let childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos)
    {
        rightpos = childpos + 1;
        if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0))
        {
            childpos = rightpos;
        }
        array[pos] = array[childpos];
        pos = childpos;
        childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
};

Heap = (function ()
{
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(grid, cmp)
    {
        this.cmp = cmp != null ? cmp : defaultCmp;
        this.nodes = [];
        this.grid = grid;
    }

    Heap.prototype.push = function (x)
    {
        return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function ()
    {
        return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function ()
    {
        return this.nodes[0];
    };

    Heap.prototype.contains = function (x)
    {
        return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function (x)
    {
        return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function (x)
    {
        return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function ()
    {
        return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function (x)
    {
        return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function ()
    {
        return this.nodes = [];
    };

    Heap.prototype.empty = function ()
    {
        return this.nodes.length === 0;
    };

    Heap.prototype.size = function ()
    {
        return this.nodes.length;
    };

    Heap.prototype.clone = function ()
    {
        let heap;
        heap = new Heap(this.grid);
        heap.nodes = this.nodes.slice(0);
        return heap;
    };

    Heap.prototype.toArray = function ()
    {
        return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

})();

let ASPF = (function ()
{
    let public = {};

    // DiagonalMovement.js
    public.DiagonalMovement =
    {
        Always: 1,
        Never: 2,
        IfAtMostOneObstacle: 3,
        OnlyWhenNoObstacles: 4
    };

    // Heuristic.js
    public.Heuristic =
    {

        /**
         * Manhattan distance.
         * @param {number} dx - Difference in x.
         * @param {number} dy - Difference in y.
         * @return {number} dx + dy
         */
        manhattan: function (dx, dy)
        {
            return dx + dy;
        },

        /**
         * Euclidean distance.
         * @param {number} dx - Difference in x.
         * @param {number} dy - Difference in y.
         * @return {number} sqrt(dx * dx + dy * dy)
         */
        euclidean: function (dx, dy)
        {
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * Octile distance.
         * @param {number} dx - Difference in x.
         * @param {number} dy - Difference in y.
         * @return {number} sqrt(dx * dx + dy * dy) for grids
         */
        octile: function (dx, dy)
        {
            let F = Math.SQRT2 - 1;
            return (dx < dy) ? F * dx + dy : F * dy + dx;
        },

        /**
         * Chebyshev distance.
         * @param {number} dx - Difference in x.
         * @param {number} dy - Difference in y.
         * @return {number} max(dx, dy)
         */
        chebyshev: function (dx, dy)
        {
            return Math.max(dx, dy);
        }

    };

    // Util.js
    public.Util =
    {
        backtrace: function backtrace(node, grid)
        {
            let path = [
                [grid.nodes.x[node], grid.nodes.y[node]]
            ];
            while (typeof grid.nodes.parent[node] !== 'undefined')
            {
                node = grid.nodes.parent[node];
                path.push([grid.nodes.x[node], grid.nodes.y[node]]);
            }
            return path.reverse();
        },

        interpolate: function interpolate(x0, y0, x1, y1)
        {
            let abs = Math.abs,
                line = [],
                sx, sy, dx, dy, err, e2;

            dx = abs(x1 - x0);
            dy = abs(y1 - y0);

            sx = (x0 < x1) ? 1 : -1;
            sy = (y0 < y1) ? 1 : -1;

            err = dx - dy;

            while (true)
            {
                line.push([x0, y0]);

                if (x0 === x1 && y0 === y1)
                {
                    break;
                }

                e2 = 2 * err;
                if (e2 > -dy)
                {
                    err = err - dy;
                    x0 = x0 + sx;
                }
                if (e2 < dx)
                {
                    err = err + dx;
                    y0 = y0 + sy;
                }
            }

            return line;
        },

        expandPath: function expandPath(path)
        {
            let expanded = [],
                len = path.length,
                coord0, coord1,
                interpolated,
                interpolatedLen,
                i, j;

            if (len < 2)
            {
                return expanded;
            }

            for (i = 0; i < len - 1; ++i)
            {
                coord0 = path[i];
                coord1 = path[i + 1];

                interpolated = this.interpolate(coord0[0], coord0[1], coord1[0], coord1[1]);
                interpolatedLen = interpolated.length;
                for (j = 0; j < interpolatedLen - 1; ++j)
                {
                    expanded.push(interpolated[j]);
                }
            }
            expanded.push(path[len - 1]);

            return expanded;
        }
    };

    // Grid.js
    public.Grid = function Grid(width_or_matrix, height, matrix)
    {
        let width;

        if (typeof width_or_matrix !== 'object')
        {
            width = width_or_matrix;
        }
        else
        {
            height = width_or_matrix.length;
            width = width_or_matrix[0].length;
            matrix = width_or_matrix;
        }

        /**
         * The number of columns of the grid.
         * @type number
         */
        this.width = width;
        /**
         * The number of rows of the grid.
         * @type number
         */
        this.height = height;

        /**
         * A container of nodes properties.
         */
        this.nodes = this._buildNodes(width, height, matrix);
    }

    public.Grid.prototype._buildNodes = function (width, height, matrix)
    {
        let i, j,
        nodes = {};

        nodes.x = new Array(height * width);
        nodes.y = new Array(height * width);
        nodes.walkable = new Array(height * width);

        for (i = 0; i < width; ++i)
        {
            for (j = 0; j < height; ++j)
            {
                nodes.x[this.getNodeAt(i, j)] = i;
                nodes.y[this.getNodeAt(i, j)] = j;
                nodes.walkable[this.getNodeAt(i, j)] = true;
            }
        }

        if (matrix === undefined)
        {
            return nodes;
        }

        if (matrix.length !== height || matrix[0].length !== width)
        {
            throw new Error('Matrix size does not fit');
        }

        for (i = 0; i < height; ++i)
        {
            for (j = 0; j < width; ++j)
            {
                if (matrix[i][j])
                {
                    // 0, false, null will be walkable
                    // while others will be un-walkable
                    nodes.walkable[this.getNodeAt(i, j)] = false;
                }
            }
        }

        return nodes;
    };

    public.Grid.prototype.getNodeAt = function (x, y)
    {
        return x + y * this.width;
    };

    public.Grid.prototype.isWalkableAt = function (x, y)
    {
        return this.isInside(x, y) && this.nodes.walkable[this.getNodeAt(x, y)];
    };

    public.Grid.prototype.isInside = function (x, y)
    {
        return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
    };

    public.Grid.prototype.setWalkableAt = function (x, y, walkable)
    {
        this.nodes.walkable[this.getNodeAt(x, y)] = walkable;
    };

    public.Grid.prototype.getNeighbors = function (node, diagonalMovement)
    {
        let x = this.nodes.x[node],
            y = this.nodes.y[node],
            neighbors = [],
            s0 = false,
            d0 = false,
            s1 = false,
            d1 = false,
            s2 = false,
            d2 = false,
            s3 = false,
            d3 = false,
            nodes = this.nodes;

        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ
        if (this.isWalkableAt(x, y - 1))
        {
            neighbors.push(this.getNodeAt(x, y - 1));
            s0 = true;
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
        if (this.isWalkableAt(x + 1, y))
        {
            neighbors.push(this.getNodeAt(x + 1, y));
            s1 = true;
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Å“
        if (this.isWalkableAt(x, y + 1))
        {
            neighbors.push(this.getNodeAt(x, y + 1));
            s2 = true;
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã‚Â
        if (this.isWalkableAt(x - 1, y))
        {
            neighbors.push(this.getNodeAt(x - 1, y));
            s3 = true;
        }

        if (diagonalMovement === public.DiagonalMovement.Never)
        {
            return neighbors;
        }

        if (diagonalMovement === public.DiagonalMovement.OnlyWhenNoObstacles)
        {
            d0 = s3 && s0;
            d1 = s0 && s1;
            d2 = s1 && s2;
            d3 = s2 && s3;
        }
        else if (diagonalMovement === public.DiagonalMovement.IfAtMostOneObstacle)
        {
            d0 = s3 || s0;
            d1 = s0 || s1;
            d2 = s1 || s2;
            d3 = s2 || s3;
        }
        else if (diagonalMovement === public.DiagonalMovement.Always)
        {
            d0 = true;
            d1 = true;
            d2 = true;
            d3 = true;
        }
        else
        {
            throw new Error('Incorrect value of diagonalMovement');
        }

        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â€œ
        if (d0 && this.isWalkableAt(x - 1, y - 1))
        {
            neighbors.push(this.getNodeAt(x - 1, y - 1));
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â€
        if (d1 && this.isWalkableAt(x + 1, y - 1))
        {
            neighbors.push(this.getNodeAt(x + 1, y - 1));
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã‹Å“
        if (d2 && this.isWalkableAt(x + 1, y + 1))
        {
            neighbors.push(this.getNodeAt(x + 1, y + 1));
        }
        // ÃƒÂ¢Ã¢â‚¬Â Ã¢â€žÂ¢
        if (d3 && this.isWalkableAt(x - 1, y + 1))
        {
            neighbors.push(this.getNodeAt(x - 1, y + 1));
        }

        return neighbors;
    };

    public.Grid.prototype.clone = function ()
    {
        let i, j,
        width = this.width,
            height = this.height,
            thisNodes = this.nodes,

            newGrid = new public.Grid(width, height),
            newNodes = {};

        newNodes.x = thisNodes.x.slice();
        newNodes.y = thisNodes.y.slice();
        newNodes.walkable = thisNodes.walkable.slice();

        newGrid.nodes = newNodes;

        return newGrid;
    };

    // JumpPointFinder.js
    public.JumpPointFinder = function JumpPointFinder(opt)
    {
        opt = opt || {};
        if (opt.diagonalMovement === public.DiagonalMovement.Never)
        {
            return new public.JPFNeverMoveDiagonally(opt);
        }
        else if (opt.diagonalMovement === public.DiagonalMovement.Always)
        {
            return new public.JPFAlwaysMoveDiagonally(opt);
        }
        else if (opt.diagonalMovement === public.DiagonalMovement.OnlyWhenNoObstacles)
        {
            return new public.JPFMoveDiagonallyIfNoObstacles(opt);
        }
        else
        {
            return new public.JPFMoveDiagonallyIfAtMostOneObstacle(opt);
        }
    }

    // JumpPointFinderBase.js
    public.JumpPointFinderBase = function JumpPointFinderBase(opt)
    {
        opt = opt || {};
        this.heuristic = opt.heuristic || public.Heuristic.manhattan;
        this.trackJumpRecursion = opt.trackJumpRecursion || false;
    }

    public.JumpPointFinderBase.prototype.findPath = function (startX, startY, endX, endY, grid)
    {
        let openList = this.openList = new Heap(grid, function heapCmp(nodeA, nodeB)
        {
            return grid.nodes.f[nodeA] - grid.nodes.f[nodeB];
        }),
            startNode = this.startNode = grid.getNodeAt(startX, startY),
            endNode = this.endNode = grid.getNodeAt(endX, endY),
            node;

        this.grid = grid;

        let size = grid.width * grid.height;
        let nodes = grid.nodes;
        nodes.g = {};
        nodes.f = {};
        nodes.h = {};
        nodes.opened = {};
        nodes.closed = {};
        nodes.parent = {};

        // set the `g` and `f` value of the start node to be 0
        nodes.g[startNode] = 0;
        nodes.f[startNode] = 0;

        // push the start node into the open list
        openList.push(startNode);
        nodes.opened[startNode] = true;

        // while the open list is not empty
        while (!openList.empty())
        {
            // pop the position of node which has the minimum `f` value.
            node = openList.pop();
            nodes.closed[node] = true;

            if (node === endNode)
            {
                return public.Util.expandPath(public.Util.backtrace(endNode, grid));
            }

            this._identifySuccessors(node);
        }

        // fail to find the path
        return [];
    };

    public.JumpPointFinderBase.prototype._identifySuccessors = function (node)
    {
        let grid = this.grid,
            heuristic = this.heuristic,
            openList = this.openList,
            endX = this.grid.nodes.x[this.endNode],
            endY = this.grid.nodes.y[this.endNode],
            neighbors, neighbor,
            jumpPoint, i, l,
            x = this.grid.nodes.x[node],
            y = this.grid.nodes.y[node],
            jx, jy, dx, dy, d, ng, jumpNode,
            abs = Math.abs,
            max = Math.max;

        neighbors = this._findNeighbors(node);
        for (i = 0, l = neighbors.length; i < l; ++i)
        {
            neighbor = neighbors[i];
            jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
            if (jumpPoint)
            {

                jx = jumpPoint[0];
                jy = jumpPoint[1];
                jumpNode = grid.getNodeAt(jx, jy);

                if (this.grid.nodes.closed[jumpNode])
                {
                    continue;
                }

                // include distance, as parent may not be immediately adjacent:
                d = public.Heuristic.octile(abs(jx - x), abs(jy - y));
                ng = this.grid.nodes.g[node] + d; // next `g` value

                if (!this.grid.nodes.opened[jumpNode] || ng < this.grid.nodes.g[jumpNode])
                {
                    this.grid.nodes.g[jumpNode] = ng;
                    this.grid.nodes.h[jumpNode] = this.grid.nodes.h[jumpNode] || heuristic(abs(jx - endX), abs(jy - endY));
                    this.grid.nodes.f[jumpNode] = this.grid.nodes.g[jumpNode] + this.grid.nodes.h[jumpNode];
                    this.grid.nodes.parent[jumpNode] = node;

                    if (!this.grid.nodes.opened[jumpNode])
                    {
                        openList.push(jumpNode);
                        this.grid.nodes.opened[jumpNode] = true;
                    }
                    else
                    {
                        openList.updateItem(jumpNode);
                    }
                }
            }
        }
    };

    // JPFMoveDiagonallyIfAtMostObeObstacle.js
    public.JPFMoveDiagonallyIfAtMostOneObstacle = function JPFMoveDiagonallyIfAtMostOneObstacle(opt)
    {
        public.JumpPointFinderBase.call(this, opt);
    }

    public.JPFMoveDiagonallyIfAtMostOneObstacle.prototype = new public.JumpPointFinderBase();
    public.JPFMoveDiagonallyIfAtMostOneObstacle.prototype.constructor = public.JPFMoveDiagonallyIfAtMostOneObstacle;

    public.JPFMoveDiagonallyIfAtMostOneObstacle.prototype._jump = function (x, y, px, py)
    {
        let grid = this.grid,
            dx = x - px,
            dy = y - py;

        if (!grid.isWalkableAt(x, y))
        {
            return null;
        }

        if (this.trackJumpRecursion === true)
        {
            grid.nodes.tested[grid.getNodeAt(x, y)] = true;
        }

        if (grid.getNodeAt(x, y) === this.endNode)
        {
            return [x, y];
        }

        // check for forced neighbors
        // along the diagonal
        if (dx !== 0 && dy !== 0)
        {
            if ((grid.isWalkableAt(x - dx, y + dy) && !grid.isWalkableAt(x - dx, y)) || (grid.isWalkableAt(x + dx, y - dy) && !grid.isWalkableAt(x, y - dy)))
            {
                return [x, y];
            }
            // when moving diagonally, must check for vertical/horizontal jump points
            if (this._jump(x + dx, y, x, y) || this._jump(x, y + dy, x, y))
            {
                return [x, y];
            }
        }
        // horizontally/vertically
        else
        {
            if (dx !== 0)
            { // moving along x
                if ((grid.isWalkableAt(x + dx, y + 1) && !grid.isWalkableAt(x, y + 1)) || (grid.isWalkableAt(x + dx, y - 1) && !grid.isWalkableAt(x, y - 1)))
                {
                    return [x, y];
                }
            }
            else
            {
                if ((grid.isWalkableAt(x + 1, y + dy) && !grid.isWalkableAt(x + 1, y)) || (grid.isWalkableAt(x - 1, y + dy) && !grid.isWalkableAt(x - 1, y)))
                {
                    return [x, y];
                }
            }
        }

        // moving diagonally, must make sure one of the vertical/horizontal
        // neighbors is open to allow the path
        if (grid.isWalkableAt(x + dx, y) || grid.isWalkableAt(x, y + dy))
        {
            return this._jump(x + dx, y + dy, x, y);
        }
        else
        {
            return null;
        }
    };

    public.JPFMoveDiagonallyIfAtMostOneObstacle.prototype._findNeighbors = function (node)
    {
        let parent = this.grid.nodes.parent[node],
            x = this.grid.nodes.x[node],
            y = this.grid.nodes.y[node],
            grid = this.grid,
            px, py, nx, ny, dx, dy,
            neighbors = [],
            neighborNodes, neighborNode, i, l;

        // directed pruning: can ignore most neighbors, unless forced.
        if (parent)
        {
            px = this.grid.nodes.x[parent];
            py = this.grid.nodes.y[parent];
            // get the normalized direction of travel
            dx = (x - px) / Math.max(Math.abs(x - px), 1);
            dy = (y - py) / Math.max(Math.abs(y - py), 1);

            // search diagonally
            if (dx !== 0 && dy !== 0)
            {
                if (grid.isWalkableAt(x, y + dy))
                {
                    neighbors.push([x, y + dy]);
                }
                if (grid.isWalkableAt(x + dx, y))
                {
                    neighbors.push([x + dx, y]);
                }
                if (grid.isWalkableAt(x, y + dy) || grid.isWalkableAt(x + dx, y))
                {
                    neighbors.push([x + dx, y + dy]);
                }
                if (!grid.isWalkableAt(x - dx, y) && grid.isWalkableAt(x, y + dy))
                {
                    neighbors.push([x - dx, y + dy]);
                }
                if (!grid.isWalkableAt(x, y - dy) && grid.isWalkableAt(x + dx, y))
                {
                    neighbors.push([x + dx, y - dy]);
                }
            }
            // search horizontally/vertically
            else
            {
                if (dx === 0)
                {
                    if (grid.isWalkableAt(x, y + dy))
                    {
                        neighbors.push([x, y + dy]);
                        if (!grid.isWalkableAt(x + 1, y))
                        {
                            neighbors.push([x + 1, y + dy]);
                        }
                        if (!grid.isWalkableAt(x - 1, y))
                        {
                            neighbors.push([x - 1, y + dy]);
                        }
                    }
                }
                else
                {
                    if (grid.isWalkableAt(x + dx, y))
                    {
                        neighbors.push([x + dx, y]);
                        if (!grid.isWalkableAt(x, y + 1))
                        {
                            neighbors.push([x + dx, y + 1]);
                        }
                        if (!grid.isWalkableAt(x, y - 1))
                        {
                            neighbors.push([x + dx, y - 1]);
                        }
                    }
                }
            }
        }
        // return all neighbors
        else
        {
            neighborNodes = grid.getNeighbors(node, public.DiagonalMovement.IfAtMostOneObstacle);
            for (i = 0, l = neighborNodes.length; i < l; ++i)
            {
                neighborNode = neighborNodes[i];
                neighbors.push([this.grid.nodes.x[neighborNode], this.grid.nodes.y[neighborNode]]);
            }
        }

        return neighbors;
    };

    return public;
})();