// LOADED BY
//   pse-engine.js
// IS (worker thread)
//   pse-worker.js
// LOADS (worker thread)
//   pse-edit-modules.js

self.importScripts('pse-edit-modules.js');

const G_METHOD_TO_MODULE_TABLE = {};

for (moduleName in G_MODULE_INT)
{
    moduleObject = G_MODULE_INT[moduleName];
    if (typeof(moduleObject.C_NAME) === 'undefined')
    {
        methodList = Object.getOwnPropertyNames(moduleObject).filter(item => typeof moduleObject[item] === 'function');
        console.log(methodList);
        throw "registered module has no C_NAME, method list printed in console";
    }
    if (typeof(moduleObject.EXPORT) === 'object')
    {
        exportedMethodsList = Object.getOwnPropertyNames(moduleObject.EXPORT).filter(item => typeof moduleObject[item] === 'function');
        for (methodName of exportedMethodsList)
        {
            G_METHOD_TO_MODULE_TABLE[methodName] = moduleObject.C_NAME;
        }
    }
}

console.log(G_METHOD_TO_MODULE_TABLE)

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