self.importScripts('airsim-tile.js');
self.importScripts('airsim-module.js');

const G_MODULE_INT = {
    [ASSTATE.C_NAME] : ASSTATE,
    [ASROAD.C_NAME] : ASROAD,
    [ASZONE.C_NAME] : ASZONE,
    [ASRICO.C_NAME] : ASRICO,
    [ASTILEVIEW.C_NAME] : ASTILEVIEW
};

self.onmessage = function asworker_onmessage(e)
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