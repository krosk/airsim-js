const G_WORKER = true && window.Worker;

let ASENGINE = (function ()
{
    let public = {};
    
    public.C_NAME = 'ASENGINE';
    
    const C_MODULE_INT = {
        [public.C_NAME] : public,
        [ASMAP.C_NAME] : ASMAP,
        [ASMAPUI.C_NAME] : ASMAPUI,
        [MMAPDATA.C_NAME] : MMAPDATA,
        [ASSTATE.C_NAME] : ASSTATE,
        [ASROAD.C_NAME] : ASROAD,
        [ASZONE.C_NAME] : ASZONE,
        [ASRICO.C_NAME] : ASRICO,
        [ASTILEVIEW.C_NAME] : ASTILEVIEW
    };
    
    public.hasAccess = function asengine_hasAccess()
    {
        return !G_WORKER;
    }
    
    // engine exported functions
    public.initializeModule = function asengine_initializeModule(... args)
    {
        let postData = [ASSTATE.C_NAME, 'initialize', ...args];
        dispatch(postData);
        postData = [ASZONE.C_NAME, 'initialize', ...args];
        dispatch(postData);
        postData = [ASRICO.C_NAME, 'initialize', ...args];
        dispatch(postData);
    }
    
    // directly readable globals
    
    // async functions with callbacks
    public.retrieveAllChangedTileId = function asengine_retrieveAllChangedTileId(viewName, callbackData)
    {
        let postData = [ASTILEVIEW.C_NAME, 'retrieveAllChangedTileId', viewName];
        dispatch(postData, callbackData);
    }
    
    public.update = function asengine_update(computeTimeLimit, time, callbackData)
    {
        let postData = [ASZONE.C_NAME, 'update', computeTimeLimit, time];
        dispatch(postData, callbackData);
    }
    
    public.getSerializable = function asengine_getSerializable(callbackData)
    {
        let postData = [ASSTATE.C_NAME, 'getSerializable'];
        dispatch(postData, callbackData);
    }
    
    public.setSerializable = function asengine_setSerializable(value, callbackData)
    {
        let postData = [ASSTATE.C_NAME, 'setSerializable', value];
        dispatch(postData, callbackData);
    }
    
    public.setPreset = function asengine_setPreset(callbackData)
    {
        let postData = [ASZONE.C_NAME, 'setPreset'];
        dispatch(postData, callbackData);
    }
    
    public.getTileIdTable = function asengine_getTileIdTable(viewName, callbackData)
    {
        let postData = [ASTILEVIEW.C_NAME, 'getTileIdTable', viewName];
        dispatch(postData, callbackData);
    }
    
    // async functions without callback
    // direct order
    public.setTickSpeed = function asengine_setTickSpeed(value)
    {
        let postData = [ASSTATE.C_NAME, 'setTickSpeed', value];
        dispatch(postData);
    }
    
    public.setZone = function asengine_setZone(x, y, selectedId)
    {
        if (selectedId == public.V_ZONE.ROAD)
        {
            const postData = [ASROAD.C_NAME, 'addRoad', x, y];
            dispatch(postData);
        }
        else
        {
            const postData = [ASROAD.C_NAME, 'removeRoad', x, y];
            dispatch(postData);
        }
        const postData = [ASZONE.C_NAME, 'setZone', x, y, selectedId];
        dispatch(postData);
    }
    
    public.initializeTraversal = function asengine_initializeTraversal(x, y)
    {
        const postData = [ASROAD.C_NAME, 'initializeTraversal', x, y];
        dispatch(postData);
    }
    
    public.getNextStepTraversal = function asengine_getNextStepTraversal()
    {
        const postData = [ASROAD.C_NAME, 'getNextStepTraversal'];
        dispatch(postData);
    }
    
    public.getTraversalPath = function asengine_getTraversalPath()
    {
        const callbackData = [ASENGINE.C_NAME, 'printValue'];
        const postData = [ASROAD.C_NAME, 'getTraversalPath'];
        dispatch(postData, callbackData);
    }
    
    public.resetTraversalPath = function asengine_resetTraversalPath()
    {
        const postData = [ASROAD.C_NAME, 'resetTraversalPath'];
        dispatch(postData);
    }
    
    public.printTraversal = function asengine_printTraversal()
    {
        const postData = [ASROAD.C_NAME, 'printTraversal'];
        dispatch(postData);
    }
    
    public.getInfoRoad = function asengine_getInfoRoad(x, y)
    {
        const callbackData = [ASENGINE.C_NAME, 'printValue'];
        const postData = [ASROAD.C_NAME, 'getInfo', x, y];
        dispatch(postData, callbackData);
    }
    
    public.getInfoRico = function asengine_getInfoRico(x, y)
    {
        const callbackData = [ASENGINE.C_NAME, 'printValue'];
        const postData = [ASRICO.C_NAME, 'getInfo', x, y];
        dispatch(postData, callbackData);
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
    
    let processCallback = function asengine_processCallback(value, callbackData)
    {
        if (typeof callbackData !== 'undefined')
        {
            let uiModuleName = callbackData[0];
            let uiMethodName = callbackData[1];
            let uiArg0 = callbackData[2];
            let uiArg1 = callbackData[3];
            if (typeof C_MODULE_INT[uiModuleName] === 'undefined')
            {
                throw uiModuleName + ' not found';
            }
            let uiMethod = C_MODULE_INT[uiModuleName][uiMethodName];
            if (typeof uiMethod === 'undefined')
            {
                throw uiModuleName + '.' + uiMethodName + ' not found';
            }
            if (typeof uiArg0 === 'undefined')
            {
                uiMethod(value);
            }
            else if (typeof uiArg1 == 'undefined')
            {
                uiMethod(uiArg0, value);
            }
            else
            {
                uiMethod(uiArg0, uiArg1, value);
            }
        }
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
            m_worker.postMessage([postData, callbackData]);
        }
        else
        {
            let value = C_MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
            processCallback(value, callbackData);
        }
    }
    
    let m_worker;
    if (G_WORKER)
    {
        m_worker = new window.Worker('airsim-worker.js');
        m_worker.onmessage = function asengine_onmessage(e)
        {
            let value = e.data[0];
            let callbackData = e.data[1];
            processCallback(value, callbackData);
        }
    }

    return public;
})();