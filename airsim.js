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

function StartState()
{
    console.log("Start");
    var pax = Nano.createEntity();
    console.log(pax);
    g_state = WaitingState;
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