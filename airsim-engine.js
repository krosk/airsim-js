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
        'ASMAP' : ASMAP,
        'ASMAPUI' : ASMAPUI,
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
    
    // async functions with callbacks
    public.retrieveChange = function asengine_retrieveChange(callbackData)
    {
        let postData = ['ASSTATE', 'retrieveChange'];
        dispatch(postData, callbackData);
    }
    
    public.getSerializable = function asengine_getSerializable(callbackData)
    {
        let postData = ['ASSTATE', 'getSerializable'];
        dispatch(postData, callbackData);
    }
    
    public.setSerializable = function asengine_setSerializable(value, callbackData)
    {
        let postData = ['ASSTATE', 'setSerializable', value];
        dispatch(postData, callbackData);
    }
    
    // async functions without callback
    // direct order
    public.setTickSpeed = function asengine_setTickSpeed(value)
    {
        let postData = ['ASSTATE', 'setTickSpeed', value];
        dispatch(postData);
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
    
    let dispatch = function asengine_dispatch(postData, callbackData)
    {
        let engineModuleName = postData[0];
        let engineMethodName = postData[1];
        let engineArg0 = postData[2];
        
        if (G_WORKER)
        {
            m_worker.postMessage(data);
        }
        else
        {
            let value = C_MODULE_INT[engineModuleName][engineMethodName](engineArg0);
            if (typeof callbackData !== 'undefined')
            {
                let uiModuleName = callbackData[0];
                let uiMethodName = callbackData[1];
                let uiArg0 = callbackData[2];
                if (typeof uiArg0 === 'undefined')
                {
                    C_MODULE_INT[uiModuleName][uiMethodName](value);
                }
                else
                {
                    C_MODULE_INT[uiModuleName][uiMethodName](uiArg0, value);
                }
            }
        }
    }

    return public;
})();