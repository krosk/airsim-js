var Nano = require('nano-ecs')();
var PF = require('pathfinding');

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
})()

var g_state = WaitingState;

function OnReady()
{
    g_stats = new Stats();

    g_updateTimestamp = Date.now();

    g_app = new PIXI.Application(window.innerWidth, window.innerHeight);

    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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

    PIXI.loader
        .add("img/cityTiles_sheet.json")
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
    document.body.appendChild(g_debugOverlay);

    g_debugOverlay.style.left = 0 + "px";
    g_debugOverlay.style.top = 58 + "px";
}

function LoaderProgressHandler(loader, resource)
{
    console.log(resource.url);
    console.log(loader.progress);
}

function LoaderSetup()
{
    console.log("image loaded, testingScene" );
    g_state = StartState;
}

function Resize()
{
    var width = window.innerWidth;
    var height = window.innerHeight;

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
    var width = ASMAP.Width();
    var height = ASMAP.Height();
    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);
    ASPAX.create(x, y);
}

function StartState()
{
    console.log("Start");
    ASMAP.initialize(300, 300);
    for (i = 1; i < 0xFF * 12; i++)
    {
        AddPaxRandom();
    }
    g_state = EngineState;
}

function EngineState()
{
    ASRENDER.update(g_updateDelta, g_updateTimestamp);
    ASRANDOMMOVE.update(g_updateDelta, g_updateTimestamp);
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
var ASPIXIRENDER = (function ()
{
    var public = {};
    
    var m_sprites = {};
    
    function rainbowProfile(n)
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
    
    function rainbowColor(n)
    {
        var r = rainbowProfile(n + 0xFF * 2) << 16;
        var g = rainbowProfile(n) << 8;
        var b = rainbowProfile(n + 0xFF * 4);
        return r + g + b
    }
    
    function createSprite(id)
    {
        var graphics = new PIXI.Graphics();

        graphics.beginFill(0xFFFF00);

        // set the line style to have a width of 5 and set the color to red
        var color = rainbowColor(id);
        graphics.lineStyle(1, color);

        // draw a rectangle
        graphics.drawRect(0, 0, 2, 2);
        
        return graphics;
    }
    
    public.setSpriteToPosition = function(id, x, y, visible)
    {
        if (typeof m_sprites[id] == 'undefined')
        {
            var sprite = createSprite(id);
            g_app.stage.addChild(sprite);
            m_sprites[id] = sprite;
        }
        m_sprites[id].x = x;
        m_sprites[id].y = y;
        m_sprites[id].visible = visible;
        //m_sprites[id].x = rainbowProfile(id);
        //m_sprites[id].y = id / 4;
    }
    
    return public;
})();
// ---------------------
var ASMAP = (function ()
{
    var public = {};
    
    var m_grid = {};
    var m_width_x = 0;
    var m_height_y = 0;
    
    public.initialize = function(x, y)
    {
        m_grid = new PF.Grid(x, y);
        m_width_x = x;
        m_height_y = y;
    }
    
    public.Grid = function()
    {
        return m_grid;
    }
    
    public.Width = function()
    {
        return m_width_x;
    }
    
    public.Height = function()
    {
        return m_height_y;
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
    
    public.create = function(x, y)
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
    
    public.update = function (dt, time)
    {
        m_lastTime = time;
        var candidates = Nano.queryComponents([
            ASCOMPONENT.Id,
            ASCOMPONENT.Position,
            ASCOMPONENT.Renderable
            ]);
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
        candidates.forEach(function(entity)
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
    
    var lastTime = 0;
    
    public.update = function (dt, time)
    {
        if (time - lastTime < 2000 / 1)
        {
            //return;
        }
        lastTime = time;
        var ut = 1000 / 60;
        
        var candidates = Nano.queryComponents([
            ASCOMPONENT.Position,
            ]);
        candidates.forEach(function(entity)
        {
            entity.position.x = (entity.position.x + dt/ut) % ASMAP.Width();
            //entity.position.y += dt/ut*(Math.floor(Math.random() * 3) - 1);
        });
    }
    
    return public;
})();
