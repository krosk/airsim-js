// LOADED BY
//   pse-engine.js
// IS (worker thread)
//   pse-worker.js
// LOADS (worker thread)
//   pse-edit-modules.js
//   pse-global.js

self.importScripts('pse-edit-modules.js');
self.importScripts('pse-global.js')

// pse-worker relies on G_MODULE_INT defined in pse-global

self.onmessage = function pseworker_onmessage(e)
{
    let postData = e.data[0];
    let callbackData = e.data[1];
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
            postMessage([value, callbackData]);
        }
    }
}