const GG_WORKER = false && window.Worker;

let PSEENGINE = (function ()
{
    let public = {};
    
    // engine calls and callback back calls
    // all go through this
    let MODULE_INT = {};
    
    public.registerModule = function pseengine_registerModule(module)
    {
        if (typeof(module.C_NAME) === 'undefined')
        {
            methodList = Object.getOwnPropertyNames(module).filter(item => typeof module[item] === 'function');
            console.log(methodList);
            throw "registered module has no C_NAME, method list printed in console";
        }
        MODULE_INT[module.C_NAME] = module;
        if (typeof(module.EXPORT) === 'object')
        {
            exportedMethodsList = Object.getOwnPropertyNames(module.EXPORT).filter(item => typeof module[item] === 'function');
            for (methodName of exportedMethodsList)
            {
                registerFunctionWithCallback(module.C_NAME, methodName);
            }
        }
        else
        {
            console.log("Module " + module.C_NAME + " has no EXPORT, skipping");
        }
    }
    
    let registerFunctionWithCallback = function pseengine_registerFunctionWithCallback(moduleName, functionName)
    {
        console.log(moduleName + "." + functionName);
        public[functionName] = function (callbackData, ...args)
        {
            let postData = [moduleName, functionName, ...args];
            dispatch(postData, callbackData);
        }
    }
    
    let processCallback = function pseengine_processCallback(value, callbackData)
    {
        if (typeof callbackData !== 'undefined')
        {
            let uiModuleName = callbackData[0];
            let uiMethodName = callbackData[1];
            let uiArg0 = callbackData[2];
            let uiArg1 = callbackData[3];
            if (typeof MODULE_INT[uiModuleName] === 'undefined')
            {
                throw uiModuleName + ' not found';
            }
            let uiMethod = MODULE_INT[uiModuleName][uiMethodName];
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
    
    let dispatch = function pseengine_dispatch(postData, callbackData)
    {
        let engineModuleName = postData[0];
        let engineMethodName = postData[1];
        let engineArg0 = postData[2];
        let engineArg1 = postData[3];
        let engineArg2 = postData[4];
        
        if (GG_WORKER)
        {
            m_worker.postMessage([postData, callbackData]);
        }
        else
        {
            let value = MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
            processCallback(value, callbackData);
        }
    }
    
    let m_worker;
    if (GG_WORKER)
    {
        m_worker = new window.Worker('pse-worker.js');
        m_worker.onmessage = function pseengine_onmessage(e)
        {
            let value = e.data[0];
            let callbackData = e.data[1];
            processCallback(value, callbackData);
        }
    }
    
    return public;
})();