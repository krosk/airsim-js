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
    console.log("image loaded, testingScene");
    g_state = BenchState;
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

    public.setSpriteToPosition = function (id, x, y, visible)
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

    public.initialize = function (x, y)
    {
        m_grid = new PF.Grid(x, y);
        m_width_x = x;
        m_height_y = y;
    }

    public.Grid = function ()
    {
        return m_grid;
    }

    public.Width = function ()
    {
        return m_width_x;
    }

    public.Height = function ()
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

    public.create = function (x, y)
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

    public.update = function (dt, time)
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
            entity.position.x = (entity.position.x + dt / ut) % ASMAP.Width();
            //entity.position.y += dt/ut*(Math.floor(Math.random() * 3) - 1);
        });
    }

    return public;
})();
// ---------------------
function pfTest(IPF, s)
{
    var grid = new IPF.Grid(s, s);
    pfFormatGrid(grid, s, s);
    var jpf = new IPF.JumpPointFinder();
    var path = jpf.findPath(0, 0, s - 10, 0, grid);

    //console.log(path);
}

function pfFormatGrid(grid, w, h)
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
    
function BenchState()
{
    var suite = new Benchmark.Suite;
    var s = 400;
    
    var pgrid = new PF.Grid(s, s);
    pfFormatGrid(pgrid, s, s);
    var pjpf = new PF.JumpPointFinder();
    
    var agrid = new ASPF.Grid(s, s);
    pfFormatGrid(agrid, s, s);
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
    .run({async: false});

    console.log('run');
    
    g_state = BenchLoopState;
}

function BenchLoopState()
{
    var grid = new ASPF.Grid(300, 300);
    pfFormatGrid(grid, 300, 300);
    var ajpf = new ASPF.JumpPointFinder();
    //console.log(ajpf.findPath(0, 0, 290, 290, grid));
    //console.log(ajpf.findPath(0, 0, 7, 0, grid));
    //console.log('end');
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

        for (i = 0; i < height; ++i)
        {
            for (j = 0; j < width; ++j)
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

        // ↑
        if (this.isWalkableAt(x, y - 1))
        {
            neighbors.push(this.getNodeAt(x, y - 1));
            s0 = true;
        }
        // →
        if (this.isWalkableAt(x + 1, y))
        {
            neighbors.push(this.getNodeAt(x + 1, y));
            s1 = true;
        }
        // ↓
        if (this.isWalkableAt(x, y + 1))
        {
            neighbors.push(this.getNodeAt(x, y + 1));
            s2 = true;
        }
        // ←
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

        // ↖
        if (d0 && this.isWalkableAt(x - 1, y - 1))
        {
            neighbors.push(this.getNodeAt(x - 1, y - 1));
        }
        // ↗
        if (d1 && this.isWalkableAt(x + 1, y - 1))
        {
            neighbors.push(this.getNodeAt(x + 1, y - 1));
        }
        // ↘
        if (d2 && this.isWalkableAt(x + 1, y + 1))
        {
            neighbors.push(this.getNodeAt(x + 1, y + 1));
        }
        // ↙
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