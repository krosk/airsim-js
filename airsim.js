var Nano = require('nano-ecs')();

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
    var width = window.innerWidth;
    var height = window.innerHeight;
    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);
    ASPAX.create(x, y);
}

function StartState()
{
    console.log("Start");
    for (i = 1; i < 1000; i++)
    {
        AddPaxRandom();
    }
    g_state = EngineState;
}

function EngineState()
{
    ASRENDER.update(0, 0);
    ASRANDOMMOVE.update(0, 0);
}

var g_frameCounter = 0;

function Update()
{
    g_updateTimestamp = Date.now();
    g_stats.begin();
    g_state();
    g_stats.end();
    g_frameCounter++;
    var endUpdateTimestamp = Date.now() - g_updateTimestamp;
    if (endUpdateTimestamp > 1000 / 60.0)
    {
        console.log(endUpdateTimestamp);
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
    
    function createSprite()
    {
        var graphics = new PIXI.Graphics();

        graphics.beginFill(0xFFFF00);

        // set the line style to have a width of 5 and set the color to red
        graphics.lineStyle(1, 0xFF0000);

        // draw a rectangle
        graphics.drawRect(0, 0, 2, 2);
        
        return graphics;
    }
    
    public.setSpriteToPosition = function(id, x, y)
    {
        if (typeof m_sprites[id] == 'undefined')
        {
            var sprite = createSprite();
            g_app.stage.addChild(sprite);
            m_sprites[id] = sprite;
        }
        m_sprites[id].x = x;
        m_sprites[id].y = y;
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
        this.render = true;
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
        return entity;
    }
    
    return public;
})();
// ---------------------
var ASRENDER = (function ()
{
    var public = {};
    
    public.update = function (dt, time)
    {
        var candidates = Nano.queryComponents([
            ASCOMPONENT.Id,
            ASCOMPONENT.Position,
            ASCOMPONENT.Renderable
            ]);
        candidates.forEach(function(entity)
        {
            //console.log(entity.id.id);
            ASPIXIRENDER.setSpriteToPosition(
                entity.id.id,
                entity.position.x,
                entity.position.y);
        });
    }
    
    return public;
})();
// --------------------
var ASRANDOMMOVE = (function ()
{
    var public = {};
    
    public.update = function (dt, time)
    {
        var candidates = Nano.queryComponents([
            ASCOMPONENT.Position,
            ]);
        candidates.forEach(function(entity)
        {
            entity.position.x += Math.floor(Math.random() * 3) - 1;
            entity.position.y += Math.floor(Math.random() * 3) - 1;
        });
    }
    
    return public;
})();
