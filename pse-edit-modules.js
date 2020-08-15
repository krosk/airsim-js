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

const G_WORKER = true;

if (typeof WorkerGlobalScope !== 'undefined')
{
    self.importScripts('airsim-tile-const.js');
    self.importScripts('rust/asengine.js');
    self.importScripts('airsim-module.js');
}

const G_MODULE_INT = {
    //[ASSTATE.C_NAME] : ASSTATE,
    [ASROAD.C_NAME] : ASROAD,
    [ASZONE.C_NAME] : ASZONE,
    [ASRICO.C_NAME] : ASRICO,
    [ASTILEVIEW.C_NAME] : ASTILEVIEW,
    [ASWENGINE.C_NAME] : ASWENGINE
};