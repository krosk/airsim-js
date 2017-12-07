var Nano = require('nano-ecs')();
var PF = require('pathfinding');
var Benchmark = require('benchmark');

(function ()
{
    var exLog = console.log;
    console.log = function (msg)
    {
        exLog.apply(this, arguments);
        if (typeof g_debugOverlay != 'undefined')
        {
            //exLog.apply(this, arguments);
            g_debugOverlay.innerHTML += msg + "<br>";
        }
    }
})();

// function naming conventions
// Change state: verb
// no change: get

var g_state = WaitingState;

function OnReady()
{
    g_stats = new Stats();

    g_updateTimestamp = Date.now();

    g_app = new PIXI.Application(window.innerWidth, window.innerHeight);

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    var amount = (g_app.renderer instanceof PIXI.WebGLRenderer) ? 100 : 5;
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

    PIXI.loader.add("img/cityTiles_sheet.json")
        .on("progress", LoaderProgressHandler)
        .load(LoaderSetup);

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
    var width = window.innerWidth - 8;
    var height = window.innerHeight - 4;

    g_app.renderer.view.style.left = 0;
    g_app.renderer.view.style.top = 0;
    g_app.renderer.resize(width, height);
}

function WaitingState()
{
    // do nothing, wait for loader
}

function AddPaxRandom()
{
    var width = ASMAP.getWidth();
    var height = ASMAP.getHeight();
    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);
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
    ASMAP.initialize(256, 256);
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

var g_frameCounter = 0;
var g_updateTimestamp = Date.now();
var g_updateDelta = 0;

function Update()
{
    g_updateDelta = Date.now() - g_updateTimestamp;
    g_updateTimestamp = Date.now();
    g_stats.begin();
    g_state();
    g_stats.end();
    g_frameCounter++;
    var endUpdateTimestamp = Date.now() - g_updateTimestamp;
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
var ASMAP = (function ()
{
    var public = {};

    public.initialize = function asmap_initialize(w, h)
    {
        MMAPDATA.initialize(w, h);
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
        //MMAPDATA.randomizeTile(1);
        var changedTile = MMAPDATA.commitChangeLog();
        MMAPRENDER.update(dt, time, changedTile);
    }
    
    var doSingleClick = function asmap_doSingleClick(x, y)
    {
        //console.log('s' + x + ',' + y);
        var id = MMAPDATA.getTileId(x, y);
        var randomId = MMAPDATA.getRandomTileId();
        MMAPDATA.setTileId(x, y, randomId);
        //console.log(MMAPRENDER.getTileZOrder(x, y));
    }
    
    var doDoubleClick = function asmap_doDoubleClick(x, y)
    {
        console.log('d' + x + ',' + y);
    }

    return public;
})();
// ---------------------
var ASMAPUI = (function ()
{
    var public = {};
    
    var m_uiLayer;
    
    var m_currentTileId = 0;
    
    public.initialize = function asmapui_initialize()
    {
        m_uiLayer = new PIXI.Container();
        g_app.stage.addChild(m_uiLayer);
        m_uiLayer.interactive = false;
        
        var maxHeight = 0;
        var tileEnums = Object.values(MMAPDATA.C_TILEENUM);
        for (var i in tileEnums)
        {
            var tileId = tileEnums[i];
            var sprite = createTileSprite(tileId);
            m_uiLayer.addChild(sprite);
            sprite.x = i*sprite.width;
            sprite.y = getLayerHeight() - sprite.height;
            if (maxHeight < sprite.height)
            {
                maxHeight = sprite.height;
            }
        }
        
        var background = createMenuBackground(maxHeight);
        m_uiLayer.addChildAt(background, 0);
        background.y = getLayerHeight() - background.height;
        
    }
    
    var getLayerWidth = function asmapui_getLayerWidth()
    {
        return g_app.renderer.width;
    }
    var getLayerHeight = function asmap_getLayerHeight()
    {
        return g_app.renderer.height;
    }
    
    var createTileSprite = function asmapui_createButton(tileId)
    {
        var textureName = MMAPRENDER.getTileTextureName(tileId);
        var textureCache = PIXI.utils.TextureCache[textureName];
        var sprite = new PIXI.Sprite(textureCache);
        sprite.interactive = true;
        sprite.on('pointerdown',
            function(e){onSpritePress(e, tileId);});
        return sprite;
    }
    
    var createMenuBackground = function asmapui_createMenuBackground(height)
    {
        var graphics = new PIXI.Graphics();

        var black = 0x000000;
        var white = 0xFFFFFF;
        graphics.beginFill(white);
        graphics.lineStyle(1, black);
        
        var H = height;

        // draw a rectangle
        graphics.moveTo(0, 0);
        graphics.lineTo(getLayerWidth(), 0);
        graphics.lineTo(getLayerWidth(), H);
        graphics.lineTo(0, H);
        
        graphics.endFill();
        
        var texture = g_app.renderer.generateTexture(graphics);
        var sprite = new PIXI.Sprite(texture)
        return sprite;
    }
    
    var onSpritePress = function asmapui_onSpritePress(event, tileId)
    {
        console.log('p' + tileId);
        m_currentTileId = tileId;
    }
    
    return public;
})();
// ---------------------
// only responsible for holding tile id
// and size
var MMAPDATA = (function ()
{
    var public = {};

    var m_mapTableData = [];
    var m_mapChangeLog = [];
    var m_mapTableSizeX = 0;
    var m_mapTableSizeY = 0;

    var m_pfgrid = {};

    public.C_TILEENUM = {
        NONE: 0,
        DIRT: 1,
        ROAD: 3,
        RESLOW: 10,
        COMLOW: 20,
        INDLOW: 30
    }

    public.getMapTableSizeX = function mmapdata_getMapTableSizeX()
    {
        return m_mapTableSizeX;
    }
    public.getMapTableSizeY = function mmapdata_getMapTableSizeY()
    {
        return m_mapTableSizeY;
    }
    public.initialize = function mmapdata_initialize(x, y)
    {
        m_mapTableSizeX = x;
        m_mapTableSizeY = y;
        m_pfgrid = new ASPF.Grid(x, y);
        
        for (var x = 0; x < m_mapTableSizeX; x++)
        {
            for (var y = 0; y < m_mapTableSizeY; y++)
            {
                var randomId = public.getRandomTileId();
                var batchX = MMAPBATCH.getTileXToBatchX(x);
                var batchY = MMAPBATCH.getTileYToBatchY(y);
                var odd = (batchX + batchY) % 2;
                public.setTileId(x, y, randomId);
            }
        }
    }
    public.isValidTileId = function mmapdata_isValidTileId(id)
    {
        var index = Object.values(public.C_TILEENUM).indexOf(id)
        return index > -1;
    }
    public.getRandomTileId = function mmapdata_getRandomTileId()
    {
        var tileEnumValues = Object.values(MMAPDATA.C_TILEENUM);
        var tileEnumCount = tileEnumValues.length;
        var randomIndex = Math.floor(Math.random() * tileEnumCount);
        var randomId = tileEnumValues[randomIndex];
        return randomId;
    }
    public.randomizeTile = function (count)
    {
        for (var i = 0; i < count; i++)
        {
            var x = Math.floor(m_mapTableSizeX * Math.random());
            var y = Math.floor(m_mapTableSizeY * Math.random());
            var id = public.getRandomTileId();
            public.setTileId(x, y, id);
        }
    }
    public.commitChangeLog = function mmapdata_commitChangeLog()
    {
        var output = [];
        for (var i = 0; i < m_mapChangeLog.length; i++)
        {
            var tile = m_mapChangeLog[i];
            var index = tile.x * m_mapTableSizeY + tile.y;
            m_mapTableData[index] = tile.id;

            var walkable = isTileIdTypeWalkable(tile.id);
            m_pfgrid.setWalkableAt(tile.x, tile.y, walkable);
            output.push(tile);
        }
        m_mapChangeLog = [];
        return output;
    }
    public.setTileId = function mmapdata_setTileId(x, y, newId)
    {
        if (!public.isValidTileId(newId))
        {
            newId = public.C_TILEENUM.NONE;
        }
        var tile =
        {
            x: x,
            y: y,
            id: newId
        };
        m_mapChangeLog.push(tile);
    }
    public.getTileId = function mmapdata_getTileId(tileX, tileY)
    {
        var index = tileX * m_mapTableSizeY + tileY;
        return m_mapTableData[index];
    }
    var isTileIdTypeWalkable = function mmapdata_isTileIdTypeWalkable(id)
    {
        return id <= public.C_TILEENUM.ROAD;
    }
    public.isValidCoordinates = function mmapdata_isValidCoordinates(tileX, tileY)
    {
        var isOutOfBound = tileX < 0 || tileX >= public.getMapTableSizeX() || tileY < 0 || tileY >= public.getMapTableSizeY();
        return !isOutOfBound;
    }

    return public;
})();

// a map batch regroups multiple tiles
// abstraction layer for pixi container and sprite
var MMAPBATCH = (function ()
{
    var public = {};

    var m_mapLayer;

    var m_mapSpriteBatch = [];
    var m_mapSpriteBatchCount = 0;
    var m_mapSpriteBatchLifetime = {}; // cantor index
    // sprites grouped by batch
    // in batchMapIndex order
    var m_mapSpriteId = []; // mapIndex

    public.C_BATCH_SIZE_X = 8;
    public.C_BATCH_SIZE_Y = 8;
    
    public.C_BATCH_LIFETIME = 60;
    public.C_MAX_BATCH_COUNT = 300;

    public.mathCantor = function mmapbatch_mathCantor(X, Y)
    {
        return (X + Y) * (X + Y + 1) / 2 + Y;
    }

    public.mathReverseCantorPair = function mmapbatch_mathReverseCantorPair(z)
    {
        var pair = [];
        var t = Math.floor((-1 + Math.sqrt(1 + 8 * z)) / 2);
        var x = t * (t + 3) / 2 - z;
        var y = z - t * (t + 1) / 2;
        pair[0] = x;
        pair[1] = y;
        return pair;
    }

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

    var getBatchMapIndexByTile = function mmapbatch_getBatchMapIndexByTile(tileX, tileY)
    {
        var X = Math.floor(tileX / public.C_BATCH_SIZE_X);
        var Y = Math.floor(tileY / public.C_BATCH_SIZE_Y);
        return getBatchMapIndex(X, Y);
    }

    var getBatchMapIndex = function mmapbatch_getBatchMapIndex(batchX, batchY)
    {
        return public.mathCantor(batchX, batchY);
    }

    var getSpriteMapIndex = function mmapbatch_getSpriteMapIndex(tileX, tileY)
    {
        return public.mathCantor(tileX, tileY);
    }

    var findIndexForNewBatch = function mmapbatch_findIndexForNewBatch(batchX, batchY)
    {
        var batchMapIndex = getBatchMapIndex(batchX, batchY);
        var arrayIndex = batchMapIndex;
        while (arrayIndex >= 0)
        {
            if (hasBatchByIndex(arrayIndex))
            {
                var batch = m_mapSpriteBatch[arrayIndex];
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
            var batch = getBatch(batchX, batchY);
            return m_mapLayer.getChildIndex(batch);
        }
        else
        {
            return -1;
        }
    }

    /*
    var setSpriteInteraction = function mmapbatch_setSpriteInteraction(sprite)
    {
        sprite.interactive = true;
        sprite.on('pointerdown', MMAPTOUCH.onSpriteDisplayDragStart);
        sprite.on('pointermove', MMAPTOUCH.onSpriteDisplayDragMove);
        sprite.on('pointerupoutside', MMAPTOUCH.onSpriteDisplayDragEnd);
        sprite.on('pointerup', MMAPTOUCH.onSpriteDisplayDragEnd);
    }
    */
    
    var m_buildBatchPool = [];
    var m_buildBatchTotalCount = 0;
    var buildBatch = function mmapbatch_buildBatch()
    {
        if (m_buildBatchPool.length <= 0)
        {
            m_buildBatchTotalCount++;
            var batch = new PIXI.Container();
            for (var x = 0; x < public.C_BATCH_SIZE_X; x++)
            {
                for (var y = 0; y < public.C_BATCH_SIZE_Y; y++)
                {
                    var textureName = MMAPRENDER.getTileTextureName(0);
                    var textureCache = PIXI.utils.TextureCache[textureName];
                    var sprite = new PIXI.Sprite(textureCache);

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
    
    var getSpriteFromBatch = function mmapbatch_getSpriteFromBatch(batch, iTileX, iTileY)
    {
        return batch.getChildAt(iTileY + iTileX * public.C_BATCH_SIZE_Y);
    }

    // create one if none exists, excepted 
    // if coordinates are negative.
    // batch has z-ordered sprites
    // batch exists <=> sprite exists
    var getBatch = function mmapbatch_getBatch(batchX, batchY)
    {
        var batchMapIndex = getBatchMapIndex(batchX, batchY);
        if (!hasBatch(batchX, batchY))
        {
            var batch = buildBatch();

            batch.visible = false;

            batch.cacheAsBitmap = true;

            var addIndex = findIndexForNewBatch(batchX, batchY);
            //console.log(addIndex);

            m_mapLayer.addChildAt(batch, addIndex);

            //var batchCount = m_mapLayer.children.length;

            m_mapSpriteBatch[batchMapIndex] = batch;
            m_mapSpriteBatchLifetime[batchMapIndex] = public.C_BATCH_LIFETIME;
            m_mapSpriteBatchCount++;

            var cTileX = public.getBatchXToStartTileX(batchX);
            var cTileY = public.getBatchYToStartTileY(batchY);
            //console.log('created container for ' + cTileX + ',' + cTileY + ',' + batchCount);

            var eTileX = public.getBatchXToEndTileX(batchX);
            var eTileY = public.getBatchYToEndTileY(batchY);
            for (var x = cTileX; x < eTileX; x++)
            {
                for (var y = cTileY; y < eTileY; y++)
                {
                    var sprite = getSpriteFromBatch(batch, x - cTileX, y - cTileY);
                    sprite.visible = true;

                    var spriteMapIndex = getSpriteMapIndex(x, y)
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
            var batch = getBatch(batchX, batchY);
            m_mapLayer.removeChild(batch);
            
            var batchMapIndex = getBatchMapIndex(batchX, batchY);
            delete m_mapSpriteBatch[batchMapIndex];
            m_mapSpriteBatchCount--;
            delete m_mapSpriteBatchLifetime[batchMapIndex];
            
            var options = {children: true};

            var cTileX = public.getBatchXToStartTileX(batchX);
            var cTileY = public.getBatchYToStartTileY(batchY);
            var eTileX = public.getBatchXToEndTileX(batchX);
            var eTileY = public.getBatchYToEndTileY(batchY);
            for (var x = cTileX; x < eTileX; x++)
            {
                for (var y = cTileY; y < eTileY; y++)
                {
                    var spriteMapIndex = getSpriteMapIndex(x, y)
                    delete m_mapSpriteId[spriteMapIndex];
                }
            }

            //batch.destroy(options);
            //batch.visible = false;
            m_buildBatchPool.push(batch);
        }
    }

    var hasBatchByIndex = function mmapbatch_hasBatchByIndex(batchMapIndex)
    {
        return !(typeof m_mapSpriteBatch[batchMapIndex] === 'undefined' || m_mapSpriteBatch[batchMapIndex] == null);
    }

    var hasBatch = function mmapbatch_hasBatch(batchX, batchY)
    {
        var mapIndex = getBatchMapIndex(batchX, batchY);
        return hasBatchByIndex(mapIndex);
    }
    
    public.getBatchCount = function mmapbatch_getBatchCount()
    {
        return m_mapSpriteBatchCount;
    }

    var hasSprite = function mmapbatch_hasSprite(tileX, tileY)
    {
        var batchX = public.getTileXToBatchX(tileX);
        var batchY = public.getTileYToBatchY(tileY);
        return hasBatch(batchX, batchY);
    }

    public.setSprite = function mmapbatch_setSprite(tileX, tileY, id, x, y)
    {
        var spriteMapIndex = getSpriteMapIndex(tileX, tileY);
        var batchX = public.getTileXToBatchX(tileX);
        var batchY = public.getTileYToBatchY(tileY);
        if (!hasSprite(tileX, tileY))
        {
            var batch = getBatch(batchX, batchY);
        }
        // it is likely this
        if (m_mapSpriteId[spriteMapIndex] != id)
        {
            var batch = getBatch(batchX, batchY);
            batch.cacheAsBitmap = false;

            var cTileX = public.getBatchXToStartTileX(batchX);
            var cTileY = public.getBatchYToStartTileY(batchY);
            var textureName = MMAPRENDER.getTileTextureName(id);
            var textureCache = PIXI.utils.TextureCache[textureName];
            var sprite = getSpriteFromBatch(batch, tileX - cTileX, tileY - cTileY);
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
        var batch = getBatch(batchX, batchY);
        batch.scale.x = scaleX;
        batch.scale.y = scaleY;
    }

    public.setVisibilityFlagInRadius = function mmapbatch_setVisibilityFlagInRadius(flag, centerTileX, centerTileY, radius, flagValue)
    {
        var centerBatchX = public.getTileXToBatchX(centerTileX);
        var centerBatchY = public.getTileYToBatchY(centerTileY);
        for (var i = -radius; i <= radius; i++)
        {
            for (var j = -radius; j <= radius; j++)
            {
                var batchX = centerBatchX + i;
                var batchY = centerBatchY + j;
                var startTileX = public.getBatchXToStartTileX(batchX);
                var startTileY = public.getBatchYToStartTileY(batchY);
                if (batchX >= 0 && batchY >= 0 && MMAPDATA.isValidCoordinates(startTileX, startTileY))
                {
                    var index = public.mathCantor(batchX, batchY);
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
        var batchList = [];
        var centerBatchX = public.getTileXToBatchX(centerTileX);
        var centerBatchY = public.getTileYToBatchY(centerTileY);
        for (var i = -radius; i <= radius; i++)
        {
            for (var j = -radius; j <= radius; j++)
            {
                var batchX = centerBatchX + i;
                var batchY = centerBatchY + j;
                var startTileX = public.getBatchXToStartTileX(batchX);
                var startTileY = public.getBatchYToStartTileY(batchY);
                if (batchX >= 0 && batchY >= 0 && MMAPDATA.isValidCoordinates(startTileX, startTileY))
                {
                    var index = public.mathCantor(batchX, batchY);
                    batchList.push(index);
                }
            }
        }
        return batchList;
    }

    public.setVisibilityFlagInList = function mmapbatch_setVisibilityFlagInList(flag, batchList, flagValue)
    {
        for (var i in batchList)
        {
            var batchMapIndex = batchList[i];
            if (typeof flag[batchMapIndex] === 'undefined')
            {
                flag[batchMapIndex] = {};
            }
            flag[batchMapIndex].visible = flagValue;
        }
    }

    public.setTextureFlagInNewBatch = function mmapbatch_setTextureFlagInNewBatch(flag)
    {
        var keys = Object.keys(flag);
        for (var i in keys)
        {
            var k = keys[i];
            var pair = public.mathReverseCantorPair(k);
            var batchX = pair[0];
            var batchY = pair[1];
            var exists = hasBatch(batchX, batchY);
            if (!exists)
            {
                flag[k].loadTexture = true;
            }
        }
    }

    public.setTextureFlagInRadiusAndUpdatedTiles = function mmapbatch_setTextureFlagInRadiusAndUpdatedTiles(flag, centerTileX, centerTileY, radius, updatedTiles)
    {
        var centerBatchX = public.getTileXToBatchX(centerTileX);
        var centerBatchY = public.getTileYToBatchY(centerTileY);
        for (var i = 0; i < updatedTiles.length; i++)
        {
            var tileX = updatedTiles[i].x;
            var tileY = updatedTiles[i].y;
            var batchX = public.getTileXToBatchX(tileX);
            var batchY = public.getTileYToBatchY(tileY);
            if (Math.abs(batchX - centerBatchX) <= radius && Math.abs(batchY - centerBatchY) <= radius)
            {
                var mapIndex = getBatchMapIndex(batchX, batchY);
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
        for (var i in batchList)
        {
            var index = batchList[i];
            m_mapSpriteBatchLifetime[index] = public.C_BATCH_LIFETIME;
        }
        var keys = Object.keys(m_mapSpriteBatchLifetime);
        for (var i in keys)
        {
            var mapIndex = keys[i];
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
var MMAPTOUCH = (function ()
{
    var public = {};

    var m_touchData = [];
    var m_dragging = false;
    var m_zooming = false;
    var m_startScaleX = 1;
    var m_startScaleY = 1;
    var m_startDistance = 0;
    var m_startPointerScreenX = 0;
    var m_startPointerScreenY = 0;
    var m_startCameraMapX = 0;
    var m_startCameraMapY = 0;
    // 
    var m_clickTimeout = false;
    var m_clickCount = 0;
    var C_CLICKDELAYMS = 200;

    var getDistanceBetween = function mmaptouch_getDistanceBetween(pos1, pos2)
    {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }

    public.onMapDisplayDragStart = function mmaptouch_onMapDisplayDragStart(event)
    {
        m_touchData.push(event.data);
        mapDisplayDragRefresh(this);
        //console.log('touch ' + event.data.identifier + '/' + m_touchData.length);
    }

    public.onMapDisplayDragEnd = function mmaptouch_onMapDisplayDragEnd(event)
    {
        var touchIndex = m_touchData.indexOf(event.data);
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
            m_clickTimeout = false;
        }
    }
    
    var clickDecisionTimeout = function mmaptouch_clickDecisionTimeout()
    {
        if (m_clickTimeout && m_touchData.length == 0)
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
        m_clickCount = 0;
        m_clickTimeout = false;
    }

    var mapDisplayDragRefresh = function mmaptouch_mapDisplayDragRefresh(_this)
    {
        if (m_touchData.length == 0)
        {
            m_dragging = false;
            m_zooming = false;
            m_startScaleX = 1;
            m_startScaleY = 1;
            m_startDistance = 0;
            if (m_clickTimeout)
            {
                m_clickCount++;
            }
        }
        if (m_touchData.length > 0)
        {
            // remember initial scale
            m_startScaleX = _this.scale.x;
            m_startScaleY = _this.scale.y;

            var pointerPositionOnScreen = m_touchData[0].getLocalPosition(_this.parent);

            m_dragging = true;
            m_zooming = false;
            m_startDistance = 0;

            m_startPointerScreenX = pointerPositionOnScreen.x;
            m_startPointerScreenY = pointerPositionOnScreen.y;
            m_startCameraMapX = MMAPRENDER.getCameraMapX();
            m_startCameraMapY = MMAPRENDER.getCameraMapY();

            if (m_touchData.length == 1)
            {
                if (!m_clickTimeout)
                {
                    m_clickTimeout = true;
                    setTimeout(clickDecisionTimeout, C_CLICKDELAYMS);
                }
            }
        }
        if (m_touchData.length > 1)
        {
            var pos1 = m_touchData[0].getLocalPosition(_this.parent);
            var pos2 = m_touchData[1].getLocalPosition(_this.parent);
            m_startDistance = getDistanceBetween(pos1, pos2);
            m_zooming = true;
        }
    }

    var updateCameraDrag = function mmaptouch_updateCameraDrag(_this)
    {
        var pointerScreen = m_touchData[0].getLocalPosition(_this.parent);
        if (m_zooming)
        {
            var position2 = m_touchData[1].getLocalPosition(_this.parent);
            var newDistance = getDistanceBetween(pointerScreen, position2);
            var ratio = newDistance / m_startDistance;
            var cameraScaleX = m_startScaleX * ratio;
            var cameraScaleY = m_startScaleY * ratio;

            MMAPRENDER.setCameraScale(cameraScaleX, cameraScaleY);
        }

        // if moved, consider no click
        //m_firstTouchTimeOut = false;

        // camera moves according to differential movement of pointer
        var cameraMapX = m_startCameraMapX + (m_startPointerScreenX - pointerScreen.x) / MMAPRENDER.getCameraScaleX();
        var cameraMapY = m_startCameraMapY + (m_startPointerScreenY - pointerScreen.y) / MMAPRENDER.getCameraScaleY();

        MMAPRENDER.setCameraMap(cameraMapX, cameraMapY);
    }

    return public;
})();

var MMAPRENDER = (function ()
{
    var public = {};

    //var TEXTURE_BASE_SIZE_X = 130;
    //var TEXTURE_BASE_SIZE_Y = 66;

    var TEXTURE_BASE_SIZE_X = 64;
    var TEXTURE_BASE_SIZE_Y = 32;
    public.C_MIN_ZOOM = 0.25;

    var getRainbowProfile = function mmaprender_getRainbowProfile(n)
    {
        var total = 0xFF * 6;
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

    var getRainbowColor = function mmaprender_getRainbowColor(i, t)
    {
        var n = (0xFF * 6 * i / t);
        var r = getRainbowProfile(n + 0xFF * 2) << 16;
        var g = getRainbowProfile(n) << 8;
        var b = getRainbowProfile(n + 0xFF * 4);
        return r + g + b;
    }
    
    var getColor = function mmaprender_getColor(r, g, b)
    {
        return (r) * 2**16 + (g) * 2**8 + (b);
    }
    
    var getCityColor = function mmaprender_getCityColor(n)
    {
        var type = MMAPDATA.C_TILEENUM;
        if (n == type.DIRT)
        {
            return getColor(121, 85, 72); // dirt
        }
        else if (n == type.ROAD)
        {
            return getColor(158, 158, 158); // road
        }
        else if (n == type.RESLOW)
        {
            return getColor(76, 175, 80); // r
        }
        else if (n == type.COMLOW)
        {
            return getColor(33, 150, 243); // c
        }
        else if (n == type.INDLOW)
        {
            return getColor(255, 235, 59); // i
        }
        return getColor(255, 0, 0);
    }
    
    var getCityTextureHeight = function mmaprender_getCityTextureHeight(n)
    {
        var type = MMAPDATA.C_TILEENUM;
        if (n == type.ROAD)
        {
            return 6;
        }
        else if (n == type.RESLOW)
        {
            return 9; // r
        }
        else if (n == type.COMLOW)
        {
            return 12; // c
        }
        else if (n == type.INDLOW)
        {
            return 15; // i
        }
        return 3;
    }

    public.createTexture = function mmaprender_createTexture(id)
    {
        var graphics = new PIXI.Graphics();

        var color = getCityColor(id);
        var black = 0x000000;
        graphics.beginFill(color);
        graphics.lineStyle(1, black);

        var M = 0; // margin
        var H = getCityTextureHeight(id);

        // draw a rectangle
        graphics.moveTo(TEXTURE_BASE_SIZE_X / 2, M);
        graphics.lineTo(M, TEXTURE_BASE_SIZE_Y / 2);
        graphics.lineTo(M, TEXTURE_BASE_SIZE_Y / 2 + H);
        graphics.lineTo(TEXTURE_BASE_SIZE_X / 2, TEXTURE_BASE_SIZE_Y - M + H);
        graphics.lineTo(TEXTURE_BASE_SIZE_X - M, TEXTURE_BASE_SIZE_Y / 2 + H);
        graphics.lineTo(TEXTURE_BASE_SIZE_X - M, TEXTURE_BASE_SIZE_Y / 2);
        graphics.lineTo(TEXTURE_BASE_SIZE_X / 2, M);
        graphics.moveTo(TEXTURE_BASE_SIZE_X / 2, TEXTURE_BASE_SIZE_Y - 2 * M + M);
        graphics.lineTo(M, TEXTURE_BASE_SIZE_Y / 2);
        graphics.moveTo(TEXTURE_BASE_SIZE_X / 2, TEXTURE_BASE_SIZE_Y - 2 * M + M);
        graphics.lineTo(TEXTURE_BASE_SIZE_X - M, TEXTURE_BASE_SIZE_Y / 2);

        return graphics;
    }

    var initializeTexture = function mmaprender_initializeTexture()
    {
        //for (i = 0; i < MMAPDATA.C_MAXTILEID; i++)
        var values = Object.values(MMAPDATA.C_TILEENUM);
        for (var i in values)
        {
            var id = values[i] | 0;
            var textureName = public.getTileTextureName(id);
            var graphics = public.createTexture(id);
            var texture = g_app.renderer.generateTexture(graphics);
            PIXI.utils.TextureCache[textureName] = texture;
        }
    }

    var viewWidth = function mmaprender_viewWidth()
    {
        return g_app.renderer.width;
    }
    var viewHeight = function mmaprender_viewHeight()
    {
        return g_app.renderer.height;
    }
    var cameraScreenX = function ()
    {
        return viewWidth() / 2;
    }
    var cameraScreenY = function ()
    {
        return viewHeight() / 2;
    }

    var m_cameraMapX = 0;
    var m_cameraMapY = 0;
    var m_cameraScaleX = 1;
    var m_cameraScaleY = 1;

    var m_cameraMapVelocityX = 0;
    var m_cameraMapVelocityY = 0;
    var m_cameraScaleVelocity = 0;

    var m_cameraMapXRendered = 0;
    var m_cameraMapYRendered = 0;
    var m_cameraScaleXRendered = 1;
    var m_cameraScaleYRendered = 1;
    var m_cameraCenterTileXRendered = null;
    var m_cameraCenterTileYRendered = null;
    var m_cameraBatchRadiusRendered = 1;
    var m_cameraBatchListRendered = null;
    
    var m_singleClickCallback;
    var m_doubleClickCallback;

    public.initialize = function mmaprender_initialize(singleClick, doubleClick)
    {
        m_cameraMapX = 0;
        m_cameraMapY = 0;
        MMAPBATCH.initialize();
        m_singleClickCallback = singleClick;
        m_doubleClickCallback = doubleClick;
        initializeTexture();
    }

    public.getTileTextureName = function mmaprender_getTileTextureName(tileId)
    {
        return "mytile" + tileId;
    }

    // sprites are rendered at their
    // absolute (x,y) and never change
    // position.
    // batches are added at (0,0) and 
    // never change their position.
    // however the map container will move

    var tileToMapX = function (tileX, tileY)
    {
        return TEXTURE_BASE_SIZE_X / 2 * (tileX - tileY);
    }

    var tileToMapY = function (tileX, tileY)
    {
        return TEXTURE_BASE_SIZE_Y / 2 * (tileX + tileY);
    }

    // not to be used to check selection
    // does not take into account sprite height
    // nor z level
    var mapToTileX = function (mapX, mapY)
    {
        return mapX / TEXTURE_BASE_SIZE_X + (mapY + 1 + TEXTURE_BASE_SIZE_Y) / TEXTURE_BASE_SIZE_Y;
    }

    var mapToTileY = function (mapX, mapY)
    {
        return (mapY + 1 + TEXTURE_BASE_SIZE_Y) / TEXTURE_BASE_SIZE_Y - mapX / TEXTURE_BASE_SIZE_X;
    }

    var getScreenToMapX = function mmaprender_getScreenToMapX(screenX)
    {
        return m_cameraMapX + (screenX - cameraScreenX()) / m_cameraScaleX;
    }

    var getScreenToMapY = function mmaprender_getScreenToMapY(screenY)
    {
        return m_cameraMapY + (screenY - cameraScreenY()) / m_cameraScaleY;
    }

    var getScreenToTileX = function mmaprender_getScreenToTileX(screenX, screenY)
    {
        var mapX = getScreenToMapX(screenX);
        var mapY = getScreenToMapY(screenY);
        return mapToTileX(mapX, mapY);
    }

    var getScreenToTileY = function mmaprender_getScreenToTileY(screenX, screenY)
    {
        var mapX = getScreenToMapX(screenX);
        var mapY = getScreenToMapY(screenY);
        return mapToTileY(mapX, mapY);
    }

    public.setTile = function mmaprender_setTile(tileX, tileY, id)
    {
        var x = tileToMapX(tileX, tileY);
        var y = tileToMapY(tileX, tileY);
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
        var batchX = MMAPBATCH.getTileXToBatchX(tileX);
        var batchY = MMAPBATCH.getTileYToBatchY(tileY);
        return MMAPBATCH.getBatchRenderIndex(batchX, batchY);
    }

    var updateCameraVelocity = function mmaprender_updateCameraVelocity()
    {
        var cameraMapX = m_cameraMapX + m_cameraMapVelocityX / m_cameraScaleX;
        var cameraMapY = m_cameraMapY + m_cameraMapVelocityY / m_cameraScaleY;
        var cameraScaleX = m_cameraScaleX + m_cameraScaleVelocity;
        var cameraScaleY = m_cameraScaleY + m_cameraScaleVelocity;
        public.setCameraScale(cameraScaleX, cameraScaleY);
        public.setCameraMap(cameraMapX, cameraMapY);
    }

    public.setCameraMap = function mmaprender_setCameraMap(mapX, mapY)
    {
        m_cameraMapX = mapX;
        m_cameraMapY = mapY;
        
        var mapLayer = MMAPBATCH.getMapLayer();
        mapLayer.pivot.x = m_cameraMapX;
        mapLayer.pivot.y = m_cameraMapY;
        mapLayer.x = viewWidth() / 2;
        mapLayer.y = viewHeight() / 2;
        
        public.updateDebug();
    }
    
    public.updateDebug = function mmaprender_updateDebug()
    {
        var tileX = getCenterTileX();
        var tileY = getCenterTileY();
        var cameraScale = (m_cameraScaleX * 100) | 0;
        
        var mapCoords = 'm(' + (m_cameraMapX | 0) + ',' + (m_cameraMapY | 0) + ',' + cameraScale + ') ';
        var tileCoords = 't(' + tileX + ',' + tileY + ') ';
        var batchCoords = 'b(' + MMAPBATCH.getTileXToBatchX(tileX) + ',' + MMAPBATCH.getTileYToBatchY(tileY) + ') ';
        var batchCount = 'B(' + MMAPBATCH.getBatchCount() + '/' + MMAPBATCH.getBatchTotalCount() + ') ';
        g_counter.innerHTML = mapCoords + batchCount;
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
        var mapLayer = MMAPBATCH.getMapLayer();
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

    var getCenterTileX = function mmaprender_getCenterTileX()
    {
        return Math.floor(getScreenToTileX(viewWidth() / 2, viewHeight() / 2));
    }

    var getCenterTileY = function mmaprender_getCenterTileY()
    {
        return Math.floor(getScreenToTileY(viewWidth() / 2, viewHeight() / 2));
    }

    var getVisibleTileRadius = function mmaprender_getVisibleTileRadius()
    {
        var topLeftCornerTileX = Math.floor(getScreenToTileX(0, 0));
        var topLeftCornerTileY = Math.floor(getScreenToTileY(0, 0));

        var cornerToCenterTileDistance = Math.floor(Math.sqrt(Math.pow(topLeftCornerTileX - getCenterTileX(), 2) + Math.pow(topLeftCornerTileY - getCenterTileY(), 2)));
        return cornerToCenterTileDistance;
    }

    var getBatchRadiusForScreen = function mmaprender_getBatchRadiusForScreen(centerBatchX, centerBatchY, screenX, screenY)
    {
        var tileX = Math.floor(getScreenToTileX(screenX, screenY));
        var tileY = Math.floor(getScreenToTileY(screenX, screenY));
        var batchX = MMAPBATCH.getTileXToBatchX(tileX);
        var batchY = MMAPBATCH.getTileYToBatchY(tileY);
        //console.log('rad ' + batchX + ' ' + batchY );
        var deltaBatchX = centerBatchX - batchX;
        var deltaBatchY = centerBatchY - batchY;
        var batchRadius = Math.floor(Math.sqrt(Math.pow(deltaBatchX, 2) + Math.pow(deltaBatchY, 2))) + 1;
        return batchRadius;
    }

    var getVisibleBatchRadius = function mmaprender_getVisibleBatchRadius()
    {
        var centerBatchX = MMAPBATCH.getTileXToBatchX(getCenterTileX());
        var centerBatchY = MMAPBATCH.getTileYToBatchY(getCenterTileY());

        var x = 0;
        var y = 0;
        var topLeftBatchRadius = getBatchRadiusForScreen(
        centerBatchX,
        centerBatchY,
        x, y);
        return topLeftBatchRadius;
    }

    var getBatchIndexInScreen = function mmaprender_getBatchIndexInScreen()
    {
        var minBatchEdge = Math.min(MMAPBATCH.C_BATCH_SIZE_X, MMAPBATCH.C_BATCH_SIZE_Y);
        var deltaScreenX = minBatchEdge * TEXTURE_BASE_SIZE_X * m_cameraScaleX;
        var deltaScreenY = minBatchEdge * TEXTURE_BASE_SIZE_Y * m_cameraScaleY;

        var maxScreenX = viewWidth();
        var maxScreenY = viewHeight();

        var batchList = [];

        for (var stepScreenX = 0; stepScreenX <= maxScreenX + deltaScreenX; stepScreenX += deltaScreenX)
        {
            for (var stepScreenY = 0; stepScreenY <= maxScreenY + deltaScreenY; stepScreenY += deltaScreenY)
            {
                var tileX = Math.floor(getScreenToTileX(stepScreenX, stepScreenY));
                var tileY = Math.floor(getScreenToTileY(stepScreenX, stepScreenY));
                var batchX = MMAPBATCH.getTileXToBatchX(tileX);
                var batchY = MMAPBATCH.getTileYToBatchY(tileY);
                batchList.push(MMAPBATCH.mathCantor(batchX, batchY));
            }
        }

        for (var stepScreenX = -deltaScreenX / 2; stepScreenX <= maxScreenX + deltaScreenX; stepScreenX += deltaScreenX)
        {
            for (var stepScreenY = -deltaScreenY / 2; stepScreenY <= maxScreenY + deltaScreenY; stepScreenY += deltaScreenY)
            {
                var tileX = Math.floor(getScreenToTileX(stepScreenX, stepScreenY));
                var tileY = Math.floor(getScreenToTileY(stepScreenX, stepScreenY));
                var batchX = MMAPBATCH.getTileXToBatchX(tileX);
                var batchY = MMAPBATCH.getTileYToBatchY(tileY);
                batchList.push(MMAPBATCH.mathCantor(batchX, batchY));
            }
        }

        return batchList;
    }

    var getBatchIndexInScreen2 = function mmaprender_getBatchIndexInScreen2()
    {
        var minBatchEdge = Math.min(MMAPBATCH.C_BATCH_SIZE_X, MMAPBATCH.C_BATCH_SIZE_Y);
        var deltaScreenX = minBatchEdge * TEXTURE_BASE_SIZE_X * m_cameraScaleX;
        var deltaScreenY = minBatchEdge * TEXTURE_BASE_SIZE_Y * m_cameraScaleY;

        var totalStepX = Math.floor(viewWidth() / deltaScreenX) + 2;
        var totalStepY = Math.floor(viewHeight() / deltaScreenY) + 2;

        var batchList = [];

        var baseTileX = Math.floor(getScreenToTileX(0, 0));
        var baseTileY = Math.floor(getScreenToTileY(0, 0));

        // tileY +\-
        // tileX -/+
        for (var stepX = -1; stepX <= totalStepX; stepX += 1)
        {
            for (var stepY = -1; stepY <= totalStepY; stepY += 1)
            {
                // probably only works with square batch
                var tileX = baseTileX + stepX * minBatchEdge + stepY * minBatchEdge;
                var tileY = baseTileY - stepX * minBatchEdge + stepY * minBatchEdge;
                var batchX = MMAPBATCH.getTileXToBatchX(tileX);
                var batchY = MMAPBATCH.getTileYToBatchY(tileY);
                // note: tileX and tileY ay not be valid coordinates,
                // however batchY + 1 may be, so check only upon adding
                if (batchX >= 0 && batchY >= 0)
                {
                    batchList.push(MMAPBATCH.mathCantor(batchX, batchY));
                }
                if (batchX >= 0 && batchY + 1 >= 0)
                {
                    batchList.push(MMAPBATCH.mathCantor(batchX, batchY + 1));
                }
            }
        }

        return batchList;
    }

    var processBatchFlag = function mmaprender_processBatchFlag(batchPerCall, batchFlag)
    {
        var keys = Object.keys(batchFlag);
        var count = 0;
        var textureLoadCount = 0;
        // pre order
        var loadedTextureKeys = [];
        var toLoadTextureKeys = [];
        for (var i in keys)
        {
            var k = keys[i];
            var pair = MMAPBATCH.mathReverseCantorPair(k);
            var batchX = pair[0];
            var batchY = pair[1];
            var textureFlag = batchFlag[k].loadTexture;
            if (textureFlag)
            {
                toLoadTextureKeys.push(k);
            }
            else
            {
                loadedTextureKeys.push(k);
            }
        }
        var orderedKeys = loadedTextureKeys;
        for (var i in toLoadTextureKeys)
        {
            orderedKeys.push(toLoadTextureKeys[i]);
            //break; // process only one texture load per call
        }
        for (var i in orderedKeys)
        {
            var k = orderedKeys[i];
            var pair = MMAPBATCH.mathReverseCantorPair(k);
            var batchX = pair[0];
            var batchY = pair[1];
            var textureFlag = batchFlag[k].loadTexture;
            if (textureFlag)
            {
                var startTileX = MMAPBATCH.getBatchXToStartTileX(batchX);
                var startTileY = MMAPBATCH.getBatchYToStartTileY(batchY);
                var endTileX = MMAPBATCH.getBatchXToEndTileX(batchX);
                var endTileY = MMAPBATCH.getBatchYToEndTileY(batchY);
                for (var x = startTileX; x < endTileX; x++)
                {
                    for (var y = startTileY; y < endTileY; y++)
                    {
                        if (MMAPDATA.isValidCoordinates(x, y))
                        {
                            var tileId = MMAPDATA.getTileId(x, y);
                            public.setTile(x, y, tileId);
                            count++;
                        }
                    }
                }
            }
            var visibleFlag = batchFlag[k].visible;
            if (typeof visibleFlag != 'undefined')
            {
                MMAPBATCH.setBatchVisible(batchX, batchY, visibleFlag);
            }
            var removeFlag = batchFlag[k].remove;
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

    // hold cantor indicies
    var m_batchFlag = {};
    var m_batchPerCall = 1;
    var m_lastTime = 0;

    public.C_FPS = 30;
    public.C_MINBATCHPERCALL = 1;
    public.C_MAXBATCHPERCALL = 800;

    public.update = function mmaprender_update(dt, tile, updatedTiles)
    {
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

        var time0 = Date.now();

        updateCameraVelocity();

        if (m_cameraBatchListRendered === null){

        }
        else
        {
            MMAPBATCH.setVisibilityFlagInList(
            m_batchFlag,
            m_cameraBatchListRendered,
            false);
        }

        var currentCenterTileX = getCenterTileX();
        var currentCenterTileY = getCenterTileY();
        var currentRadius = getVisibleTileRadius();
        var currentBatchRadius = getVisibleBatchRadius();

        var currentBatchList = getBatchIndexInScreen2();

        MMAPBATCH.setVisibilityFlagInList(
        m_batchFlag,
        currentBatchList,
        true);
        
        MMAPBATCH.setLifetimeFlagInList(
        m_batchFlag,
        currentBatchList);

        var time1 = Date.now();

        MMAPBATCH.setTextureFlagInNewBatch(
        m_batchFlag);

        MMAPBATCH.setTextureFlagInRadiusAndUpdatedTiles(
        m_batchFlag,
        currentCenterTileX,
        currentCenterTileY,
        currentBatchRadius,
        updatedTiles);

        var time2 = Date.now();
        
        var fullyProcessed = processBatchFlag(m_batchPerCall, m_batchFlag);
        //var increaseBatchPerCall = Object.keys(m_batchFlag).length > 0;
        var increaseBatchPerCall = !fullyProcessed;

        if (dt > 1000 / public.C_FPS)
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

        var time3 = Date.now();

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

        m_cameraMapXRendered = m_cameraMapX;
        m_cameraMapYRendered = m_cameraMapY;
        m_cameraScaleXRendered = m_cameraScaleX;
        m_cameraScaleYRendered = m_cameraScaleY;
        m_cameraCenterTileXRendered = currentCenterTileX;
        m_cameraCenterTileYRendered = currentCenterTileY;
        m_cameraBatchRadiusRendered = currentBatchRadius;
        m_cameraBatchListRendered = currentBatchList;
    }
    
    public.processSingleClick = function mmaprender_processSingleClick(screenX, screenY)
    {
        var tileX = getScreenToTileX(screenX, screenY) | 0;
        var tileY = getScreenToTileY(screenX, screenY) | 0;
        m_singleClickCallback(tileX, tileY);
    }
    
    public.processDoubleClick = function mmaprender_processDoubleClick(screenX, screenY)
    {
        var tileX = getScreenToTileX(screenX, screenY) | 0;
        var tileY = getScreenToTileY(screenX, screenY) | 0;
        m_doubleClickCallback(tileX, tileY);
    }

    return public;
})();
// ---------------------
var ASCOMPONENT = (function ()
{
    var public = {};
    var s_entityId = 0;

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
var ASPAX = (function ()
{
    var public = {};

    public.create = function aspax_create(x, y)
    {
        var entity = Nano.createEntity();
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
var ASRENDER = (function ()
{
    var public = {};

    public.C_FPS = 30;
    public.C_MINLEVEL = 0;
    public.C_MAXLEVEL = 100;

    var m_lastTime = 0;

    var m_renderLevel = public.C_MINLEVEL;

    public.update = function asrender_update(dt, time)
    {
        m_lastTime = time;
        var candidates = Nano.queryComponents([
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
var ASRANDOMMOVE = (function ()
{
    var public = {};

    var m_lastTime = 0;

    public.update = function asrandommove_update(dt, time)
    {
        if (time - m_lastTime < 1000)
        {
            //return;
        }
        m_lastTime = time;
        var ut = 1000 / 60;

        var candidates = Nano.queryComponents([
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
    var grid = new IPF.Grid(s, s);
    pfFormatTestGrid(grid, s, s);
    var jpf = new IPF.JumpPointFinder();
    var path = jpf.findPath(0, 0, s - 10, 0, grid);

    //console.log(path);
}

function BenchhState()
{
    var suite = new Benchmark.Suite;
    var s = 400;

    var pgrid = new PF.Grid(s, s);
    pfFormatTestGrid(pgrid, s, s);
    var pjpf = new PF.JumpPointFinder();

    var agrid = new ASPF.Grid(s, s);
    pfFormatTestGrid(agrid, s, s);
    var ajpf = new ASPF.JumpPointFinder();

    // add tests
    suite.add('PF', function ()
    {
        var grid = pgrid.clone();
        var path = pjpf.findPath(0, 0, s - 10, s - 10, grid);
    })
        .add('ASPF', function ()
    {
        var path = ajpf.findPath(0, 0, s - 10, s - 10, agrid);
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
    var w = 200;
    var h = 275;
    var grid = new ASPF.Grid(w, h);
    pfFormatTestGrid(grid, w, h);
    ASPIXIRENDER.drawGrid(grid, w, h);
    //var ajpf = new ASPF.JumpPointFinder();
    //ajpf.findPath(0, 0, 290, 290, grid);
    //console.log(ajpf.findPath(0, 0, 7, 0, grid));
    //console.log('end');
    g_state = WaitingState;
}

var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

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
    var mid;
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
    var lastelt, returnitem;
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
    var returnitem;
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
    var _ref;
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
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null)
    {
        cmp = defaultCmp;
    }
    _ref1 = (function ()
    {
        _results1 = [];
        for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--)
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
    var pos;
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
    var elem, result, _i, _len, _ref;
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
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
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
    var newitem, parent, parentpos;
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
    var childpos, endpos, newitem, rightpos, startpos;
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
        var heap;
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

var ASPF = (function ()
{
    var public = {};

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
            var F = Math.SQRT2 - 1;
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
            var path = [
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
            var abs = Math.abs,
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
            var expanded = [],
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
        var width;

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
        var i, j,
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
        var x = this.nodes.x[node],
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
        var i, j,
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
        var openList = this.openList = new Heap(grid, function heapCmp(nodeA, nodeB)
        {
            return grid.nodes.f[nodeA] - grid.nodes.f[nodeB];
        }),
            startNode = this.startNode = grid.getNodeAt(startX, startY),
            endNode = this.endNode = grid.getNodeAt(endX, endY),
            node;

        this.grid = grid;

        var size = grid.width * grid.height;
        var nodes = grid.nodes;
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
        var grid = this.grid,
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
        var grid = this.grid,
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
        var parent = this.grid.nodes.parent[node],
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
