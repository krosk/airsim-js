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
        'ASENGINE' : this,
        'ASMAP' : ASMAP,
        'ASMAPUI' : ASMAPUI,
        'ASSTATE' : ASSTATE,
        'ASROAD' : ASROAD,
        'ASZONE' : ASZONE,
        'ASRICO' : ASRICO
    };
    
    // engine exported functions
    public.initializeModule = function asengine_initializeModule(... args)
    {
        let postData = ['ASSTATE', 'initialize', ...args];
        dispatch(postData);
        postData = ['ASZONE', 'initialize', ...args];
        dispatch(postData);
        postData = ['ASRICO', 'initialize', ...args];
        dispatch(postData);
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
            const postData = ['ASROAD', 'addRoad', x, y];
            dispatch(postData);
        }
        else
        {
            const postData = ['ASROAD', 'removeRoad', x, y];
            dispatch(postData);
        }
        const postData = ['ASZONE', 'setZone', x, y, selectedId];
        dispatch(postData);
    }
    
    public.initializeTraversal = function asengine_initializeTraversal(x, y)
    {
        const postData = ['ASROAD', 'initializeTraversal', x, y];
        dispatch(postData);
    }
    
    public.getNextStepTraversal = function asengine_getNextStepTraversal()
    {
        const postData = ['ASROAD', 'getNextStepTraversal'];
        dispatch(postData);
    }
    
    public.getTraversalPath = function asengine_getTraversalPath()
    {
        const callbackData = ['ASENGINE', 'printValue'];
        const postData = ['ASROAD', 'getTraversalPath'];
        dispatch(postData, callbackData);
    }
    
    public.resetTraversalPath = function asengine_resetTraversalPath()
    {
        const postData = ['ASROAD', 'resetTraversalPath'];
        dispatch(postData);
    }
    
    public.printTraversal = function asengine_printTraversal()
    {
        const postData = ['ASROAD', 'printTraversal'];
        dispatch(postData);
    }
    
    public.printValue = function asengine_printValue(value)
    {
        console.log(value);
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
        let engineArg1 = postData[3];
        let engineArg2 = postData[4];
        
        if (G_WORKER)
        {
            m_worker.postMessage(data);
        }
        else
        {
            let value = C_MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
            if (typeof callbackData !== 'undefined')
            {
                let uiModuleName = callbackData[0];
                let uiMethodName = callbackData[1];
                let uiArg0 = callbackData[2];
                let uiMethod = C_MODULE_INT[uiModuleName][uiMethodName];
                if (typeof uiArg0 === 'undefined')
                {
                    uiMethod(value);
                }
                else
                {
                    uiMethod(uiArg0, value);
                }
            }
        }
    }

    return public;
})();