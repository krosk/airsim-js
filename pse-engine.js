// LOADED BY
//   index.html
// IS (main thread)
//   pse-engine.js
// LOADS (worker thread)
//   pse-worker.js

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
// PSENGINE is implemented as a Proxy, and any function call
// performed on PSENGINE is intercepted and redirected as 
// a message to the worker. Hence main thread does not need
// prior knowledge of the exposed methods of the engine, as
// the resolution happens on the worker.
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
// When worker is unavailable, the dispatch call is executed
// on the main thread. Hence engine internal modules also have
// to be registered with PSEENGINE.registerModule().

let PSEENGINE_Obj = (function ()
{
    let public = {};
    
    public.registerModule = function pseengine_registerModule(module)
    {
        if (typeof(module.C_NAME) === 'undefined')
        {
            methodList = Object.getOwnPropertyNames(module).filter(item => typeof module[item] === 'function');
            console.log(methodList);
            throw "registered module has no C_NAME, method list printed in console";
        }
        G_MODULE_INT[module.C_NAME] = module;
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
            if (typeof G_MODULE_INT[uiModuleName] === 'undefined')
            {
                throw uiModuleName + ' not found for method ' + uiMethodName;
            }
            let uiMethod = G_MODULE_INT[uiModuleName][uiMethodName];
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
        if (G_WORKER && window.Worker)
        {
            m_worker.postMessage([postData, callbackData]);
        }
        else
        {
            if (typeof postData != 'undefined')
            {
                let engineModuleName = postData[0];
                let engineMethodName = postData[1];
                let engineArg0 = postData[2];
                let engineArg1 = postData[3];
                let engineArg2 = postData[4];
    
                let value = undefined;
                if (typeof engineModuleName === 'undefined')
                {
                    engineModuleName = G_METHOD_TO_MODULE_TABLE[engineMethodName];
                }
    
                if (typeof engineModuleName != 'undefined')
                {
                    value = G_MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
                }
                else
                {
                    throw "No module for called method " + engineMethodName;
                }

                if (typeof callbackData != 'undefined')
                {
                    processCallback(value, callbackData);
                }
            }
        }
    }
    public.dispatch = dispatch;
    
    // to be overriden
    public.onComplete = function pseengine_oncompete()
    {
        console.log('Engine loaded; override PSEENGINE.onComplete() for callback')
    }

    // means has access to internals without having to cross message
    public.hasAccess = function pseengine_hasAccess()
    {
        return !(G_WORKER && window.Worker);
    }
    
    let m_worker;
    if (G_WORKER && window.Worker)
    {
        m_worker = new window.Worker('pse-worker.js');
        m_worker.onmessage = function pseengine_onmessage(e)
        {
            let value = e.data[0];
            let callbackData = e.data[1];
            if (value == "OK")
            {
                // signal that worker is ready
                public.onComplete();
            }
            else
            {
                processCallback(value, callbackData);
            }
        }
    }
    else
    {
        // asynchronous loading
        async function init() {
            await wasm_bindgen('rust/asengine_bg.wasm');
            console.log('wasm engine loaded');
            G_WASM_ENGINE = wasm_bindgen;
            public.onComplete();
        }
        init();
    }

    return public;
})();

// notes from https://stackoverflow.com/questions/9779624/does-javascript-have-something-like-rubys-method-missing-feature
let PSEENGINE = new Proxy(PSEENGINE_Obj, {
    get: function (target, methodOrAttributeName) {
        if (Object.keys(target).indexOf(methodOrAttributeName) !== -1)
        {
            return target[methodOrAttributeName];
        }
        else
        {
            return function (callbackData, ...args)
                {
                    let postData = [undefined, methodOrAttributeName, ...args];
                    target.dispatch(postData, callbackData);
                }
        }
    }
});