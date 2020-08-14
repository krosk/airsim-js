let wasm_bindgen;
(function() {
    const __exports = {};
    let wasm;

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }
    /**
    */
    class AsState {

        static __wrap(ptr) {
            const obj = Object.create(AsState.prototype);
            obj.ptr = ptr;

            return obj;
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_asstate_free(ptr);
        }
        /**
        * @returns {AsState}
        */
        static new() {
            var ret = wasm.asstate_new();
            return AsState.__wrap(ret);
        }
        /**
        * @param {number} index
        * @param {number} field
        * @returns {number}
        */
        r(index, field) {
            var ret = wasm.asstate_r(this.ptr, index, field);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} field
        * @param {number} data
        */
        w(index, field, data) {
            wasm.asstate_w(this.ptr, index, field, data);
        }
        /**
        * @param {number} index
        */
        clear(index) {
            wasm.asstate_clear(this.ptr, index);
        }
        /**
        * @param {number} index
        */
        clearProperties(index) {
            wasm.asstate_clearProperties(this.ptr, index);
        }
        /**
        * @param {number} newIndex
        */
        notifyChange(newIndex) {
            wasm.asstate_notifyChange(this.ptr, newIndex);
        }
        /**
        * @returns {number}
        */
        retrieveChange() {
            var ret = wasm.asstate_retrieveChange(this.ptr);
            return ret;
        }
        /**
        * @returns {string}
        */
        getSerializable() {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getSerializable(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                return getStringFromWasm0(r0, r1);
            } finally {
                wasm.__wbindgen_export_0.value += 16;
                wasm.__wbindgen_free(r0, r1);
            }
        }
        /**
        * @param {number} array_size
        */
        setRawDataSize(array_size) {
            wasm.asstate_setRawDataSize(this.ptr, array_size);
        }
        /**
        * @param {number} index
        * @param {number} value
        */
        setRawDataValue(index, value) {
            wasm.asstate_setRawDataValue(this.ptr, index, value);
        }
    }
    __exports.AsState = AsState;

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {

            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            let src;
            if (typeof document === 'undefined') {
                src = location.href;
            } else {
                src = document.currentScript.src;
            }
            input = src.replace(/\.js$/, '_bg.wasm');
        }
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }

        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;

        return wasm;
    }

    wasm_bindgen = Object.assign(init, __exports);

})();
