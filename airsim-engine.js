const G_WORKER = false;

let ASENGINE = (function ()
{
    let public = {};
    
    let m_worker = new Worker('airsim-module.js');
    
    m_worker.onmessage = function(e)
    {
        console.log('engine ' + e.data);
    }
    
    public.C_MODULE_ID = {
        DATA : 0,
        ZONE : 1,
        RICO : 2,
        ROAD : 3
    };
    const C = public.C_MODULE_ID;
    
    const C_MODULE = {
        [C.DATA] : ASSTATE,
        [C.ZONE] : ASZONE,
        [C.ROAD] : ASROAD,
        [C.RICO] : ASRICO
    };
    
    const C_MODULE_INT = {
        'ASSTATE' : ASSTATE,
    };

    public.initializeModuleD = function asengine_initializeModuleD(nameId, ...args)
    {
        C_MODULE[nameId].initialize(...args);
    }
    
    // engine exported functions
    public.initializeModule = function asengine_initializeModule(... args)
    {
        ASSTATE.initialize(... args);
        ASZONE.initialize(... args);
        ASRICO.initialize(... args);
    }
    
    // directly readable globals
    public.getMapTableSizeX = function asengine_getMapTableSizeX()
    {
        return dispatch(['ASSTATE', 'getTableSizeX']);
    }
    
    public.getMapTableSizeY = function asengnine_getMapTableSizeY()
    {
        return dispatch(['ASSTATE', 'getTableSizeY']);
    }
    
    public.getXYFromIndex = function asengine_getXYFromIndex(index)
    {
        return dispatch(['ASSTATE', 'getXYFromIndex', index]);
    }
    
    // async functions with callbacks
    public.retrieveChange = function asengine_retrieveChange(callback, timeLimit)
    {
        callback(timeLimit, ASSTATE.retrieveChange());
    }
    
    public.getSerializable = function asengine_getSerializable(callback)
    {
        callback(ASSTATE.getSerializable())
    }
    
    public.setSerializable = function asengine_setSerializable(value, callback)
    {
        ASSTATE.setSerializable(value);
        callback();
    }
    
    // async functions without callback
    // direct order
    public.setTickSpeed = function asengine_setTickSpeed(value)
    {
        dispatch(['ASSTATE', 'setTickSpeed', value]);
    }
    
    public.setZone = function asengine_setZone(x, y, selectedId)
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
    
    public.initializeTraversal = function asengine_initializeTraversal(x, y)
    {
        ASROAD.initializeTraversal(x, y);
    }
    
    public.getNextStepTraversal = function asengine_getNextStepTraversal()
    {
        console.log(ASROAD.getNextStepTraversal());
    }
    
    public.getTraversalPath = function asengine_getTraversalPath()
    {
        console.log(ASROAD.getTraversalPath());
    }
    
    public.resetTraversalPath = function asengine_resetTraversalPath()
    {
        ASROAD.resetTraversalPath();
    }
    
    public.printTraversal = function asengine_printTraversal()
    {
        ASROAD.printTraversal();
    }
    
    // tiles bank
    public.V_ZONE = function asengine_v_zone()
    {
        return ASZONE.C_TILEENUM;
    }
    
    public.V_ROAD = function asengine_v_road()
    {
        return ASROAD.C_TILEENUM;
    }
    
    let dispatch = function asengine_dispatch(data)
    {
        let moduleName = data[0];
        let methodName = data[1];
        let arg0 = data[2];
        
        if (G_WORKER)
        {
            m_worker.postMessage(data);
        }
        else
        {
            return C_MODULE_INT[moduleName][methodName](arg0);
        }
    }

    return public;
})();