let Benchmark = require('benchmark');

'use strict';

(function ()
{
    let exLog = console.log;
    console.log = function (msg)
    {
        exLog.apply(this, arguments);
        if (typeof g_debugOverlay != 'undefined')
        {
            //exLog.apply(this, arguments);
            g_debugOverlay.innerHTML = JSON.stringify(msg) + "<br>" + g_debugOverlay.innerHTML;
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
        return fetchLocal("rust/asengine.wasm")
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

function OnReady()
{
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
    //console.log("touch " + g_interactionManager.supportsTouchEvents);
    g_interactionManager.moveWhenInside = true;

    g_stats.domElement.style.userSelect = 'none';
    document.body.appendChild(g_stats.domElement);

    window.onresize = Resize;
    Resize();
    
    g_app.ticker.add(Update);
    
    console.log("Waiting");
}

function loadTexture()
{
    const loader = PIXI.loader;
    
    loader.add("img/cityTiles_sheet.json");
    loader.load();
    loader.onProgress.add(LoaderProgressHandler);
    loader.onComplete.add(() => {
        g_state = StartState;
    });
}

PSEENGINE.onComplete = loadTexture;

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

function Resize()
{
    //console.log('resizing');
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

function StartState()
{
    console.log("Start state");
    ASMAP.initialize(16, 16);
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
    
    public.C_NAME = 'ASMAP';
    
    public.initialize = function asmap_initialize(w, h)
    {
        PSEENGINE.initializeModule(undefined, w, h);
        MMAPDATA.initializeMapTableSize(w, h);
        MMAPDATA.initialize(ASTILEVIEW.C_TILEVIEW.ZONE);
        ASTILE.initializeTexture();
        MMAPRENDER.initialize(doSingleClick, doDoubleClick);
        ASMAPUI.initialize();
    }

    let m_computeTimeBudget = 1;
    // ideally this only process
    // mmaprender.update
    public.update = function asmap_update(dt, time)
    {
        const fpsdt = 17*2;
        let frameskipped = dt > fpsdt; //1000 / 60;
        const noBudget = m_computeTimeBudget <= 1;
        const maxBudget = m_computeTimeBudget >= fpsdt - 1;
        const fullyProcessed = MMAPRENDER.update(time, frameskipped, noBudget);
        if (!fullyProcessed && frameskipped && !noBudget)
        {
            m_computeTimeBudget--;
        }
        else if (fullyProcessed && !frameskipped && !maxBudget)
        {
            m_computeTimeBudget++;
        }
        else if (fullyProcessed && frameskipped && !noBudget)
        {
            m_computeTimeBudget--;
        }
        let computeTimeLimit = time + m_computeTimeBudget;
        // engines updates
        if (m_updateStateMachine == 0)
        {
            public.retrieveAllDisplayChange(computeTimeLimit);
        }
        if (m_updateStateMachine == 4)
        {
            public.updateEngine(computeTimeLimit, time);
        }
        updateDebug();
    }
    
    let m_pendingCommitIndexList = [];
    let m_updateStateMachine = 0;
    
    public.retrieveAllDisplayChange = function asmap_retrieveAllDisplayChange(computeTimeLimit)
    {
        if (Date.now() < computeTimeLimit)
        {
            // put before callback for noworker
            m_updateStateMachine = 1;
            let callbackData = [public.C_NAME, 'refreshTileListResponse'];
            let viewName = MMAPDATA.getTileViewName();
            PSEENGINE.retrieveAllChangedTileId(callbackData, viewName);
        }
    }
    
    public.refreshTileListResponse = function asmap_refreshTileListResponse(xytlist)
    {
        for (let i = 0; i < xytlist.length; i+=3)
        {
            let x = xytlist[i];
            let y = xytlist[i+1];
            let t = xytlist[i+2];
            MMAPDATA.refreshTileResponse(x, y, t);
        }
        m_updateStateMachine = 4;
    }
    
    public.updateEngine = function asmap_updateEngine(computeTimeLimit, time)
    {
        // this is uni directional call
        // in practice
        if (PSEENGINE.hasAccess() && Date.now() < computeTimeLimit)
        {
            m_updateStateMachine = 5;
            let callbackData = [public.C_NAME, 'updateEngineResponse'];
            PSEENGINE.update(callbackData, computeTimeLimit, time);
        }
        else if (!PSEENGINE.hasAccess())
        {
            const ENGINE_YIELD_PERIOD = 330; // ms
            m_updateStateMachine = 5;
            let callbackData = [public.C_NAME, 'updateEngineResponse'];
            PSEENGINE.update(callbackData, Date.now() + ENGINE_YIELD_PERIOD, Date.now());
        }
        let infoCallbackData = [public.C_NAME, 'updateEngineInfo'];
        PSEENGINE.getInfoZone(infoCallbackData);
    }
    
    let m_lastTick = 0;
    let m_lastTickTime = 0;
    let m_lastTickDelta = 0;
    
    public.updateEngineResponse = function asmap_updateEngineResponse(tick)
    {
        if (tick < m_lastTick)
        {
            m_lastTick = 0;
            m_lastTickTime = Date.now();
            m_lastTickDelta = 0;
        }
        if (tick > m_lastTick)
        {
            m_lastTick = tick;
            m_lastTickDelta = Date.now() - m_lastTickTime;
            m_lastTickTime = Date.now();
        }
        m_updateStateMachine = 0;
    }
    
    let m_engineData = [];
    
    public.updateEngineInfo = function asmap_updateEngineInfo(data)
    {
        m_engineData = data;
    }
    
    public.getDebugState = function asmap_getDebugState()
    {
        let tickElapsed = 'k(' + m_lastTick + ') ';
        let tickSpeed = 'K(' + m_lastTickDelta + ') ';
        let computeTimeBudget = 'T(' + m_computeTimeBudget + ') ';
        let engineData = 'O(' + m_engineData + ') ';
        return tickElapsed + tickSpeed + computeTimeBudget + engineData;
    }
    
    let doZoneViewSingleClick = function asmap_doZoneViewSingleClick(x, y)
    {
        let selectedId = ASMAPUI.getCurrentZoneId();
        // this assumes selectedId is a valid zone id
        PSEENGINE.setZone(undefined, x, y, selectedId);
    }
    
    let doViewModeRoadLayerSingleClick = function asmap_doViewRoadSingleClick(x, y)
    {
        /*
        let selectedId = ASMAPUI.getCurrentRoadId();
        if (selectedId == PSEENGINE.V_ROAD.LOW)
        {
            PSEENGINE.initializeTraversal(undefined, x, y);
            //console.log('start traversal x' + x + 'y' + y + 'c' + m_roadTraversalTemp);
        }
        else if (selectedId == PSEENGINE.V_ROAD.MID)
        {
            const callbackData = [PSEENGINE.C_NAME, 'printValue'];
            PSEENGINE.getNextStepTraversal(callbackData);
            //console.log('incre traversal x' + next[0] + 'y' + next[1] + 'c' + m_roadTraversalTemp);
        }
        else if (selectedId == PSEENGINE.V_ROAD.HIG)
        {
            const callbackData = [PSEENGINE.C_NAME, 'printValue'];
            PSEENGINE.getTraversalPath(callbackData);
            //console.log('finish traversal');
            //console.log(pathXY);
        }
        else if (selectedId == PSEENGINE.V_ROAD.NONE)
        {
            PSEENGINE.resetTraversalPath(undefined);
        }
        else if (selectedId == PSEENGINE.V_ROAD.VHI)
        {
            PSEENGINE.printTraversal(undefined);
        }
        */
        const callbackData = [ASWENGINE.C_NAME, 'printValue'];
        PSEENGINE.getInfoRoad(callbackData, x, y);
    }
    
    let doViewModeRicoLayerSingleClick = function asmap_doViewModeRicoLayerSingleClick(x, y)
    {
        const callbackData = [ASWENGINE.C_NAME, 'printValue'];
        PSEENGINE.getInfoRico(callbackData, x, y);
    }
    
    let doSingleClick = function asmap_doSingleClick(x, y)
    {
        if (ASMAPUI.isZoneMode())
        {
            doZoneViewSingleClick(x, y);
        }
        if (ASMAPUI.isViewModeRoadLayer())
        {
            doViewModeRoadLayerSingleClick(x, y);
        }
        if (ASMAPUI.isViewModeRicoLayer())
        {
            doViewModeRicoLayerSingleClick(x, y);
        }
    }
    
    let doDoubleClick = function asmap_doDoubleClick(x, y)
    {
        console.log('d' + x + ',' + y);
    }

    let updateDebug = function asmap_updateDebug()
    {
        let b = PSEENGINE.hasAccess();
        
        let interactState = 'i(' + (MMAPTOUCH.isStatePan() ? 'P' : '-') + (MMAPTOUCH.isStateZoom() ? 'Z' : '-') + (MMAPTOUCH.getTouchCount()) + (MMAPTOUCH.getClickCount()) + ') ';
        let frameElapsed = 'f(' + (b ? ASSTATE.getFrame() : 0) + ') ';
        let firstChange = 'h(' + (b ? ASSTATE.getChangeFirst() : 0) + ') ';
        let lastChange = 'H(' + (b ? ASSTATE.getChangeLast() : 0) + ') ';
        let changeLog = 'l(' + MMAPDATA.getChangeLogCalls() + ') ';
        //let cache = 'c(' + Object.keys(PIXI.utils.TextureCache).length + ') ';
        //let memUsage = 'o(' + performance.memory.usedJSHeapSize / 1000 + ') ';
        let render = MMAPRENDER.getDebugState();
        let simulation = ASMAP.getDebugState();
        
        g_counter.innerHTML = interactState + render + simulation + frameElapsed + firstChange + lastChange + changeLog;
    }

    return public;
})();
// ---------------------
let ASMAPUI = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASMAPUI';
    
    let C_DELAY_TAP = 100; // ms
    
    let C_ICON_HEIGHT = 48;
    let C_ICON_WIDTH = 64;
    
    let C = ASTILE_ID.C_TILE_ZONE;
    const C_ZONE_DATA = [
        C.DIRT,
        C.ROAD, 
        C.RESLOW,
        C.INDLOW,
        C.COMLOW,
        C.RESHIG,
        C.INDHIG,
        C.COMHIG,
        C.POWLOW,
    ];
    
    const C_VIEW_DATA = [
        C.DIRT,
        C.COMLOW,
        C.ROAD,
        C.NONE,
        C.RESLOW
    ];
    
    C = ASTILE_ID.C_TILE_ICON;
    const C_MAIN_DATA = [
        C.VIEW,
        C.ZONE,
        C.SPED,
        C.GAME
    ];
    
    const C_PLAY_DATA = [
        C.PLAY, // play 1
        C.PLAY2,
        C.PLAY3,
        C.STOP, // pause
        C.STEP, // frame by frame
    ];
    
    const C_SAVE_DATA = [
        C.SAVE,
        C.LOAD,
        C.BENC
    ];
    
    const C_TABLE = {
        0 : C_MAIN_DATA,
        1 : C_VIEW_DATA,
        2 : C_ZONE_DATA,
        3 : C_PLAY_DATA,
        4 : C_SAVE_DATA
    }
    const C_MAIN = 0;
    const C_VIEW = 1;
    const C_ZONE = 2;
    const C_PLAY = 3;
    const C_SAVE = 4;
    
    let C_LEVEL = {
        [C_MAIN] : 0,
        [C_VIEW] : 1,
        [C_ZONE] : 1,
        [C_PLAY] : 1,
        [C_SAVE] : 1
    };
    
    let C_STATEFUL = {
        [C_MAIN] : true,
        [C_VIEW] : true,
        [C_ZONE] : true,
        [C_PLAY] : true,
        [C_SAVE] : false
    };
    
    let C_VISIBLE_BIND = {
        [C_MAIN] : [-1, -1],
        [C_VIEW] : [0, 0],
        [C_ZONE] : [0, 1],
        [C_PLAY] : [0, 2],
        [C_SAVE] : [0, 3]
    };
    
    let m_uiLayer;
    let m_uiSpriteTable = {};
    let m_uiSpriteOffsetX = {};
    let m_uiSpriteOffsetY = {};
    
    let m_uiActiveId = {};
    
    public.initialize = function asmapui_initialize()
    {
        m_uiLayer = new PIXI.Container();
        g_app.stage.addChild(m_uiLayer);
        m_uiLayer.interactive = false;
        
        for (let i in C_TABLE)
        {
            let tileEnum = C_TABLE[i];
            if (typeof tileEnum == 'undefined')
            {
                throw public.C_NAME + " C_TABLE[" + i + "] undefined";
            }
            setSingleId(i, tileEnum[0]);
        }
        
        public.resize();
    }
    
    let getBackgroundSize = function asmapui_getBackgroundSize()
    {
        let landscape = MMAPRENDER.isOrientationLandscape();
        let backgroundWidth = 0;
        let backgroundHeight = 0;
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
        return [backgroundWidth, backgroundHeight];
    }
    
    let buildMenu = function asmapui_buildMenu(tileEnumId, callback)
    {
        m_uiSpriteTable[tileEnumId] = {};
        let level = C_LEVEL[tileEnumId];
        let tileTable = m_uiSpriteTable[tileEnumId];
        m_uiSpriteOffsetX[tileEnumId] = 0;
        m_uiSpriteOffsetY[tileEnumId] = 0;
        let genericCallback = function (e, id)
        {
            if (Date.now() - m_pressedTileTimeLast >= C_DELAY_TAP)
            {
                return;
            }
            setSingleId(tileEnumId, id);
            if (typeof callback != 'undefined')
            {
                callback(id);
            }
            focusAllSprite();
        }
        const tileEnums = C_TABLE[tileEnumId];
        for (let i in tileEnums)
        {
            let tileId = tileEnums[i];
            let sprite = createSprite(tileId, tileEnumId, genericCallback);
            m_uiLayer.addChild(sprite);
            tileTable[tileId] = sprite;
            sprite.visible = false;
        }
        
        let landscape = MMAPRENDER.isOrientationLandscape();
        let backgroundSize = getBackgroundSize();
        let backgroundWidth = backgroundSize[0];
        let backgroundHeight = backgroundSize[1];
        let background = createMenuBackground(backgroundWidth, backgroundHeight, tileEnumId);
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
    
    let placeMenu = function asmapui_placeMenu(tileEnumId)
    {
        let level = C_LEVEL[tileEnumId];
        let tileEnums = C_TABLE[tileEnumId];
        let tileTable = m_uiSpriteTable[tileEnumId];
        let c = 0;
        let maxWidth = 0;
        let maxHeight = 0;
        for (let i in tileEnums)
        {
            let tileId = tileEnums[i];
            let sprite = tileTable[tileId];
            if (maxWidth < sprite.width)
            {
                maxWidth = sprite.width;
            }
            if (maxHeight < sprite.height)
            {
                maxHeight = sprite.height;
            }
        }
        let landscape = MMAPRENDER.isOrientationLandscape();
        let backgroundSize = getBackgroundSize();
        let backgroundWidth = backgroundSize[0];
        let backgroundHeight = backgroundSize[1];
        for (let i in tileEnums)
        {
            let tileId = tileEnums[i];
            let sprite = tileTable[tileId];
            if (landscape)
            {
                sprite.x = getLayerWidth() - backgroundWidth*(1+level);
                sprite.y = c*maxHeight + m_uiSpriteOffsetY[tileEnumId];
            }
            else
            {
                sprite.x = c*maxWidth + m_uiSpriteOffsetX[tileEnumId];
                sprite.y = getLayerHeight() - backgroundHeight*(1+level);
            }
            c++;
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
        m_uiSpriteTable = {};
        
        let c = 0;
        let maxHeight = 0;
        let maxWidth = 0;
        
        for (let i in C_TABLE)
        {
            buildMenu(i, C_SPRITE_TOUCH[i]);
            placeMenu(i);
        }
        
        focusAllSprite();
    }
    
    let focusAllSprite = function asmapui_focusAllSprite()
    {
        for (let i in C_TABLE)
        {
            focusSprite(i);
        }
    }
    
    let setSingleId = function asmapui_setSingleId(tileEnumId, tileId)
    {
        m_uiActiveId[tileEnumId] = tileId;
    }
    
    let getSingleId = function asmapui_getSingleId(tileEnumId)
    {
        return m_uiActiveId[tileEnumId];
    }
    
    let getVisibleState = function asmapui_getVisibleState(tileEnumId)
    {
        let visibleBind = C_VISIBLE_BIND[tileEnumId];
        let visible;
        if (visibleBind[0] == -1)
        {
            visible = true;
        }
        else
        {
            let parentEnumId = visibleBind[0];
            const parentEnum = C_TABLE[parentEnumId];
            let parentId = parentEnum[visibleBind[1]];
            visible = getSingleId(parentEnumId) == parentId;
        }
        return visible;
    }
    
    let focusSprite = function asmapui_focusSprite(tileEnumId)
    {
        let spriteTable = m_uiSpriteTable[tileEnumId];
        let currentId = getSingleId(tileEnumId);
        let stateful = C_STATEFUL[tileEnumId];
        let visibleBind = C_VISIBLE_BIND[tileEnumId];
        let visible = getVisibleState(tileEnumId);
        let keys = Object.keys(spriteTable);
        for (let i in keys)
        {
            let id = keys[i];
            let sprite = spriteTable[id];
            sprite.alpha = currentId == id || !stateful ? 1 : 0.25;
            sprite.visible = visible;
        }
    }
    
    let getLayerWidth = function asmapui_getLayerWidth()
    {
        return g_app.renderer.width;
    }
    let getLayerHeight = function asmap_getLayerHeight()
    {
        return g_app.renderer.height;
    }
    
    let createSprite = function asmapui_createSprite(id, tileEnumId, callback)
    {
        let textureName = PSETILE.getTileTextureName(id);
        let textureCache = PIXI.utils.TextureCache[textureName];
        let sprite = new PIXI.Sprite(textureCache);
        
        // fit to icon size
        let ratio = sprite.width / sprite.height;
        if (sprite.height > C_ICON_HEIGHT)
        {
            sprite.height = C_ICON_HEIGHT;
            sprite.width = (C_ICON_HEIGHT * ratio) | 0;
        }
        else
        {
            sprite.height = textureCache.height;
            sprite.width = textureCache.width;
        }
        
        sprite.interactive = true;
        sprite.on('pointerdown',
            function(e){
                onMenuDown(e, tileEnumId);
            });
        sprite.on('pointerup',
            function(e){
                onMenuUp(e, tileEnumId);
                callback(e, id);
            });
        sprite.on('pointerupoutside',
            function(e){
                onMenuUp(e, tileEnumId);
            });
        sprite.on('pointermove',
            function(e){
                onMenuMove(e, tileEnumId);
            });
        return sprite;
    }
    
    let createMenuBackground = function asmapui_createMenuBackground(width, height, tileEnumId)
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
        let sprite = new PIXI.Sprite(texture);
        sprite.interactive = true;
        sprite.on('pointerdown',
            function(e){onMenuDown(e, tileEnumId);});
        sprite.on('pointerup',
            function(e){onMenuUp(e, tileEnumId);});
        sprite.on('pointerupoutside',
            function(e){onMenuUp(e, tileEnumId);});
        sprite.on('pointermove', 
            function(e){onMenuMove(e, tileEnumId);});
        return sprite;
    }
    
    let m_pressedTileEnumId = -1;
    let m_pressedTileEnumLastX = null;
    let m_pressedTileEnumLastY = null;
    let m_pressedTileTimeLast = null;
    
    let onMenuDown = function asmapui_onMenuDown(e, tileEnumId)
    {
        if (m_pressedTileEnumId < 0)
        {
            m_pressedTileEnumId = tileEnumId;
            m_pressedTileTimeLast = Date.now();
        }
        m_pressedTileEnumLastX = e.data.global.x;
        m_pressedTileEnumLastY = e.data.global.y;
        //console.log('I' + tileEnumId);
    }
    
    let onMenuUp = function asmapui_onMenuUp(e, tileEnumId)
    {
        if (m_pressedTileEnumId < 0)
        {
            return;
        }
        //console.log('O' + m_pressedTileEnumId + 'I' + tileEnumId);
        m_pressedTileEnumId = -1;
        m_pressedTileEnumLastX = null;
        m_pressedTileEnumLastY = null;
    }
    
    let onMenuMove = function asmapui_onMenuMove(e, tileEnumId)
    {
        if (m_pressedTileEnumId < 0)
        {
            return;
        }
        let nowPressed = e.data.global;
        let dx = nowPressed.x - m_pressedTileEnumLastX;
        let dy = nowPressed.y - m_pressedTileEnumLastY;
        let landscape = MMAPRENDER.isOrientationLandscape();
        if (landscape)
        {
            m_uiSpriteOffsetY[tileEnumId] += dy;
        }
        else
        {
            m_uiSpriteOffsetX[tileEnumId] += dx;
        }
        m_pressedTileEnumLastX = nowPressed.x;
        m_pressedTileEnumLastY = nowPressed.y;
        placeMenu(tileEnumId);
    }
    
    let getIdEnabled = function asmapui_getIdEnabled(tileEnumId, id)
    {
        return getSingleId(tileEnumId) == id;
    }
    
    // dependants
    
    public.getCurrentZoneId = function asmapui_getCurrentZoneId()
    {
        return getSingleId(C_ZONE);
    }
    
    let isViewMode = function asmapui_isViewMode(mode)
    {
        return getSingleId(C_MAIN) == C_TABLE[C_MAIN][0];
    }
    
    public.isZoneMode = function asmapui_isZoneMode()
    {
        return getVisibleState(C_ZONE);
    }
    
    let getCurrentViewId = function asmapui_getCurrentViewId()
    {
        return getSingleId(C_VIEW);
    }
    
    public.isViewModeRoadLayer = function asmapui_isViewModeRoadLayer()
    {
        return isViewMode() && getCurrentViewId() == C_TABLE[C_VIEW][2];
    }
    public.isViewModeRicoLayer = function asmapui_isViewModeRicoLayer()
    {
        return isViewMode() && getCurrentViewId() == C_TABLE[C_VIEW][3];
    }
    
    let refreshMapDisplay = function asmapui_refreshMapDisplay()
    {
        const C = ASTILEVIEW.C_TILEVIEW;
        let view = getSingleId(C_VIEW);
        if (view == C_TABLE[C_VIEW][0])
        {
            MMAPDATA.setTileView(C.ZONE);
        }
        else if (view == C_TABLE[C_VIEW][1])
        {
            MMAPDATA.setTileView(C.DISPLAY);
        }
        else if (view == C_TABLE[C_VIEW][2])
        {
            MMAPDATA.setTileView(C.ROAD_CONGESTION);
        }
        else if (view == C_TABLE[C_VIEW][3])
        {
            MMAPDATA.setTileView(C.ROAD_TRAVERSAL);
        }
        else if (view == C_TABLE[C_VIEW][4])
        {
            MMAPDATA.setTileView(C.RICO_DENSITY);
        }
    }
    
    let onViewSpritePress = function asmapui_onViewSpritePress(viewId)
    {
        //let refresh = getSingleId(C_VIEW) != viewId;
        //setSingleId(C_VIEW, viewId);
        //if (refresh)
        {
            refreshMapDisplay();
        }
    }
    
    let onSaveSpritePress = function asmapui_onSaveSpritePress(saveId)
    {
        // can skip this?
        //setSingleId(C_SAVE, saveId);
        let C_DEF = ASTILE_ID.C_TILE_ICON;
        if (saveId == C_DEF.SAVE)
        {
            let callbackData = [ASMAPUI.C_NAME,'saveDataResponse'];
            PSEENGINE.getSerializable(callbackData);
        }
        else if (saveId == C_DEF.LOAD)
        {
            let stateData = localStorage.getItem('ASSTATE');
            let callbackData = [ASMAPUI.C_NAME, 'loadDataResponse'];
            PSEENGINE.setSerializable(callbackData, stateData);
        }
        else if (saveId == C_DEF.BENC)
        {
            let callbackData = [ASMAPUI.C_NAME, 'loadDataResponse'];
            PSEENGINE.setPreset(callbackData);
        }
    }
    
    public.saveDataResponse = function asmapui_saveDataResponse(saveData)
    {
        localStorage.setItem('ASSTATE', saveData);
        console.log("Saved");
    }
    
    public.loadDataResponse = function asmapui_loadDataResponse()
    {
        console.log("Loaded");
        MMAPDATA.refreshAllTiles();
    }
    
    let onPlaySpritePress = function asmapui_onPlaySpritePress(playId)
    {
        //setSingleId(C_PLAY, playId);
        let C_DEF = ASTILE_ID.C_TILE_ICON;
        if (playId == C_DEF.PLAY)
        {
            //console.log("play");
            PSEENGINE.setTickSpeed(undefined,1000);
        }
        else if (playId == C_DEF.PLAY2)
        {
            PSEENGINE.setTickSpeed(undefined,100);
        }
        else if (playId == C_DEF.PLAY3)
        {
            PSEENGINE.setTickSpeed(undefined,0);
        }
        else if (playId == C_DEF.STOP)
        {
            //console.log("stop");
            // infinite tick speed in fact
            PSEENGINE.setTickSpeed(undefined,-1);
        }
        else if (playId == C_DEF.STEP)
        {
            //console.log("frame");
            // probably needs a special value
            PSEENGINE.setTickSpeed(undefined,1001);
        }
    }
    
    let C_SPRITE_TOUCH = {
        [C_VIEW] : onViewSpritePress,
        [C_SAVE] : onSaveSpritePress,
        [C_PLAY] : onPlaySpritePress
    };
    
    return public;
})()

// ---------------------
// wrapper for data layers to interface
// with mmap render
let MMAPDATA = (function ()
{
    let public = {};
    
    public.C_NAME = 'MMAPDATA';

    let m_mapChangeLog = [];
    
    let m_tileViewName; // module such as ASZONE
    let m_mapTableSizeXCache;
    let m_mapTableSizeYCache;
    let m_mapTableTileCache;
    
    let m_changeLogCalls = 0;

    public.getTileViewName = function mmapdata_getTileViewName()
    {
        return m_tileViewName;
    }
    public.setTileView = function mmapdata_switchData(tileViewName)
    {
        m_tileViewName = tileViewName;
        public.refreshAllTiles();
    }
    public.initialize = function mmapdata_initialize(tileViewName)
    {
        public.setTileView(tileViewName);
    }
    public.initializeMapTableSize = function mmapdata_initializeMapTableSize(w, h)
    {
        m_mapTableSizeXCache = w;
        m_mapTableSizeYCache = h;
        m_mapTableTileCache = new Array(w*h);
    }
    public.getRandomTileId = function mmapdata_getRandomTileId()
    {
        let tileEnumValues = ASTILE.C_MENU_ZONE;
        let tileEnumCount = tileEnumValues.length;
        let randomIndex = Math.floor(Math.random() * tileEnumCount);
        let randomId = tileEnumValues[randomIndex];
        return randomId;
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
        let callbackData = [MMAPDATA.C_NAME, 'refreshAllTilesResponse'];
        PSEENGINE.getTileIdTable(callbackData, m_tileViewName);
    }
    public.refreshAllTilesResponse = function mmapdata_refreshAllTilesResponse(tileIdTable)
    {
        m_mapChangeLog = [-1];
        for (let x = 0; x < m_mapTableSizeXCache; x++)
        {
            for (let y = 0; y < m_mapTableSizeYCache; y++)
            {
                let index = x + y*m_mapTableSizeXCache;
                m_mapTableTileCache[index] = tileIdTable[index];
            }
        }
    }
    public.refreshTileResponse = function mmapdata_refreshTileResponse(x, y, tileId)
    {
        m_mapChangeLog.push(x);
        m_mapChangeLog.push(y);
        m_mapTableTileCache[x + y*m_mapTableSizeXCache] = tileId;
        m_changeLogCalls++;
    }
    public.getTileId = function mmapdata_getTileId(tileX, tileY)
    {
        let id = m_mapTableTileCache[tileX + tileY*m_mapTableSizeXCache];
        if (typeof id === 'undefined')
        {
            return 0;
            //throw 'mmapData get uninitialized ' + id + ' ' + m_tileViewName + ' ' + m_mapTableSizeXCache + ' ' + m_mapTableSizeYCache;
        }
        return id;
    }
    public.getXYFromIndex = function mmapdata_getXYFromIndex(index)
    {
        //copy from asstate
        return index <= 0 ? [-1, -1] : [((index - 1) / m_mapTableSizeYCache) | 0, (index - 1) % m_mapTableSizeYCache];
    }
    public.isValidCoordinates = function mmapdata_isValidCoordinates(tileX, tileY)
    {
        let isOutOfBound = tileX < 0 || tileX >= m_mapTableSizeXCache || tileY < 0 || tileY >= m_mapTableSizeYCache;
        return !isOutOfBound;
    }
    public.getChangeLogCalls = function mmapdata_getChangeLogCalls()
    {
        return m_changeLogCalls;
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
                    let textureName = PSETILE.getTileTextureName(0);
                    let textureCache = PIXI.utils.TextureCache[textureName];
                    let sprite = new PIXI.Sprite(textureCache);

                    sprite.visible = true;
                    
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
            let textureName = PSETILE.getTileTextureName(id);
            let textureCache = PIXI.utils.TextureCache[textureName];
            let sprite = getSpriteFromBatch(batch, tileX - cTileX, tileY - cTileY);
            sprite.setTexture(textureCache);
            
            let expectedSpriteWidth = MMAPRENDER.getTextureBaseSizeX();
            if (textureCache.width != expectedSpriteWidth)
            {
                let originalRatio = textureCache.height / textureCache.width;
                sprite.width = expectedSpriteWidth;
                sprite.height = (expectedSpriteWidth * originalRatio) | 0;
            }
            else
            {
                sprite.width = textureCache.width;
                sprite.height = textureCache.height;
            }
            
            
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
    
    //let C_TEXTURE_BASE_SIZE_X = 32;
    //let C_TEXTURE_BASE_SIZE_Y = 16;
    
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
    }
    
    public.getDebugState = function mmaprender_getDebugState()
    {
        let tileX = getCenterTileX();
        let tileY = getCenterTileY();
        let cameraScale = (m_cameraScaleX * 100) | 0;
        
        let mapCoords = 'm(' + (m_cameraMapX | 0) + ',' + (m_cameraMapY | 0) + ',' + cameraScale + ') ';
        let tileCoords = 't(' + tileX + ',' + tileY + ') ';
        let batchCoords = 'b(' + MMAPBATCH.getTileXToBatchX(tileX) + ',' + MMAPBATCH.getTileYToBatchY(tileY) + ') ';
        let batchCount = 'B(' + MMAPBATCH.getBatchCount() + '+' + MMAPBATCH.getBatchPoolCount() + '/' + MMAPBATCH.getBatchTotalCount() + ') ';
        
        return mapCoords + tileCoords;
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
                    //console.log('leftovers: ' + (orderedKeys.length) + ' ' + count);
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

    public.C_MINBATCHPERCALL = 1;
    public.C_MAXBATCHPERCALL = 300;

    public.update = function mmaprender_update(time, frameskipped, noBudget)
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

        //let time0 = Date.now();

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

        //let time1 = Date.now();

        MMAPBATCH.setTextureFlagInNewBatch(
        m_batchFlag,
        m_refreshCall);

        MMAPBATCH.setTextureFlagInRadiusAndUpdatedTiles(
        m_batchFlag,
        currentCenterTileX,
        currentCenterTileY,
        currentBatchRadius,
        updatedTiles);

        //let time2 = Date.now();
        
        let fullyProcessed = processBatchFlag(m_batchPerCall, m_batchFlag);
        let increaseBatchPerCall = (!fullyProcessed && !frameskipped);
        let decreaseBatchPerCall = (!fullyProcessed && frameskipped && noBudget);
        if (decreaseBatchPerCall)
        {
            m_batchPerCall--;
            if (m_batchPerCall < public.C_MINBATCHPERCALL)
            {
                m_batchPerCall = public.C_MINBATCHPERCALL;
            }
        }
        else if (increaseBatchPerCall)
        {
            m_batchPerCall++;
            if (m_batchPerCall >= public.C_MAXBATCHPERCALL)
            {
                m_batchPerCall = public.C_MAXBATCHPERCALL;
            }
        }

        //let time3 = Date.now();

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
        
        return fullyProcessed;
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

PSEENGINE.registerModule(MMAPDATA);
PSEENGINE.registerModule(ASMAP);
PSEENGINE.registerModule(ASMAPUI);
