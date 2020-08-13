// LOADED BY
//   pse-engine.js
// IS (worker thread)
//   pse-worker.js
// LOADS (worker thread)
//   pse-edit-modules.js

self.importScripts('pse-edit-modules.js');

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
        
        let value = G_MODULE_INT[engineModuleName][engineMethodName](engineArg0, engineArg1, engineArg2);
        if (typeof callbackData != 'undefined')
        {
            postMessage([value, callbackData]);
        }
    }
}