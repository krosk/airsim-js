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

    let cachegetInt16Memory0 = null;
    function getInt16Memory0() {
        if (cachegetInt16Memory0 === null || cachegetInt16Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt16Memory0 = new Int16Array(wasm.memory.buffer);
        }
        return cachegetInt16Memory0;
    }

    function getArrayI16FromWasm0(ptr, len) {
        return getInt16Memory0().subarray(ptr / 2, ptr / 2 + len);
    }

    let cachegetUint16Memory0 = null;
    function getUint16Memory0() {
        if (cachegetUint16Memory0 === null || cachegetUint16Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint16Memory0 = new Uint16Array(wasm.memory.buffer);
        }
        return cachegetUint16Memory0;
    }

    let WASM_VECTOR_LEN = 0;

    function passArray16ToWasm0(arg, malloc) {
        const ptr = malloc(arg.length * 2);
        getUint16Memory0().set(arg, ptr / 2);
        WASM_VECTOR_LEN = arg.length;
        return ptr;
    }

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    function _assertClass(instance, klass) {
        if (!(instance instanceof klass)) {
            throw new Error(`expected instance of ${klass.name}`);
        }
        return instance.ptr;
    }
    /**
    */
    class ASROAD {

        static __wrap(ptr) {
            const obj = Object.create(ASROAD.prototype);
            obj.ptr = ptr;

            return obj;
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_asroad_free(ptr);
        }
        /**
        * @returns {ASROAD}
        */
        static new() {
            var ret = wasm.asroad_new();
            return ASROAD.__wrap(ret);
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        * @returns {number}
        */
        getRoadType(state, index) {
            _assertClass(state, ASSTATE);
            var ret = wasm.asroad_getRoadType(this.ptr, state.ptr, index);
            return ret;
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        */
        changeDataIndex(state, index) {
            _assertClass(state, ASSTATE);
            wasm.asroad_changeDataIndex(this.ptr, state.ptr, index);
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        */
        changeTraversalIndex(state, index) {
            _assertClass(state, ASSTATE);
            wasm.asroad_changeDataIndex(this.ptr, state.ptr, index);
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        * @returns {boolean}
        */
        hasRoad(state, index) {
            _assertClass(state, ASSTATE);
            var ret = wasm.asroad_hasRoad(this.ptr, state.ptr, index);
            return ret !== 0;
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        * @returns {number}
        */
        getRoadMaximumCarFlow(state, index) {
            _assertClass(state, ASSTATE);
            var ret = wasm.asroad_getRoadMaximumCarFlow(this.ptr, state.ptr, index);
            return ret;
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        * @returns {number}
        */
        getRoadSpeed(state, index) {
            _assertClass(state, ASSTATE);
            var ret = wasm.asroad_getRoadSpeed(this.ptr, state.ptr, index);
            return ret;
        }
        /**
        * @param {ASSTATE} state
        * @param {number} index
        * @returns {number}
        */
        getRoadCarFlowRatio(state, index) {
            _assertClass(state, ASSTATE);
            var ret = wasm.asroad_getRoadCarFlowRatio(this.ptr, state.ptr, index);
            return ret;
        }
    }
    __exports.ASROAD = ASROAD;
    /**
    */
    class ASSTATE {

        static __wrap(ptr) {
            const obj = Object.create(ASSTATE.prototype);
            obj.ptr = ptr;

            return obj;
        }

        free() {
            const ptr = this.ptr;
            this.ptr = 0;

            wasm.__wbg_asstate_free(ptr);
        }
        /**
        * @returns {ASSTATE}
        */
        static new() {
            var ret = wasm.asstate_new();
            return ASSTATE.__wrap(ret);
        }
        /**
        * @param {number} x
        * @param {number} y
        * @returns {number}
        */
        getIndex(x, y) {
            var ret = wasm.asstate_getIndex(this.ptr, x, y);
            return ret;
        }
        /**
        * @param {number} index
        * @returns {Int16Array}
        */
        getXYFromIndex(index) {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getXYFromIndex(retptr, this.ptr, index);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
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
        * @param {number} index
        * @returns {number}
        */
        getZoneId(index) {
            var ret = wasm.asstate_getZoneId(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setZoneId(index, data) {
            wasm.asstate_setZoneId(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getZoneRequest(index) {
            var ret = wasm.asstate_getZoneRequest(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setZoneRequest(index, data) {
            wasm.asstate_setZoneRequest(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getChangeFlag(index) {
            var ret = wasm.asstate_getChangeFlag(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setChangeFlag(index, data) {
            wasm.asstate_setChangeFlag(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {boolean}
        */
        getRoadConnected(index) {
            var ret = wasm.asstate_getRoadConnected(this.ptr, index);
            return ret !== 0;
        }
        /**
        * @param {number} index
        * @param {number} d
        * @returns {number}
        */
        getRoadConnectTo(index, d) {
            var ret = wasm.asstate_getRoadConnectTo(this.ptr, index, d);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} d
        */
        setRoadConnectTo(index, d) {
            wasm.asstate_setRoadConnectTo(this.ptr, index, d);
        }
        /**
        * @param {number} index
        * @param {number} d
        */
        setRoadDisconnectTo(index, d) {
            wasm.asstate_setRoadDisconnectTo(this.ptr, index, d);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getDisplayId(index) {
            var ret = wasm.asstate_getDisplayId(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setDisplayId(index, data) {
            wasm.asstate_setDisplayId(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadLastCarFlow(index) {
            var ret = wasm.asstate_getRoadLastCarFlow(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadLastCarFlow(index, data) {
            wasm.asstate_setRoadLastCarFlow(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadCarFlow(index) {
            var ret = wasm.asstate_getRicoDensity(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadCarFlow(index, data) {
            wasm.asstate_setRicoDensity(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadTraversalProcessed(index) {
            var ret = wasm.asstate_getRoadTraversalProcessed(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadTraversalProcessed(index, data) {
            wasm.asstate_setRoadTraversalProcessed(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadTraversalCost(index) {
            var ret = wasm.asstate_getRoadTraversalCost(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadTraversalCost(index, data) {
            wasm.asstate_setRoadTraversalCost(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadTraversalParent(index) {
            var ret = wasm.asstate_getRoadTraversalParent(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadTraversalParent(index, data) {
            wasm.asstate_setRoadTraversalParent(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRoadDebug(index) {
            var ret = wasm.asstate_getRoadDebug(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRoadDebug(index, data) {
            wasm.asstate_setRoadDebug(this.ptr, index, data);
        }
        /**
        * @param {number} index
        * @returns {Int16Array}
        */
        getRicoDemandOffer(index) {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getRicoDemandOffer(retptr, this.ptr, index);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
        }
        /**
        * @param {number} index
        * @param {Int16Array} demand_offer
        */
        setRicoDemandOffer(index, demand_offer) {
            var ptr0 = passArray16ToWasm0(demand_offer, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRicoDemandOffer(this.ptr, index, ptr0, len0);
        }
        /**
        * @param {number} index
        * @returns {number}
        */
        getRicoDensity(index) {
            var ret = wasm.asstate_getRicoDensity(this.ptr, index);
            return ret;
        }
        /**
        * @param {number} index
        * @param {number} data
        */
        setRicoDensity(index, data) {
            wasm.asstate_setRicoDensity(this.ptr, index, data);
        }
        /**
        * @param {number} field
        * @param {number} index
        * @returns {number}
        */
        getBuildingData(field, index) {
            var ret = wasm.asstate_getBuildingData(this.ptr, field, index);
            return ret;
        }
        /**
        * @param {number} field
        * @param {number} index
        * @param {number} data
        */
        setBuildingData(field, index, data) {
            wasm.asstate_setBuildingData(this.ptr, field, index, data);
        }
        /**
        * @returns {number}
        */
        getTick() {
            var ret = wasm.asstate_getTick(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setTick(data) {
            wasm.asstate_setTick(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getTickSpeed() {
            var ret = wasm.asstate_getTickSpeed(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setTickSpeed(data) {
            wasm.asstate_setTickSpeed(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getFrame() {
            var ret = wasm.asstate_getFrame(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setFrame(data) {
            wasm.asstate_setFrame(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getPlay() {
            var ret = wasm.asstate_getPlay(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setPlay(data) {
            wasm.asstate_setPlay(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getTickProgress() {
            var ret = wasm.asstate_getTickProgress(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setTickProgress(data) {
            wasm.asstate_setTickProgress(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getRicoStep() {
            var ret = wasm.asstate_getRicoStep(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setRicoStep(data) {
            wasm.asstate_setRicoStep(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getRoadTraversalStart() {
            var ret = wasm.asstate_getRoadTraversalStart(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setRoadTraversalStart(data) {
            wasm.asstate_setRoadTraversalStart(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getRoadTraversalCurrentIndex() {
            var ret = wasm.asstate_getRoadTraversalCurrentIndex(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setRoadTraversalCurrentIndex(data) {
            wasm.asstate_setRoadTraversalCurrentIndex(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getRoadTraversalEdgeCount() {
            var ret = wasm.asstate_getRoadTraversalEdgeCount(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setRoadTraversalEdgeCount(data) {
            wasm.asstate_setRoadTraversalEdgeCount(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getChangeFirst() {
            var ret = wasm.asstate_getChangeFirst(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setChangeFirst(data) {
            wasm.asstate_setChangeFirst(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getChangeLast() {
            var ret = wasm.asstate_getChangeLast(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setChangeLast(data) {
            wasm.asstate_setChangeLast(this.ptr, data);
        }
        /**
        * @returns {Int16Array}
        */
        getRicoOfferTotal() {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getRicoOfferTotal(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
        }
        /**
        * @param {Int16Array} data
        */
        setRicoOfferTotal(data) {
            var ptr0 = passArray16ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRicoOfferTotal(this.ptr, ptr0, len0);
        }
        /**
        * @returns {Int16Array}
        */
        getRicoOfferTotalLast() {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getRicoOfferTotalLast(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
        }
        /**
        * @param {Int16Array} data
        */
        setRicoOfferTotalLast(data) {
            var ptr0 = passArray16ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRicoOfferTotalLast(this.ptr, ptr0, len0);
        }
        /**
        * @returns {Int16Array}
        */
        getRicoDemandTotal() {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getRicoDemandTotal(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
        }
        /**
        * @param {Int16Array} data
        */
        setRicoDemandTotal(data) {
            var ptr0 = passArray16ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRicoDemandTotal(this.ptr, ptr0, len0);
        }
        /**
        * @returns {Int16Array}
        */
        getRicoDemandTotalLast() {
            try {
                const retptr = wasm.__wbindgen_export_0.value - 16;
                wasm.__wbindgen_export_0.value = retptr;
                wasm.asstate_getRicoDemandTotalLast(retptr, this.ptr);
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var v0 = getArrayI16FromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 2);
                return v0;
            } finally {
                wasm.__wbindgen_export_0.value += 16;
            }
        }
        /**
        * @param {Int16Array} data
        */
        setRicoDemandTotalLast(data) {
            var ptr0 = passArray16ToWasm0(data, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRicoDemandTotalLast(this.ptr, ptr0, len0);
        }
        /**
        * @param {number} table_size_x
        * @param {number} table_size_y
        */
        initialize(table_size_x, table_size_y) {
            wasm.asstate_initialize(this.ptr, table_size_x, table_size_y);
        }
        /**
        * @returns {number}
        */
        getMaximumValue() {
            var ret = wasm.asstate_getMaximumValue(this.ptr);
            return ret;
        }
        /**
        * @param {number} size_x
        * @param {number} size_y
        */
        setTableSize(size_x, size_y) {
            wasm.asstate_setTableSize(this.ptr, size_x, size_y);
        }
        /**
        * @returns {number}
        */
        getTableSizeX() {
            var ret = wasm.asstate_getTableSizeX(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setTableSizeX(data) {
            wasm.asstate_setTableSizeX(this.ptr, data);
        }
        /**
        * @returns {number}
        */
        getTableSizeY() {
            var ret = wasm.asstate_getTableSizeY(this.ptr);
            return ret;
        }
        /**
        * @param {number} data
        */
        setTableSizeY(data) {
            wasm.asstate_setTableSizeY(this.ptr, data);
        }
        /**
        * @param {number} index
        * @returns {boolean}
        */
        isValidIndex(index) {
            var ret = wasm.asstate_isValidIndex(this.ptr, index);
            return ret !== 0;
        }
        /**
        * @param {number} tile_x
        * @param {number} tile_y
        * @returns {boolean}
        */
        isValidCoordinates(tile_x, tile_y) {
            var ret = wasm.asstate_isValidCoordinates(this.ptr, tile_x, tile_y);
            return ret !== 0;
        }
        /**
        * @param {number} new_index
        */
        notifyChange(new_index) {
            wasm.asstate_notifyChange(this.ptr, new_index);
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
        * @param {string} string
        */
        setSerializable(string) {
            var ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setSerializable(this.ptr, ptr0, len0);
        }
        /**
        * @param {Int16Array} array
        * @param {number} array_size
        */
        setRawData(array, array_size) {
            var ptr0 = passArray16ToWasm0(array, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.asstate_setRawData(this.ptr, ptr0, len0, array_size);
        }
    }
    __exports.ASSTATE = ASSTATE;

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
