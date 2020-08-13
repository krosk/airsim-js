// LOADED BY
//   index.html
// IS (main thread)
//   pse-engine.js
// LOADS (worker thread)
//   pse-worker.js

const G_WORKER = true && window.Worker;

// PSEENGINE is the engine object that faces the main thread,  
// and allow API communication between main thread and worker.
// The main responsibility is to expose engine API functions 
// to the main thread, while those functions are executed on
// the worker. As a reminder, message passing between main
// thread and worker are strictly a list of strings/values.
//
// PSEENGINE exposes a function PSEENGINE.dispatch, which role
// is to transfer the message to the worker. Hence, all engine
// calls (with no callback) can be performed using only dispatch.
//
// However, for functions with callbacks, PSEENGINE requires
// a handle into the module that defines the callback so it knows
// where to call the function. The handle used by PSEENGINE is
// given by a mapping between the module name and the module object,
// which is populated with the function PSEENGINE.registerModule(). 
// The callbacked function should at least be a public function 
// of the module, but does not need to be exported. 
// Note that module name, function, and arguments, are passed 
// alongside the engine function call as a list.
//
// For convenience, PSEENGINE.registerModule() adds functions 
// alongside PSEENGINE.dispatch(), if they are defined in the
// EXPORT field of the module. The added function signature
// follows the same signature of the exported function.
// This mechanism is used for modules running on the worker.

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
                throw uiModuleName + ' not found for method ' + uiMethodName;
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
        
        if (G_WORKER)
        {
            m_worker.postMessage([postData, callbackData]);
        }
        else
        {
            let value = MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
            processCallback(value, callbackData);
        }
    }
    public.dispatch = dispatch;

    public.hasAccess = function pseengine_hasAccess()
    {
        return !G_WORKER;
    }
    
    let m_worker;
    if (G_WORKER)
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