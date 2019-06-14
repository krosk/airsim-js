let Benchmark = require('benchmark');

let SHOW_DEBUG = false;

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

function OnReady()
{
    g_stats = new Stats();

    g_updateTimestamp = Date.now();

    g_app = new PIXI.Application(window.innerWidth, window.innerHeight);

    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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

    if (SHOW_DEBUG)
    {
        document.body.appendChild(g_stats.domElement);
    }

    window.onresize = Resize;
    Resize();
    
    g_app.ticker.add(Update);

    PIXI.loader
        .add("ui-logo-srpc", "img/ui-logo-srpc.png")
        .add("ui-home", "img/ui-home.png")
        .add("ui-copyright", "img/ui-copyright.png")
        .add("ui-background", "img/ui-background.png")
        .add("0-logo", "img/0-logo.png")
        .add("0-background", "img/backgroundLayer.jpg")
        .add("0-button1", "img/button_SRPCImageHistory.png")
        .add("0-button2", "img/button_Game1_ToolImages.png")
        .add("0-button3", "img/button_Game2_WellPlacement.png")
        .add("0-button4", "img/button_Game3_DipPicking.png")
        .add("0-button5", "img/button_BonusGeology.png")
        .add("1-image", "img/imageHistory.png")
        .add("2-toolnext", "img/game1Photos/next.png")
        .add("2-toolprev", "img/game1Photos/prev.png")
        .add("2-match", "img/game1Photos/match.png")
        .add("2-tool0", "img/game1Photos/0_Tool.png")
        .add("2-image0", "img/game1Photos/0_Image.png")
        .add("2-tool1", "img/game1Photos/1_Tool.png")
        .add("2-image1", "img/game1Photos/1_Image.png")
        .add("2-tool2", "img/game1Photos/2_Tool.png")
        .add("2-image2", "img/game1Photos/2_Image.png")
        .add("2-tool3", "img/game1Photos/3_Tool.png")
        .add("2-image3", "img/game1Photos/3_Image.png")
        .add("2-tool4", "img/game1Photos/4_Tool.png")
        .add("2-image4", "img/game1Photos/4_Image.png")
        .add("2-tool5", "img/game1Photos/5_Tool.png")
        .add("2-image5", "img/game1Photos/5_Image.png")
        .add("2-tool6", "img/game1Photos/6_Tool.png")
        .add("2-image6", "img/game1Photos/6_Image.png")
        .add("2-tool7", "img/game1Photos/7_Tool.png")
        .add("2-image7", "img/game1Photos/7_Image.png")
        .add("2-right", "img/game1Photos/right.png")
        .add("2-wrong", "img/game1Photos/wrong.png")
        .add("2-finish", "img/game1Photos/finish.png")
        .add("2-point", "img/game1Photos/point.png")
        .add("3-context", "img/game2Photos/game2_1_goal.png")
        .add("3-start", "img/game2Photos/start.png")
        .add("3-main", "img/game2Photos/main.png")
        .add("3-startAdv", "img/game2Photos/startAdv.png")
        .add("3-background", "img/game2Photos/game2_background.png")
        .add("3-backgroundAdv", "img/game2Photos/game2_backgroundAdv.png")
        .add("31-left1", "img/game2Photos/game2_2_left.png")
        .add("31-left2", "img/game2Photos/game2_left1_white.png")
        .add("31-left3", "img/game2Photos/game2_left2_white.png")
        .add("31-drillahead", "img/game2Photos/drillahead.png")
        .add("31-drilldown", "img/game2Photos/drilldown.png")
        .add("32-right1", "img/game2Photos/game2_2_Ahead_right.png")
        .add("32-right2", "img/game2Photos/game2_right_white.png")
        //.add("32-summary", "img/game2Photos/game2_2_drillUpFinal.png")
        .add("33-right1", "img/game2Photos/game2_2_drillDown_right.png")
        .add("33-right2", "img/game2Photos/game2_right_white.png")
        //.add("33-summary", "img/game2Photos/game2_2_drillDownFinal.png")
        .add("34-overlay", "img/game2Photos/game2_3_layout.png")
        .add("34-initial", "img/game2Photos/game2_3_initial.png")
        .add("4-background", "img/game2Photos/game2_background.png")
        .add("4-start", "img/game2Photos/start.png")
        .add("4-instructions", "img/game3Photos/game3_instructions.png")
        .add("4-dipimage", "img/game3Photos/game3_dip_image.png")
        .add("4-dipimage_solution", "img/game3Photos/game3_dip_image_solution.png")
        .add("4-dipheader", "img/game3Photos/game3_dip_header.png")
        .add("4-dipdepth", "img/game3Photos/game3_dip_depth.png")
        .add("4-aim", "img/game3Photos/aim.png")
        .add("4-mark", "img/game3Photos/mark.png")
        .on("progress", LoaderProgressHandler)
        .load(LoaderSetup);
    
    PIXI.loader.onError.add((err, loader, resource) => {
        console.log('Failed to load ' + resource.name);
        delete PIXI.utils.TextureCache[resource.name];
    });
    /*
    g_state = StartState;

    console.log("Ready");
    */
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
    if (SHOW_DEBUG)
    {
        document.body.appendChild(g_debugOverlay);
    }

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
    if (SHOW_DEBUG)
    {
        document.body.appendChild(g_counter);
    }

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
    
    console.log("Ready");
}

let g_redrawFrame = 0;

function Resize()
{
    console.log('Resizing');
    let width = window.innerWidth - 8;
    let height = window.innerHeight - 8;

    g_app.renderer.view.style.left = 0;
    g_app.renderer.view.style.top = 0;
    g_app.renderer.resize(width, height);
    
    g_redrawFrame = g_frameCounter;
}

function WaitingState()
{
    // do nothing, wait for loader
}

function StartState()
{
    console.log("Start");
    SLBG.initialize();
    g_state = PlayState;
}

function PlayState()
{
    SLBG.update(g_updateDelta, g_updateTimestamp);
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
let SUTILS = (function ()
{
    let public = {};
    
    public.getRandomPermutation = function sutils_getRandomPermutation(length)
    {
        let array = [];
        for (let i = 0; i < length; i++)
        {
            array.push(i);
        }
        for (let i = 0; i < 50; i++)
        {
            let id1 = Math.floor((Math.random() * length));
            let id2 = Math.floor((Math.random() * length));
            let temp = array[id2];
            array[id2] = array[id1];
            array[id1] = temp;
        }
        
        return array;
    }
    
    public.getNextIndex = function sutils_getNextIndex(length, current, forbidList)
    {
        let next = (current + 1) % length;
        while (forbidList.indexOf(next) >= 0 && next != current)
        {
            next = (next + 1) % length;
        }
        return next;
    }
    
    public.getPrevIndex = function sutils_getPrevIndex(length, current, forbidList)
    {
        let prev = (current - 1 + length) % length;
        while (forbidList.indexOf(prev) >= 0 && prev != current)
        {
            prev = (prev - 1 + length) % length;
        }
        return prev;
    }
    
    public.fitSinewave = function sutils_fitSinewave(aziList, depthList, radius)
    {
        let n0 = 0;
        let x0 = 0;
        let y0 = 0;
        let z0 = 0;
        let sxx = 0;
        let syy = 0;
        let szz = 0;
        let sxy = 0;
        let syz = 0;
        let szx = 0;
        
        for (let i in aziList)
        {
            let z = depthList[i];
            let theta = aziList[i];
            let x = radius * Math.cos(theta);
            let y = radius * Math.sin(theta);
            
            x0 += x;
            y0 += y;
            z0 += z;
            sxx += x * x;
            syy += y * y;
            szz += z * z;
            sxy += x * y;
            syz += y * z;
            szx += z * x;
            
            n0++;
        }
        
        if (n0 < 3)
        {
            return [];
        }
        
        x0 /= n0;
        y0 /= n0;
        z0 /= n0;
    
        sxx -= x0 * x0 * n0;
        syy -= y0 * y0 * n0;
        szz -= z0 * z0 * n0;
    
        sxy -= x0 * y0 * n0;
        syz -= y0 * z0 * n0;
        szx -= z0 * x0 * n0;
        
        let t1 = -(sxx + syy + szz);
        let t2 = sxx*syy - sxy*sxy + syy*szz - syz*syz + szz*sxx - szx*szx;
        let t3 = -sxx*syy*szz + sxx*syz*syz + syy*szx*szx + szz*sxy*sxy - 2 * sxy*syz*szx;
        
        let q = Math.sqrt(t1 * t1 - 3. * t2) / 3.;
        let r = (t1 * (2. * t1 * t1 - 9. * t2) + 27. * t3) / 54.;
        
        let real = r / (q * q * q);
        
        if (real < -1.0)
        {
            real = -1.0;
        }
        if (real >  1.0)
        {
            real = 1.0;
        }
        
        let theta = Math.acos(real) / 3.;
    
        let e1 = -2. * q * Math.cos(theta) - t1 / 3.;
        let e2 = -2. * q * Math.cos(theta + Math.PI * 2. / 3.) - t1 / 3.;
        let e3 = -2. * q * Math.cos(theta + Math.PI * 4. / 3.) - t1 / 3.;
        
        if (e1 > e2)
        {
            r = e1;
            e1 = e2;
            e2 = r;
        }
        if (e1 > e3)
        {
            r = e1;
            e1 = e3;
            e3 = r;
        }
        
        let a = (syy - e1) * (szz - e1) + syz * (sxy + szx - syz) - sxy * (szz - e1) - szx * (syy - e1);
        let b = (szz - e1) * (sxx - e1) + szx * (syz + sxy - szx) - syz * (sxx - e1) - sxy * (szz - e1);
        let c = (sxx - e1) * (syy - e1) + sxy * (szx + syz - sxy) - szx * (syy - e1) - syz * (sxx - e1);
        if (c > 0)
        {
            a = -a;
            b = -b;
            c = -c;
        }
        let xp, yp, amp;
        if ((c * c) > (a * a + b * b) * 1.0e-12)
        {
            xp = Math.atan2(b, a);
            yp = (z0 + (x0 * a + y0 * b) / c);
            amp = (-radius * (Math.hypot(a, b) / c));
            return [xp, yp, amp];
        }
        else
        {
            return [];
        }
    }
    
    let getRainbowProfile = function sutils_getrainbowProfile(n)
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
    
    let getRainbowColor = function sutils_getrainbowColor(n)
    {
        var r = getRainbowProfile(n + 0xFF * 2) << 16;
        var g = getRainbowProfile(n) << 8;
        var b = getRainbowProfile(n + 0xFF * 4);
        return r + g + b
    }
    
    public.nameToColor = function sutils_nameToColor(textureName)
    {
        let i = textureName.length;
        let n = 0;
        while (i--)
        {
            n += textureName.charCodeAt(i) * 64;
        }
        return getRainbowColor(n);
    }
    
    let dip_depth_table = [2360.092000,2360.208000,2360.300000,2360.425000,2360.558000,2360.700000,2360.825000,2360.942000,2361.108000,2361.267000,2361.433000,2361.717000,2361.750000,2362.108000,2362.267000,2362.400000,2362.575000,2362.750000,2362.975000,2363.167000,2363.342000,2363.475000,2363.583000,2363.675000,2363.775000,2363.867000,2363.983000,2364.117000,2364.208000,2364.292000,2364.383000,2364.592000,2364.675000,2364.833000,2364.967000];
    let dip_height_table = [0.283435,0.205088,0.208695,0.300243,0.301227,0.293410,0.299182,0.327653,0.325819,0.307200,0.378530,0.702550,0.730865,0.677122,0.644125,0.631517,0.467219,0.537138,0.438361,0.397693,0.229141,0.231525,0.117363,0.136657,0.125361,0.114838,0.113531,0.183960,0.153030,0.225059,0.149239,0.229046,0.208401,0.263997,0.186661];
    let dip_azimuth_table = [81.285550,84.769740,78.347720,78.635280,96.332200,87.827410,87.169810,83.146750,79.402400,85.596690,82.582200,50.149700,48.448620,48.490910,52.198620,50.463540,48.222520,45.961640,46.407650,70.879350,87.063340,98.733040,105.076400,88.342370,99.293810,99.535710,93.774850,76.618960,69.384690,72.621620,73.538770,65.436920,69.948070,68.634110,78.814250];
    let findDepthIndex = function sutils_findDepthIndex(candidate_depth)
    {
        let dipCount = dip_depth_table.length;
        for (let i = 0; i < dipCount; i++)
        {
            let depth = dip_depth_table[i];
            if (depth >= candidate_depth)
            {
                return i;
            }
            if (depth < candidate_depth)
            {
                if (i == dipCount - 1)
                {
                    return i;
                }
                let next_depth = dip_depth_table[i + 1];
                if (next_depth <= candidate_depth)
                {
                    continue;
                }
                return i + (candidate_depth - depth) / (next_depth - depth);
            }
        }
        return dipCount - 1;
    }
    
    let findDipHeightDifference = function sutils_findDipHeightDifference(ifraction, candidate_height)
    {
        let maxIndex = dip_height_table.length;
        let ratio = ifraction - Math.floor(ifraction);
        let index = Math.floor(ifraction);
        let nextIndex = Math.floor(ifraction) + 1;
        let target_height;
        if (nextIndex >= maxIndex)
        {
            target_height = dip_height_table[index];
        }
        else
        {
            target_height = (dip_height_table[nextIndex] - dip_height_table[index]) * ratio + dip_height_table[index];
        }
        return Math.abs(target_height - candidate_height);
    }
    
    let findAzimuthDifference = function sutils_findAzimuthDifference(ifraction, candidate_azimuth)
    {
        let maxIndex = dip_azimuth_table.length;
        let ratio = ifraction - Math.floor(ifraction);
        let index = Math.floor(ifraction);
        let nextIndex = Math.floor(ifraction) + 1;
        let target_height;
        if (nextIndex >= maxIndex)
        {
            target_azimuth = dip_azimuth_table[index];
        }
        else
        {
            target_azimuth = (dip_azimuth_table[nextIndex] - dip_azimuth_table[index]) * ratio + dip_azimuth_table[index];
        }
        if (target_azimuth < candidate_azimuth)
        {
            let t = target_azimuth;
            target_azimuth = candidate_azimuth;
            candidate_azimuth = t;
        }
        let diff = Math.min(target_azimuth - candidate_azimuth, Math.abs(target_azimuth - candidate_azimuth - 360));
        return diff;
    }
    
    public.getDipScore = function sutils_getDipScore(candidate_depth, candidate_height, candidate_azimuth)
    {
        let ifraction = findDepthIndex(candidate_depth);
        let score = 5 - 6*findDipHeightDifference(ifraction, candidate_height) - findAzimuthDifference(ifraction, candidate_azimuth) / 30;
        return Math.max(score, 0);
    }
    
    return public;
})();

let SLBG = (function ()
{
    let public = {};
    
    public.C_NAME = 'SLBG';
    
    let m_computeTimeBudget = 1;
    let m_sceneId;
    let m_layer;
    let m_spriteTable = [];
    let m_spriteTimeoutTable = [];
    // survives redraw, not reset
    let m_dipX = [];
    let m_dipY = [];
    let m_toolCount = 8;
    let m_toolImageRandomMap = [];
    let m_toolMatched = [];
    let m_toolImageMatched = [];
    let m_toolDisplayedId = 0;
    let m_toolImageDisplayedId = 0;
    let m_toolScore = 0;
    let m_dipscoretable;
    let m_dipstiming = 0;
    
    public.initialize = function slbg_initialize()
    {
        m_sceneId = 0;
        m_layer = new PIXI.Container();
        g_app.stage.addChild(m_layer);
        m_layer.interactive = false;
        
        m_toolImageRandomMap = SUTILS.getRandomPermutation(m_toolCount);
        
        createPlaceholder(8, 8, "4-mark");
    }
    
    let resetData = function slbg_resetData()
    {
        m_dipX = [];
        m_dipY = [];
        m_toolMatched = [];
        m_toolImageMatched = [];
        m_toolDisplayedId = 0;
        m_toolImageDisplayedId = 0;
        m_toolScore = 0;
        m_dipstiming = 30000;
        
        if (document.getElementById("divscoretable"))
        {
            let l_element = document.getElementById("divscoretable");
            l_element.parentNode.removeChild(l_element);
        }
        if (document.getElementById("divvideo"))
        {
            let l_element = document.getElementById("divvideo");
            l_element.hidden = true;
            let l_video  = document.getElementById("ivideo");
            l_video.pause();
            l_video.currentTime = 0;
        }
        if (document.getElementById("controlTable"))
        {
            let l_element = document.getElementById("controlTable");
            l_element.parentNode.removeChild(l_element);
        }
    }
    
    let m_redrawFrame = -1;
    public.update = function slbg_update(dt, time)
    {
        const fpsdt = 17*2;
        let frameskipped = dt > fpsdt; //1000 / 60;
        const noBudget = m_computeTimeBudget <= 1;
        const maxBudget = m_computeTimeBudget >= fpsdt - 1;
        const fullyProcessed = true;
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
        
        updateDebug();
        updateGame3Timer(dt);
        
        if (m_redrawFrame < g_redrawFrame)
        {
            m_redrawFrame = g_redrawFrame;
            public.redraw();
        }
        
        updateTimedSprite(dt);
    }
    
    let updateTimedSprite = function slbg_updateTimedSprite(dt)
    {
        for (let i in m_spriteTable)
        {
            m_spriteTable[i].timeout -= dt;
            if (m_spriteTable[i].timeout < 0)
            {
                m_spriteTable[i].visible = true;
            }
        }
        for (let i in m_spriteTimeoutTable)
        {
            m_spriteTimeoutTable[i].timeout -= dt;
            if (m_spriteTimeoutTable[i].timeout < 0)
            {
                m_spriteTimeoutTable[i].visible = false;
            }
        }
    }
    
    let getLayerWidth = function slbg_getLayerWidth()
    {
        return g_app.renderer.width;
    }
    let getLayerHeight = function slbg_getLayerHeight()
    {
        return g_app.renderer.height;
    }
    
    let createPlaceholder = function slbg_createPlaceholder(width, height, textureName)
    {
        if (typeof PIXI.utils.TextureCache[textureName] === 'undefined')
        {
            console.log('create placeholder ' + textureName);
        }
        else
        {
            console.log('texture exists ' + textureName);
            return;
        }
        let graphics = new PIXI.Graphics();
    
        let black = 0x000000;
        let color = SUTILS.nameToColor(textureName);
        graphics.beginFill(color);
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
        PIXI.utils.TextureCache[textureName] = texture;
    }
    
    let createSprite = function slbg_createSprite(textureName, xp, yp, wp, hp, keepratio)
    {
        // note: xp, yp for corner pixel; abs of wp, hp for size; sign of xp, yp for if null, then not taking it into account
        //console.log('createSprite ' + textureName);
        let wpa = Math.abs(wp);
        let hpa = Math.abs(hp);
        let xpa = Math.abs(xp);
        let ypa = Math.abs(yp);
        if (typeof PIXI.utils.TextureCache[textureName] === 'undefined')
        {
            console.log('missing texture for ' + textureName);
            createPlaceholder(64, 64, textureName);
        }
        if (typeof keepratio === 'undefined')
        {
            keepratio = false;
        }
        
        let textureCache = PIXI.utils.TextureCache[textureName];
        let sprite = new PIXI.Sprite(textureCache);
        
        let ratio = textureCache.width / textureCache.height;
        if (wp == null && hp == null)
        {
            sprite.height = textureCache.height;
            sprite.width = textureCache.width;
        }
        else if (wp == null)
        {
            sprite.height = hpa * getLayerHeight();
            sprite.width = hpa * getLayerHeight() * ratio;
        }
        else if (hp == null)
        {
            sprite.width = wpa * getLayerWidth();
            sprite.height = wpa * getLayerWidth() / ratio;
        }
        else if (keepratio)
        {
            sprite.height = Math.min(hpa * getLayerHeight(), wpa * getLayerWidth() / ratio);
            sprite.width = Math.min(wpa * getLayerWidth(), hpa * getLayerHeight() * ratio);
        }
        else
        {
            sprite.height = hpa * getLayerHeight();
            sprite.width = wpa * getLayerWidth();
        }
        
        sprite.height = Math.round(sprite.height);
        sprite.width = Math.round(sprite.width);
        sprite.x = Math.round(xpa * getLayerWidth());
        sprite.y = Math.round(ypa * getLayerHeight());
        if (xp < 0)
        {
            sprite.x = sprite.x - sprite.width;
        }
        if (yp < 0)
        {
            sprite.y = sprite.y - sprite.height;
        }
        
        return sprite;
    }
    
    let setSpriteButton = function slbg_setSpriteButton(sprite, nextSceneId)
    {
        sprite.interactive = true;
        if (typeof nextSceneId === 'undefined')
        {
        
        }
        else
        {
            sprite.on('pointerup',
                function(e){
                    drawScene(nextSceneId);
                });
        }
    }
    
    let switchTool = function slbg_setNextTool(call)
    {
        m_toolDisplayedId = call(m_toolCount, m_toolDisplayedId, m_toolMatched);
    }
    
    let switchImage = function slbg_switchImage(call)
    {
        m_toolImageDisplayedId = call(m_toolCount, m_toolImageDisplayedId, m_toolImageMatched);
    }
    
    let setSpriteSwitchTool = function slbg_setSpriteSwitchTool(sprite, call)
    {
        sprite.interactive = true;
        sprite.on('pointerup',
            function(e){
                switchTool(call);
                drawScene(2);
            });
    }
    
    let setSpriteSwitchImg = function slbg_setSpriteSwitchImg(sprite, call)
    {
        sprite.interactive = true;
        sprite.on('pointerup',
            function(e){
                switchImage(call);
                drawScene(2);
            });
    }
    
    let setSpriteDipPicker = function slbg_setSpriteDipPicker(sprite)
    {
        sprite.interactive = true;
        //console.log('sx:' + sprite.x + ' sy:' + sprite.y);
        sprite.on('pointerup',
            function(e){
                let data = e.data.global;
                let mouseX = (data.x - sprite.x) / sprite.width;
                let mouseY = (data.y - sprite.y) / sprite.height;
                //console.log('x:' + mouseX + ' y:' + mouseY);
                m_dipX.push(mouseX);
                m_dipY.push(mouseY);
            });
    }
    
    let setSpriteMatch = function slbg_setSpriteMatch(sprite)
    {
        sprite.interactive = true;
        sprite.on('pointerup',
            function(e){
                if (m_toolDisplayedId == m_toolImageRandomMap[m_toolImageDisplayedId])
                {
                    m_toolScore += 3;
                    m_toolMatched.push(m_toolDisplayedId);
                    m_toolImageMatched.push(m_toolImageDisplayedId);
                    if (m_toolMatched.length >= m_toolCount)
                    {
                        m_sceneId = 22; // finish
                    }
                    else
                    {
                        switchTool(SUTILS.getNextIndex);
                        switchImage(SUTILS.getNextIndex);
                        m_sceneId = 20; // right
                    }
                }
                else
                {
                    m_toolScore -= 1;
                    m_sceneId = 21; // wrong
                }
                
                public.redraw();
            });
    }
    
    let setSpriteTimedDisplay = function slbg_setSpriteTimedDisplay(sprite, time)
    {
        sprite.visible = false;
        sprite.timeout = time;
        m_spriteTable.push(sprite);
    }
    
    let setSpriteTimeoutDisplay = function slbg_setSpriteTimeoutDisplay(sprite, time)
    {
        sprite.visible = true;
        sprite.timeout = time;
        m_spriteTimeoutTable.push(sprite);
    }
    
    let drawImage = function slbg_drawImage(textureName, xp, yp, wp, hp, keepratio)
    {
        let sprite = createSprite(textureName, xp, yp, wp, hp, keepratio);
        m_layer.addChild(sprite);
    }
    
    let drawTimed = function slbg_drawTimed(textureName, xp, yp, wp, hp, time, keepratio)
    {
        let sprite = createSprite(textureName, xp, yp, wp, hp, keepratio);
        setSpriteTimedDisplay(sprite, time);
        m_layer.addChild(sprite);
    }
    
    let drawTimeout = function slbg_drawTimeout(textureName, xp, yp, wp, hp, time)
    {
        let sprite = createSprite(textureName, xp, yp, wp, hp);
        setSpriteTimeoutDisplay(sprite, time);
        m_layer.addChild(sprite);
    }
    
    let drawTimedButton = function slbg_drawTimedButton(textureName, xp, yp, wp, hp, time, nextSceneId, keepratio)
    {
        let sprite = createSprite(textureName, xp, yp, wp, hp, keepratio);
        setSpriteTimedDisplay(sprite, time);
        setSpriteButton(sprite, nextSceneId);
        m_layer.addChild(sprite);
    }
    
    let drawButton = function slbg_drawButton(textureName, xp, yp, wp, hp, nextSceneId, keepratio)
    {
        let sprite = createSprite(textureName, xp, yp, wp, hp, keepratio);
        setSpriteButton(sprite, nextSceneId);
        m_layer.addChild(sprite);
    }
    
    let drawGame1 = function slbg_drawGame1()
    {
        console.log('t: ' + m_toolDisplayedId + ' i: ' + m_toolImageDisplayedId + '[' + m_toolImageRandomMap[m_toolImageDisplayedId] + ']' + ' s: ' + m_toolScore);
        
        let toolnext_sprite = createSprite("2-toolnext", 0.2, 0.8, 0.1, 0.1, true);
        setSpriteSwitchTool(toolnext_sprite, SUTILS.getNextIndex);
        m_layer.addChild(toolnext_sprite);
        
        let toolprev_sprite = createSprite("2-toolprev", 0.1, 0.8, 0.1, 0.1, true);
        setSpriteSwitchTool(toolprev_sprite, SUTILS.getPrevIndex);
        m_layer.addChild(toolprev_sprite);
        
        let imgnext_sprite = createSprite("2-toolnext", 0.8, 0.8, 0.1, 0.1, true);
        setSpriteSwitchImg(imgnext_sprite, SUTILS.getNextIndex);
        m_layer.addChild(imgnext_sprite);
        
        let imgprev_sprite = createSprite("2-toolprev", 0.7, 0.8, 0.1, 0.1, true);
        setSpriteSwitchImg(imgprev_sprite, SUTILS.getPrevIndex);
        m_layer.addChild(imgprev_sprite);
        
        drawImage("2-tool" + m_toolDisplayedId, 0.0, 0.3, 0.5, 0.5);
        drawImage("2-image" + m_toolImageRandomMap[m_toolImageDisplayedId], 0.6, 0.1, 0.3, 0.6);
        
        for (let i = 0; i < m_toolScore; i++)
        {
            drawImage("2-point", 0.3 + 0.03 * i, 0.05, 0.03, 0.03, true);
        }
        
        let match_sprite = createSprite("2-match", 0.45, 0.8, 0.1, 0.1, true);
        setSpriteMatch(match_sprite);
        m_layer.addChild(match_sprite);
    }
    
    let drawGame1Score = function slbg_drawGame1Score()
    {
        for (let i = 0; i < m_toolScore; i++)
        {
            drawImage("2-point", 0.5 + 0.03 * (i - m_toolScore + m_toolScore / 2), 0.7, 0.03, 0.03, true);
        }
    }
    
    let updateGame3Timer = function slbg_updateGame3Timer(dt)
    {
        if (m_sceneId == 41)
        {
            m_dipstiming -= dt;
            if (m_dipstiming > 0)
            {
                l_timer = document.getElementById("itimer");
                l_timer.innerHTML = 'Remaining time: ' + Math.floor(m_dipstiming / 1000) + 's'
            }
            else
            {
                m_sceneId = 42
                public.redraw();
            }
        }
        else if (m_sceneId == 42)
        {
            l_timer = document.getElementById("itimer");
            l_timer.innerHTML = 'Time is up!</p>'
        }
    }
    
    let drawGame3Score = function slbg_drawGame3Score(dipCount, dipScore)
    {
        if (m_dipstiming <= 0)
        {
            l_score = document.getElementById("iscore");
            l_score.innerHTML = "You picked " + dipCount + " dips in 30 seconds.";
            l_score.innerHTML += "<br>Your total score is " + Math.floor(dipScore * 10) / 10 + ".";
            l_score.innerHTML += "<br>";
            l_score.innerHTML += "<br>AutoDipPicking, an Interpretation Engineering Answer Product, picked 34 dips in 1 second."
        }
    }

    let validForm = function slbg_validForm() {
        //get drop down value
        var e = document.getElementById("dropDown");
        var result = e.options[e.selectedIndex].value;
        alert(result); //ID002
        vform = new validForm();
        var x = document.forms["DLS"]["fnameDLS"].value;
        if (x == "") {
            alert("DLS not entered. Use 0 deg as default");
            return false;
        }

        var y = document.forms["ITD"]["fnameITD"].value;
        if (x == "") {
            alert("Interval to Drill not entered. Use 30m as default");
            return false;
        }
        console.log(x);
        console.log(y);
    }

    let m_controlTable;
    let m_welldirection;
    let m_welldls;
    let m_wellitd;

    let drawDipContainer = function slbg_drawDipContainer(xp, yp, wp, hp)
    {
        let l_dipContainer = new PIXI.Container();
        
        let sprite = createSprite("4-dipimage", xp, yp, wp, hp);
        setSpriteDipPicker(sprite);
        
        if (m_sceneId == 41)
        {
            setSpriteButton(sprite, m_sceneId);
        }
        l_dipContainer.addChild(sprite);
        
        if (m_sceneId == 41)
        {
            let aim_sprite = createSprite("4-aim", 0, 0, null, null, true);
            aim_sprite.visible = false;
            aim_sprite.pivot.x = aim_sprite.width / 2;
            aim_sprite.pivot.y = aim_sprite.height / 2;
            if (m_dipX.length > 0 && m_dipY.length > 0)
            {
                aim_sprite.x = m_dipX[m_dipX.length - 1] * sprite.width + sprite.x;
                aim_sprite.y = m_dipY[m_dipY.length - 1] * sprite.height + sprite.y;
                aim_sprite.visible = true;
            }
            l_dipContainer.addChild(aim_sprite);
        }
        
        m_dipscoretable.innerHTML = '<p id="itimer"></p>';
        m_dipscoretable.innerHTML += '<table border=1 id="itable"><tbody><tr><th>#</th><th>Depth (ft)</th><th>Dip (deg)</th><th>Azimuth (deg)</th><th>Score / 5</th></tr></tbody></table>';
        m_dipscoretable.innerHTML += '<p id="iscore"></p>';
        l_table = document.getElementById("itable");
        l_table.style.color = "#003366"
        
        let dipScore = 0;
        
        let dipCount = Math.floor(m_dipX.length / 3);
        if (dipCount > 0)
        {
            let graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0x000000);
            graphics.moveTo(0, 0);
            graphics.lineTo(1, 1);
            for (let i = 0; i < dipCount; i++)
            {
                let aziList = [];
                aziList.push(m_dipX[i*3 + 0] * 2 * Math.PI);
                aziList.push(m_dipX[i*3 + 1] * 2 * Math.PI);
                aziList.push(m_dipX[i*3 + 2] * 2 * Math.PI);
                let depthList = []
                depthList.push(m_dipY[i*3 + 0]);
                depthList.push(m_dipY[i*3 + 1]);
                depthList.push(m_dipY[i*3 + 2]);
                let parameters = SUTILS.fitSinewave(aziList, depthList, 0.5);
                if (parameters.length > 0)
                {
                    let P = parameters[0];
                    let B = parameters[1];
                    let A = parameters[2];
                    let tP = ((Math.floor((P / Math.PI * 180) * 10) + 36000) % 36000) / 10;
                    let tB = Math.floor((B * (2365.1 - 2359.9) + 2359.9 ) * 10) / 10;
                    let rA = (A * 2 * (2365.1 - 2359.9));
                    let rC = 0.80625
                    let rD = Math.atan2(rA, rC) / Math.PI * 180
                    let tA = Math.floor(rD * 10) / 10;
                    let tS = Math.floor(SUTILS.getDipScore(tB, rA, tP) * 10) / 10;
                    
                    let baseBlockLineColor = 0x00FF00;
                    graphics.lineStyle(4, baseBlockLineColor);
                    let rez = 64;
                    for (let j = 0; j <= rez; j++)
                    {
                        
                        let r = j / rez;
                        let y = A*Math.cos(r * 2 * Math.PI - P) + B;
                        y = Math.min(y, 1);
                        y = Math.max(y, 0);
                        if (j == 0)
                        {
                            graphics.moveTo(r * sprite.width, y * sprite.height);
                        }
                        else
                        {
                            graphics.lineTo(r * sprite.width, y * sprite.height);
                        }
                    }
                    
                    let row = l_table.insertRow(i + 1);
                    let cell1 = row.insertCell(0); cell1.innerHTML = i + 1;
                    let cell2 = row.insertCell(1); cell2.innerHTML = tB;
                    let cell3 = row.insertCell(2); cell3.innerHTML = tA;
                    let cell4 = row.insertCell(3); cell4.innerHTML = tP;
                    let cell5 = row.insertCell(4); cell5.innerHTML = tS;
                    dipScore += tS;
                }
                else
                {
                    let row = l_table.insertRow(i + 1);
                    let cell1 = row.insertCell(0); cell1.innerHTML = i + 1;
                    let cell2 = row.insertCell(1); cell2.innerHTML = 'invalid';
                    let cell3 = row.insertCell(2); cell3.innerHTML = 'invalid';
                    let cell4 = row.insertCell(3); cell4.innerHTML = 'invalid';
                    let cell5 = row.insertCell(4); cell5.innerHTML = 0;
                }
            }
            
            let texture = g_app.renderer.generateTexture(graphics);
            let line_sprite = new PIXI.Sprite(texture);
            line_sprite.x = sprite.x;
            line_sprite.y = sprite.y;
            line_sprite.visible = true;
            l_dipContainer.addChild(line_sprite);
        }
        
        if (m_sceneId == 41)
        {
            for (let i = 0; i < m_dipX.length; i++)
            {
                let markSprite = createSprite("4-mark", 0, 0, null, null);
                markSprite.pivot.x = markSprite.width / 2;
                markSprite.pivot.y = markSprite.height / 2;
                markSprite.x = m_dipX[i] * sprite.width + sprite.x;
                markSprite.y = m_dipY[i] * sprite.height + sprite.y;
                l_dipContainer.addChild(markSprite);
            }
        }
        
        m_layer.addChild(l_dipContainer);
        
        drawGame3Score(dipCount, dipScore);
        
        if (m_sceneId == 42)
        {
            drawImage("4-dipimage_solution", 0.75, 0.0, 0.25, 1.0);
        }
    }


    
    public.redraw = function slbg_redraw()
    {
        //console.log('redraw');
        drawScene(m_sceneId);
    }
    
    let drawScene = function slbg_drawScene(id)
    {
        console.log("drawScene " + id);
        if (typeof id === "undefined" || id == null)
        {
            return;
        }
        m_sceneId = id;
        m_layer.removeChildren();
        drawImage("ui-background", 0.0, 0.0, 1.0, 1.0);
        if (id == 0)
        {
            
            drawImage("0-logo", -1.0, 0.0, 0.6, 0.1, true);
            drawButton("0-button1", 0.15, 0.2, 0.7, 0.1, 1, true);
            drawButton("0-button2", 0.15, 0.32, 0.7, 0.1, 2, true);
            drawButton("0-button3", 0.15, 0.44, 0.7, 0.1, 3, true);
            drawButton("0-button4", 0.15, 0.56, 0.7, 0.1, 4, true);
            drawButton("0-button5", 0.15, 0.68, 0.7, 0.1, 5, true);
            resetData();
        }
        if (id == 1)
        {
            drawImage("0-button1", -1.0, 0.0, 0.6, 0.1, true);
            drawImage("1-image", 0.0, 0.1, 1.0, 0.8, true);
        }
        if (id == 2)
        {
            drawImage("0-button2", -1.0, 0.0, 0.6, 0.1, true);
            drawGame1();
        }
        if (id == 20)
        {
            drawImage("0-button2", -1.0, 0.0, 0.6, 0.1, true);
            drawGame1();
            drawTimeout("2-right", 0.2, 0.4, 0.6, 0.2, 1000);
        }
        if (id == 21)
        {
            drawImage("0-button2", -1.0, 0.0, 0.6, 0.1, true);
            drawGame1();
            drawTimeout("2-wrong", 0.2, 0.4, 0.6, 0.2, 1000);
        }
        if (id == 22)
        {
            drawImage("0-button2", -1.0, 0.0, 0.6, 0.1, true);
            drawImage("2-finish", 0.2, 0.4, 0.6, 0.2);
            drawGame1Score();
        }
        if (id == 3)
        {
            drawImage("0-button3", -1.0, 0.0, 0.6, 0.1, true);
            drawImage("3-context", 0.0, 0.2, 0.7, null);
            drawButton("3-start", 0.8, 0.7, 0.1, 0.1, 31, true);
        }
        if (id == 31)
        {
            drawImage("0-button3", -1.0, 0.0, 0.6, 0.1, true);
            drawTimed("31-left1", 0.0, 0.2, 0.6, 0.6, 1000);
            drawTimed("31-left2", 0.3, 0.2, 0.3, 0.6, 1000);
            drawTimed("31-left1", 0.0, 0.2, 0.6, 0.6, 2000);
            drawTimed("31-left3", 0.5, 0.2, 0.1, 0.6, 2000);
            drawTimed("31-left1", 0.0, 0.2, 0.6, 0.6, 3000);
            drawTimedButton("31-drillahead", 0.6, 0.3, 0.1, 0.1, 4000, 32, true);
            drawTimedButton("31-drilldown", 0.6, 0.4, 0.1, 0.1, 4000, 33, true);
        }
        if (id == 32 || id == 33)
        {
            drawImage("0-button3", -1.0, 0.0, 0.6, 0.1, true);
            drawImage("31-left1", 0.0, 0.2, 0.6, 0.6);
            if (id == 32) {
                drawTimed("32-right1", 0.6, 0.2, 0.3, 0.616, 1000);
                drawTimed("32-right2", 0.7, 0.2, 0.2, 0.4, 1000);
                drawTimed("32-right1", 0.6, 0.2, 0.3, 0.616, 2000);
                //drawTimed("32-summary", 0.0, 0.5, 0.7, 0.3, 3000);
                drawTimedButton("3-startAdv", 0.9, 0.7, 0.1, 0.1, 3000, 34, true);
            }
            if (id == 33) {
                drawTimed("33-right1", 0.6, 0.2, 0.3, 0.6, 1000);
                drawTimed("33-right2", 0.7, 0.2, 0.2, 0.4, 1000);
                drawTimed("33-right1", 0.6, 0.2, 0.3, 0.6, 2000);
                //drawTimed("33-summary", 0.0, 0.5, 0.7, 0.3, 3000);
                drawTimedButton("3-startAdv", 0.9, 0.7, 0.1, 0.1, 3000, 34, true);
            }
        }
           
        if (id == 34)
        {
            drawImage("0-button3", -1.0, 0.0, 0.6, 0.1, true);
            if (document.getElementById("controlTable"))
            {

                //get drop down value
                l_ddirection = document.getElementById("dropDown");
                m_welldirection = l_ddirection.options[l_ddirection.selectedIndex].value;
              
                console.log(m_welldirection);

                l_dls = document.getElementById("iddls");
                m_welldls = l_dls.value;
                allowNumRangeDLS(m_welldls);
                console.log(m_welldls);
                
                l_itd = document.getElementById("iditd");
                m_wellitd = l_itd.value;
                allowNumRangeDIT(m_wellitd);
                console.log(m_wellitd);
               
                let l_element = document.getElementById("controlTable");
                l_element.parentNode.removeChild(l_element);
            }
            m_controlTable = document.createElement("div");
            m_controlTable.setAttribute("id", "controlTable");
            m_controlTable.className = "userControl";
            m_controlTable.innerHTML = "";
            m_controlTable.style.position = "absolute";
            m_controlTable.style.color = "#0ff";
            m_controlTable.style.fontSize = "16px";
            m_controlTable.style.userSelect = "none";
            document.body.appendChild(m_controlTable);
            m_controlTable.style.left = 10 + "px";
            m_controlTable.style.top = 300 + "px";
            m_controlTable.innerHTML = '<br><select id="dropDown"> <option value="hold">Hold</option>  <option value="build">Build</option> <option value="yield1">Yield</option> </select></br>' +
            '<br><form name="DLS" onsubmit="allowNumRangeDLS(l_dls.value)"> <input type="number" name="fnameDLS" id="iddls">:</br><font color="black"> DLS (Max 3 deg / 30m)</font> </form>' +
            '<form name="ITD" onsubmit="allowNumRangeDIT(l_itd.value)"> <input type="number" name="fnameITD" id="iditd">:</br><font color="black"> Interval to Drill (m)</font></form> <br></br></br>';
            
            l_ddirection = document.getElementById("dropDown");
            if (m_welldirection == "")
                l_ddirection.value = "hold";
            else
                l_ddirection.value = m_welldirection;

            l_dls = document.getElementById("iddls");
            allowNumRangeDLS(m_welldls);
            l_dls.value = m_welldls;
            
            l_itd = document.getElementById("iditd");
            l_itd.value = m_wellitd;
            allowNumRangeDIT(m_wellitd);

            drawImage("3-backgroundAdv", 0.0, 0.0, 1.0, 1.0);
            drawImage("34-initial", 0.2, 0.25, 0.3, 0.7);
            drawButton("3-startAdv", 0.0, 0.5, null, null, 34);

            computeToolResponse(m_welldirection, m_welldls, m_wellitd);
            
        }
        
        if (id == 4)
        {
            drawImage("0-button4", -1.0, 0.0, 0.6, 0.1, true);
            drawImage("4-instructions", 0.5, 0.1, 0.5, null);
            drawButton("4-start", 0.8, 0.7, 0.1, 0.1, 41, true);
        }
        if (id == 41 || id == 42)
        {
            drawImage("0-button4", -1.0, 0.0, 0.6, 0.1, true);
            if (document.getElementById("divscoretable"))
            {
                let l_element = document.getElementById("divscoretable");
                l_element.parentNode.removeChild(l_element);
            }
            m_dipscoretable = document.createElement("div");
            m_dipscoretable.setAttribute("id", "divscoretable");
            m_dipscoretable.className = "scoretable";
            m_dipscoretable.innerHTML = "";
            m_dipscoretable.style.position = "absolute";
            m_dipscoretable.style.color = "#003366";
            m_dipscoretable.style.fontSize = "30px";
            m_dipscoretable.style.fontFamily = "arial narrow"
            m_dipscoretable.style.userSelect = "none";
            document.body.appendChild(m_dipscoretable);
            
            m_dipscoretable.style.left = 10 + "px";
            m_dipscoretable.style.top = 20 + "%";
            m_dipscoretable.style.width = 45 + "%";
            m_dipscoretable.style.maxHeight = 70 + "%";
            m_dipscoretable.style.overflow = "auto";
            
            drawDipContainer(0.5, 0.0, 0.25, 1.0);
        }
        if (id == 5)
        {
            drawImage("0-button5", -1.0, 0.0, 0.6, 0.1, true);
            if (document.getElementById("divvideo"))
            {
                let l_element = document.getElementById("divvideo");
                l_element.hidden = false;
                let l_video = document.getElementById("ivideo");
                l_video.play();
            }
            else
            {
                let l_videodiv = document.createElement("div");
                l_videodiv.setAttribute("id", "divvideo");
                l_videodiv.style.position = "absolute";
                l_videodiv.style.top = "10%";
                l_videodiv.style.width = "95%";
                l_videodiv.style.textAlign = "center";
                l_videodiv.hidden = false;
                l_video = document.createElement("video");
                l_video.setAttribute("id", "ivideo");
                // video ratio is 1440:1080, keeping max ratio
                let vratio = 1440 / 1080;
                l_video.width = Math.min(getLayerWidth(), getLayerHeight() * 0.8 * vratio);
                l_video.height = Math.min(getLayerHeight() * 0.8, getLayerWidth() / vratio);
                l_video.innerHTML = "browser cannot read"
                l_video.style.color = "#000000";
                l_video.style.fontFamily = "arial narrow"
                l_video.autoplay = true;
                l_video.controls = true;
                l_source = document.createElement("source");
                l_source.src = "img/OneClickBHVoice.mp4";
                l_source.type = "video/mp4";
                l_video.appendChild(l_source);
                l_videodiv.appendChild(l_video);
                document.body.appendChild(l_videodiv);
            }
        }
        drawImage("ui-logo-srpc", 0.0, 0.0, 0.3, 0.1, true);
        drawImage("ui-copyright", -1.0, -1.0, 0.9, 0.1, true);
        drawButton("ui-home", 0.0, -1.0, 0.1, 0.1, 0, true);
    }
    
    let allowNumRangeDLS = function slbg_allownums(a)
    {
        if (a < 0.0)
            a = 0.0;
        if (a > 3.0)
            a = 3.0;
    }
    let allowNumRangeDIT = function slbg_allownumsDIT(a)
    {
        if (a < 1.0)
            a = 1.0;
        if (a > 100.0)
            a = 100.0;
    }

    var m_spatialResponse = [
    [-6.015183e-11,    -6.259119e-10,    -6.488981e-09,    -2.614155e-08,    -5.896559e-08,    -9.046548e-08,    -1.977062e-07,    -1.487939e-07,    -8.842540e-08,    -3.445921e-08,    -2.263102e-12,    -2.220960e-08,    -1.018045e-07,    -5.921257e-08,    -1.081497e-07,    -7.507894e-08,    -5.768912e-08,    -1.818936e-08,    -1.007601e-08,    -1.996732e-09,    -2.663929e-10],    
    [-5.475236e-11,    -5.463079e-10,    -4.536388e-09,    -1.772236e-08,    -4.519993e-08,    -5.401129e-08,    -1.000705e-07,    -7.721071e-08,    -5.309919e-08,    -1.414693e-08,    -6.356893e-12,    -1.444635e-08,    -6.276673e-08,    -7.947844e-08,    -9.670578e-08,    -1.174607e-07,    -3.141862e-08,    -1.200383e-08,    -6.166388e-09,    -1.408728e-09,    -2.516291e-10],   
    [-6.124306e-11,    -5.945882e-10,    -3.337343e-09,    -1.191562e-08,    -2.396177e-08,    -2.730651e-08,    -4.231290e-08,    -4.725005e-08,    -2.783343e-08,    -8.577714e-09,    -1.059919e-12,    -9.861659e-09,    -8.916021e-09,    -5.496392e-08,    -4.732454e-08,    -2.340004e-08,    -3.241296e-08,    -1.166769e-08,    -3.646304e-09,    -1.023017e-09,    -2.465475e-10],    
    [-9.254856e-11,    -7.799479e-10,    -2.619980e-09,    -2.219537e-08,    -1.403582e-08,    -1.057089e-08,    -1.282665e-08,    -2.284652e-08,    -1.684824e-08,    -5.822993e-09,    -5.239415e-13,    -4.641202e-09,    -7.676103e-09,    -2.696202e-08,    -2.623733e-08,    -3.238053e-08,    -1.231646e-08,    -9.990180e-09,    -2.112108e-09,    -7.264565e-10,    -2.430185e-10],    
    [-2.424416e-10,    -1.124234e-09,    -2.214650e-09,    -1.652430e-08,    -6.577543e-09,    -1.658067e-08,    -1.777211e-08,    -1.589251e-08,    -9.486757e-09,    -3.633736e-09,    -5.190589e-15,    -3.549894e-09,    -6.231622e-09,    -1.346700e-08,    -1.546838e-08,    -1.394961e-08,    -8.092084e-09,    -6.663881e-09,    -3.402566e-09,    -4.636710e-10,    -2.061522e-10],    
    [-1.893837e-10,    -5.576841e-10,    -2.018857e-09,    -3.769262e-09,    -6.405529e-09,    -9.127607e-09,    -1.090866e-08,    -1.052188e-08,    -5.371424e-09,    -2.059274e-09,    -3.232698e-13,    -2.215104e-09,    -4.822707e-09,    -7.026815e-09,    -8.996063e-09,    -1.072119e-08,    -5.324566e-09,    -1.723705e-09,    -2.614489e-09,    -4.267705e-10,    -1.344122e-10],    
    [-1.429811e-10,    -2.919070e-10,    -1.467961e-09,    -9.922722e-11,    -2.883480e-09,    -4.798447e-09,    -6.606117e-09,    -6.951867e-09,    -3.658908e-09,    -8.753112e-10,    -1.209214e-12,    -1.347124e-09,    -3.586556e-09,    -3.957315e-09,    -5.455205e-09,    -6.629178e-09,    -3.519329e-09,    -1.261917e-09,    -2.111901e-09,    -2.007163e-10,    -8.789095e-10],    
    [-1.042717e-10,    -8.022646e-10,    -9.777479e-10,    -7.010545e-11,    -2.222672e-09,    -5.638516e-09,    -6.146021e-09,    -4.676807e-09,    -2.124822e-09,    -5.074889e-10,    -2.561282e-14,    -8.001327e-10,    -2.579070e-09,    -1.858500e-09,    -5.467758e-09,    -4.082557e-09,    -2.345160e-09,    -9.460309e-10,    -1.253074e-09,    -6.450452e-11,    -7.204325e-10],    
    [-2.467121e-10,    -5.611259e-10,    -6.540769e-10,    -1.637832e-10,    -3.133291e-10,    -4.082527e-09,    -4.069028e-09,    -1.885754e-09,    -1.212817e-09,    -3.269104e-10,    -3.182890e-15,    -4.645252e-10,    -1.802364e-09,    -1.896214e-09,    -3.105542e-09,    -2.512147e-09,    -1.582461e-09,    -7.289685e-10,    -4.198223e-10,    -6.135145e-11,    -5.222499e-10],    
    [-1.585238e-10,    -3.855563e-10,    -4.412146e-10,    -2.840154e-10,    -3.769244e-10,    -8.817568e-10,    -2.799298e-09,    -1.120791e-09,    -7.032827e-10,    -2.300308e-10,    -3.773729e-14,    -1.888752e-10,    -6.638986e-10,    -1.566399e-09,    -1.745139e-09,    -1.550824e-09,    -1.086842e-09,    -5.794551e-10,    -1.640979e-10,    -8.556229e-11,    -3.251272e-10],    
    [-9.763633e-11,    -2.596005e-10,    -3.014854e-10,    -3.436349e-10,    -3.581574e-10,    -6.633045e-10,    -1.436114e-09,    -7.149503e-10,    -4.539941e-10,    -1.386538e-10,    -1.828637e-14,    -1.386575e-10,    -3.890502e-10,    -8.253000e-10,    -9.659791e-10,    -1.062613e-09,    -8.415937e-10,    -5.273799e-10,    -1.529610e-10,    -8.145713e-11,    -1.623014e-10],    
    [-5.679559e-11,    -1.707146e-10,    -2.097309e-10,    -3.333194e-10,    -2.831047e-10,    -4.349417e-10,    -8.666201e-10,    -3.780584e-10,    -2.999136e-10,    -8.140468e-11,    -5.025603e-15,    -8.306842e-11,    -2.522556e-10,    -4.919013e-10,    -5.076420e-10,    -8.231119e-10,    -7.182619e-10,    -4.647368e-10,    -2.687709e-10,    -2.605460e-11,    -1.785255e-11],    
    [-3.043798e-11,    -1.091450e-10,    -1.493267e-10,    -2.745706e-10,    -1.873879e-10,    -2.414028e-10,    -4.594761e-10,    -2.823272e-10,    -1.807306e-10,    -4.982527e-11,    -1.644933e-16,    -4.910971e-11,    -1.463389e-10,    -2.991610e-10,    -3.942092e-10,    -4.983588e-10,    -4.719359e-10,    -2.114886e-10,    -8.679454e-11,    -6.493216e-12,    -3.376608e-12]   
];

    var m_coordRadial = [
    4.260000e+00,  4.310000e+00,  4.360000e+00,  4.410000e+00,  4.460000e+00,  4.510000e+00,  4.560000e+00,  4.610000e+00,  4.660000e+00,  4.710000e+00,  4.760000e+00,  4.810000e+00,  4.860000e+00
    ];

    var m_coordDepth = [ 
    -1.000000e+00,  -9.000000e-01,  -8.000000e-01,  -7.000000e-01,  -6.000000e-01,  -5.000000e-01,  -4.000000e-01,  -3.000000e-01,  -2.000000e-01,  -1.000000e-01,  0.000000e+00,  1.000000e-01,  2.000000e-01,  3.000000e-01,  4.000000e-01,  5.000000e-01,  6.000000e-01,  7.000000e-01,  8.000000e-01,  9.000000e-01,  1.000000e+00
    ];

    var m_simulatedKAI;
    var m_simulatedGR;

    let  computeToolResponse = function slbg_computeToolResponse(m_welldirection, m_welldls, m_wellitd)
    {
        //check value range
        if (m_welldls < 0.0)
            m_welldls = 0.0;
        if (m_welldls > 3.0)
            m_welldls = 3.0;

        if (m_wellitd < 1.0) //drilling interval is between 1.0 - 30.0m
            m_wellitd = 1.0;
        if (m_wellitd > 30.0)
            m_wellitd = 30.0;
        //initial well trajectory and formation bedding assumption
        var m_currentDepth = 8527.0 * 12.0 *25.4 / 1000.0; //ft to meter
        var m_currentDip = 0.0; //current trajectory is horizontal
        var m_formDip = 10.0;  //assume formation bedding is 10deg dipping down to the right
        var m_dummyAmp = 10.0; //dummy amplifying the distance 10 times
        var m_currentDis = 0.002; //2mm Quanta Geo pad to borehole distance
        var m_samplingRate = 0.3 * 25.4/1000; //sampling rate 0.3-in
        //---------------------------------------------
        // calculate distance to bed boundary for the trajectory
        var m_depthLevel = (Math.floor)(m_wellitd / m_samplingRate);
        let m_disToBoundary = [];
        m_disToBoundary[0] = m_currentDis * m_dummyAmp;
        let m_simulatedKAI = [];
        let m_simulatedGR = [];
        var m_dist2Cross, m_newDist2Cross;
        var m_newAngle = 0.0;
        var m_newVert = 0.0;

        if (m_welldirection == 'build')
        {
            m_newAngle = m_formDip + m_welldls;
            m_newVert = m_currentDis * m_dummyAmp * Math.cos(m_newAngle * Math.PI / 180.0);
        }
        else if (m_welldirection == 'yield1')
        {
            m_newAngle = m_formDip - m_welldls;
            m_newVert = m_currentDis * m_dummyAmp * Math.cos(m_newAngle * Math.PI / 180.0);
        }
        else {
            m_newAngle = m_formDip;
            m_newVert = m_currentDis * m_dummyAmp
        }

        m_dist2Cross = m_newVert / Math.tan(m_formDip * Math.PI / 180.0);
        for (ii = 1; ii < m_depthLevel; ii++) {
            m_newDist2Cross = m_dist2Cross - m_samplingRate * (ii);
            m_disToBoundary[ii] = m_newDist2Cross * Math.tan(m_newAngle * Math.PI / 180.0);
            if (m_newDist2Cross < 0.0) {
                m_newDist2Cross = m_dist2Cross + m_samplingRate * (ii);
                m_disToBoundary[ii] = -m_newDist2Cross * Math.tan(m_newAngle * Math.PI / 180.0);
            }
        }

        m_welldirection.innerHTML('m_welldirection');

    }

    



    let updateDebug = function slbg_updateDebug()
    {
        //let interactState = 'i(' + (MMAPTOUCH.isStatePan() ? 'P' : '-') + (MMAPTOUCH.isStateZoom() ? 'Z' : '-') + (MMAPTOUCH.getTouchCount()) + (MMAPTOUCH.getClickCount()) + ') ';
        //let frameElapsed = 'f(' + (b ? ASSTATE.getFrame() : 0) + ') ';
        //let firstChange = 'h(' + (b ? ASSTATE.getChangeFirst() : 0) + ') ';
        //let lastChange = 'H(' + (b ? ASSTATE.getChangeLast() : 0) + ') ';
        //let changeLog = 'l(' + MMAPDATA.getChangeLogCalls() + ') ';
        //let cache = 'c(' + Object.keys(PIXI.utils.TextureCache).length + ') ';
        //let memUsage = 'o(' + performance.memory.usedJSHeapSize / 1000 + ') ';
        //let render = MMAPRENDER.getDebugState();
        let frame = 'f(' + g_frameCounter + ') ';
        let simulation = 'c(' + m_computeTimeBudget + ') ';
        
        g_counter.innerHTML = simulation + frame;
    }
    
    return public;
})();
// ---------------------