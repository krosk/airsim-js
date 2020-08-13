// LOADED BY
//   pse-worker.js
// IS (worker thread)
//   pse-edit-modules.js
// LOADS (worker thread)
//   airsim-tile-const.js
//   airsim-module.js

// LOADED BY
//   index.html
// IS (main thread)
//   pse-edit-modules.js

G_WASM_ENGINE = {};

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