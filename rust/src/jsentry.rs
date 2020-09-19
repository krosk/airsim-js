#[no_mangle]
pub extern fn rustadd(a: usize, b:usize) -> usize {
    a+b
}

#[no_mangle]
pub extern fn rust_r(index: i32, field: i32) -> i32 {
    let target: i32 = if index == 0 { field } else { (index - 1)*11 + 30 + field };
    return target;
}

use wasm_bindgen::prelude::*;
use json::stringify;
use serde_json;

#[wasm_bindgen]
pub struct ASSTATE {
    cells: Vec<i16>, //dataStateView
}

#[wasm_bindgen]
pub struct ASROAD {
    
}

/*#[wasm_bindgen]
impl ASENGINE {
    pub fn new(&asstate: ASSTATE) -> ASENGINE {
        return ASENGINE { asstate }
    }
}*/

enum ASSTATE_C {
    ZONE_ID = 0,
    CHANGE = 1,
    ZONE_REQUEST = 2,
    ROAD_CONNECT = 3,
    DISPLAY_ID = 4,
    
    _5 = 5,
    _6 = 6,
    _7 = 7,
    _8 = 8,
    _9 = 9,
    _10 = 10,
    
    //ROAD_CAR_FLOW = 5,
    //ROAD_CAR_LAST_FLOW = 6,
    //ROAD_TRAVERSAL_PROCESSED = 7,
    //ROAD_TRAVERSAL_COST = 8,
    //ROAD_TRAVERSAL_PARENT = 9,
    //ROAD_DEBUG = 10,
    
    //RICO_DENSITY_LEVEL = 5,
    //RICO_DEMAND_OFFER_R = 6,
    //RICO_DEMAND_OFFER_I = 7,
    //RICO_DEMAND_OFFER_C = 8,
    //RICO_DEMAND_OFFER_P = 9,
    
    END = 11
}

impl ASSTATE_C {
    pub const PROPERTY_START: ASSTATE_C = ASSTATE_C::_5;

    pub const ROAD_CAR_FLOW: ASSTATE_C = ASSTATE_C::_5;
    pub const ROAD_CAR_LAST_FLOW: ASSTATE_C = ASSTATE_C::_6;
    pub const ROAD_TRAVERSAL_PROCESSED: ASSTATE_C = ASSTATE_C::_7;
    pub const ROAD_TRAVERSAL_COST: ASSTATE_C = ASSTATE_C::_8;
    pub const ROAD_TRAVERSAL_PARENT: ASSTATE_C = ASSTATE_C::_9;
    pub const ROAD_DEBUG: ASSTATE_C = ASSTATE_C::_10;

    pub const RICO_DENSITY_LEVEL: ASSTATE_C = ASSTATE_C::_5;
    pub const RICO_DEMAND_OFFER_R: ASSTATE_C = ASSTATE_C::_6;
    pub const RICO_DEMAND_OFFER_I: ASSTATE_C = ASSTATE_C::_7;
    pub const RICO_DEMAND_OFFER_C: ASSTATE_C = ASSTATE_C::_8;
    pub const RICO_DEMAND_OFFER_P: ASSTATE_C = ASSTATE_C::_9;
}

enum ASSTATE_G {
    SIZE_X = 0,
    SIZE_Y = 1,
    PLAY = 2,
    TICK = 3,
    FRAME = 4,
    TICK_SPEED = 5,
    TICK_PROGRESS = 6,
    RICO_STEP = 7,
    ROAD_TRAVERSAL_START = 8,
    ROAD_TRAVERSAL_LAST = 9,
    ROAD_TRAVERSAL_CURRENT_INDEX = 10,
    ROAD_TRAVERSAL_EDGE_COUNT = 11,
    CHANGE_FIRST = 12,
    CHANGE_LAST = 13,
    STAT_OFFER_R_TOTAL = 14,
    STAT_OFFER_R_TOTAL_LAST = 15,
    STAT_DEMAND_R_TOTAL = 16,
    STAT_DEMAND_R_TOTAL_LAST = 17,
    
    STAT_OFFER_I_TOTAL = 18,
    STAT_OFFER_I_TOTAL_LAST = 19,
    STAT_DEMAND_I_TOTAL = 20,
    STAT_DEMAND_I_TOTAL_LAST = 21,
    
    STAT_OFFER_C_TOTAL = 22,
    STAT_OFFER_C_TOTAL_LAST = 23,
    STAT_DEMAND_C_TOTAL = 24,
    STAT_DEMAND_C_TOTAL_LAST = 25,
    
    STAT_OFFER_P_TOTAL = 26,
    STAT_OFFER_P_TOTAL_LAST = 27,
    STAT_DEMAND_P_TOTAL = 28,
    STAT_DEMAND_P_TOTAL_LAST = 29,
    
    END = 30
}

impl ASSTATE {
    fn rc(&self, index: i32, field: ASSTATE_C) -> i16 {
        if index == 0 {
            panic!("Accessing invalid index 0");
        }
        let target: usize = (index as usize - 1)*(ASSTATE_C::END as usize) + (ASSTATE_G::END as usize) + field as usize;
        return self.cells[target];
    }
    
    fn wc(&mut self, index: i32, field: ASSTATE_C, data: i16) {
        if index == 0 {
            panic!("Accessing invalid index 0");
        }
        let target: usize = (index as usize - 1)*(ASSTATE_C::END as usize) + (ASSTATE_G::END as usize) + field as usize;
        self.cells[target] = data;
    }
    
    fn rg(&self, field: ASSTATE_G) -> i16 {
        return self.cells[field as usize];
    }
    
    fn wg(&mut self, field: ASSTATE_G, data: i16) {
        self.cells[field as usize] = data;
    }
}



#[wasm_bindgen]
impl ASSTATE {
    pub fn new() -> ASSTATE {
        let cells = Vec::new();
        return ASSTATE { cells };
    }

    pub fn getIndex(&self, x: i32, y: i32) -> i16 {
        if x < 0 || x >= self.getTableSizeX() as i32 || y < 0 || y >= self.getTableSizeY() as i32 {
            return -1;
        }
        return (x*self.getTableSizeY() as i32 + y + 1) as i16;
    }

    pub fn getXYFromIndex(&self, index: i32) -> Box<[i16]> {
        if self.isValidIndex(index) {
            return Box::new([((index as i16 - 1) / self.getTableSizeY()) | 0, (index as i16 - 1) % self.getTableSizeY()]);
        } else {
            return Box::new([-1, -1]);
        }
    }

    /*pub fn r(&self, index: i32, field: i32) -> i16 {
        let target: usize = (if index == 0 { field } else { (index - 1)*(ASSTATE_C::END as i32) + (ASSTATE_G::END as i32) + field }) as usize;
        return self.cells[target as usize];
        
        if (G_CHECK && typeof field == 'undefined')
        {
            throw ('error accessing undefined field');
        }
        let target = index == 0 ? field : (index - 1)*C.END + G.END + field;
        if (typeof m_dataStateView == 'undefined')
        {
            throw ('dataStateView not initialized for ' + index + ' ' + field);
            return;
        }
        if (G_CHECK && (target < 0 || target > m_dataStateView.length))
        {
            throw ('error accessing dataState at ' + index + ' ' + field);
            return;
        }
        return m_dataStateView[target];
        
    }

    pub fn w(&mut self, index: i32, field: i32, data: i16) {
        let target: usize = (if index == 0 { field } else { (index - 1)*(ASSTATE_C::END as i32) + (ASSTATE_G::END as i32) + field }) as usize;
        self.cells[target] = data;
        
        if (G_CHECK && typeof field == 'undefined')
        {
            throw ('error writing undefined field at index ' + index);
        }
        if (G_CHECK && typeof data == 'undefined')
        {
            throw ('error writing undefined data at index ' + index)
        }
        let target = index == 0 ? field : (index - 1)*C.END + G.END + field;
        if (G_CHECK && (target < 0 || target > m_dataStateView.length))
        {
            throw ('error writing to dataState at ' + index + ' ' + field + ' ' + data);
            return;
        }
        m_dataStateView[target] = data;
        
    }*/

    pub fn clear(&mut self, index: i32) {
        if index == 0 {
            for i in 0..(ASSTATE_G::END as usize) {
                self.cells[i] = 0;
            }
        }
        else
        {
            let target_base: usize = ((index - 1)*(ASSTATE_C::END as i32) + (ASSTATE_G::END as i32)) as usize;
            for i in 0..(ASSTATE_C::END as usize)
            {
                self.cells[target_base + i] = 0;
            }
        }
    }

    pub fn clearProperties(&mut self, index: i32) {
        if index > 0 {
            let target_base: usize = ((index - 1)*(ASSTATE_C::END as i32) + (ASSTATE_G::END as i32)) as usize;
            for i in (ASSTATE_C::PROPERTY_START as usize)..(ASSTATE_C::END as usize) {
                self.cells[target_base + i] = 0;
            }
        }
    }

    pub fn getZoneId(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ZONE_ID);
    }

    pub fn setZoneId(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ZONE_ID, data);
    }

    pub fn getZoneRequest(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ZONE_REQUEST);
    }

    pub fn setZoneRequest(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ZONE_REQUEST, data);
    }

    pub fn getChangeFlag(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::CHANGE);
    }

    pub fn setChangeFlag(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::CHANGE, data);
    }

    pub fn getRoadConnected(&self, index: i32) -> bool {
        return self.rc(index, ASSTATE_C::ROAD_CONNECT) > 0;
    }

    pub fn getRoadConnectTo(&self, index: i32, d: i32) -> i16 {
        let mask = 1 << d;
        return self.rc(index, ASSTATE_C::ROAD_CONNECT) & mask;
    }

    pub fn setRoadConnectTo(&mut self, index: i32, d: i32) {
        let mask = 1 << d;
        let data = self.rc(index, ASSTATE_C::ROAD_CONNECT) | mask;
        self.wc(index, ASSTATE_C::ROAD_CONNECT, data);
    }

    pub fn setRoadDisconnectTo(&mut self, index: i32, d: i32) {
        let mask = !(1 << d);
        let data = self.rc(index, ASSTATE_C::ROAD_CONNECT) & mask;
        self.wc(index, ASSTATE_C::ROAD_CONNECT, data);
    }

    pub fn getDisplayId(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::DISPLAY_ID);
    }

    pub fn setDisplayId(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::DISPLAY_ID, data);
    }

    pub fn getRoadLastCarFlow(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_CAR_LAST_FLOW);
    }
    
    pub fn setRoadLastCarFlow(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_CAR_LAST_FLOW, data);
    }

    pub fn getRoadCarFlow(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_CAR_FLOW);
    }
    
    pub fn setRoadCarFlow(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_CAR_FLOW, data);
    }

    pub fn getRoadTraversalProcessed(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_TRAVERSAL_PROCESSED);
    }
    
    pub fn setRoadTraversalProcessed(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_TRAVERSAL_PROCESSED, data);
    }
    
    pub fn getRoadTraversalCost(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_TRAVERSAL_COST);
    }
    
    pub fn setRoadTraversalCost(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_TRAVERSAL_COST, data);
    }

    pub fn getRoadTraversalParent(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_TRAVERSAL_PARENT);
    }
    
    pub fn setRoadTraversalParent(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_TRAVERSAL_PARENT, data);
    }
    
    pub fn getRoadDebug(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::ROAD_DEBUG);
    }
    
    pub fn setRoadDebug(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::ROAD_DEBUG, data);
    }

    pub fn getRicoDemandOffer(&self, index: i32) -> Box<[i16]> {
        let dor = self.rc(index, ASSTATE_C::RICO_DEMAND_OFFER_R);
        let doi = self.rc(index, ASSTATE_C::RICO_DEMAND_OFFER_I);
        let doc = self.rc(index, ASSTATE_C::RICO_DEMAND_OFFER_C);
        let dop = self.rc(index, ASSTATE_C::RICO_DEMAND_OFFER_P);
        return Box::new([dor, doi, doc, dop]);
    }

    pub fn setRicoDemandOffer(&mut self, index: i32, demand_offer: Box<[i16]>) {
        self.wc(index, ASSTATE_C::RICO_DEMAND_OFFER_R, demand_offer[0]);
        self.wc(index, ASSTATE_C::RICO_DEMAND_OFFER_I, demand_offer[1]);
        self.wc(index, ASSTATE_C::RICO_DEMAND_OFFER_C, demand_offer[2]);
        self.wc(index, ASSTATE_C::RICO_DEMAND_OFFER_P, demand_offer[3]);
    }

    pub fn getRicoDensity(&self, index: i32) -> i16 {
        return self.rc(index, ASSTATE_C::RICO_DENSITY_LEVEL);
    }
    
    pub fn setRicoDensity(&mut self, index: i32, data: i16) {
        self.wc(index, ASSTATE_C::RICO_DENSITY_LEVEL, data);
    }
    
    pub fn getTick(&self) -> i16 {
        return self.rg(ASSTATE_G::TICK);
    }
    
    pub fn setTick(&mut self, data: i16) {
        self.wg(ASSTATE_G::TICK, data);
    }
    
    pub fn getTickSpeed(&self) -> i16 {
        return self.rg(ASSTATE_G::TICK_SPEED);
    }
    
    pub fn setTickSpeed(&mut self, data: i16) {
        self.wg(ASSTATE_G::TICK_SPEED, data);
    }
    
    pub fn getFrame(&self) -> i16 {
        return self.rg(ASSTATE_G::FRAME);
    }
    
    pub fn setFrame(&mut self, data: i16) {
        self.wg(ASSTATE_G::FRAME, data);
    }
    
    pub fn getPlay(&self) -> i16 {
        return self.rg(ASSTATE_G::PLAY);
    }
    
    pub fn setPlay(&mut self, data: i16) {
        self.wg(ASSTATE_G::PLAY, data);
    }
    
    pub fn getTickProgress(&self) -> i16 {
        return self.rg(ASSTATE_G::TICK_PROGRESS);
    }
    
    pub fn setTickProgress(&mut self, data: i16) {
        self.wg(ASSTATE_G::TICK_PROGRESS, data);
    }
    
    pub fn getRicoStep(&self) -> i16 {
        return self.rg(ASSTATE_G::RICO_STEP);
    }
    
    pub fn setRicoStep(&mut self, data: i16) {
        self.wg(ASSTATE_G::RICO_STEP, data);
    }
    
    pub fn getRoadTraversalStart(&self) -> i16 {
        return self.rg(ASSTATE_G::ROAD_TRAVERSAL_START);
    }
    
    pub fn setRoadTraversalStart(&mut self, data: i16) {
        self.wg(ASSTATE_G::ROAD_TRAVERSAL_START, data);
    }
    
    pub fn getRoadTraversalCurrentIndex(&self) -> i16  {
        return self.rg(ASSTATE_G::ROAD_TRAVERSAL_CURRENT_INDEX);
    }
    
    pub fn setRoadTraversalCurrentIndex(&mut self, data: i16) {
        self.wg(ASSTATE_G::ROAD_TRAVERSAL_CURRENT_INDEX, data);
    }
    
    pub fn getRoadTraversalEdgeCount(&self) -> i16 {
        return self.rg(ASSTATE_G::ROAD_TRAVERSAL_EDGE_COUNT);
    }
    
    pub fn setRoadTraversalEdgeCount(&mut self, data: i16) {
        self.wg(ASSTATE_G::ROAD_TRAVERSAL_EDGE_COUNT, data);
    }

    pub fn getChangeFirst(&self) -> i16 {
        return self.rg(ASSTATE_G::CHANGE_FIRST);
    }
    
    pub fn setChangeFirst(&mut self, data: i16) {
        self.wg(ASSTATE_G::CHANGE_FIRST, data);
    }
    
    pub fn getChangeLast(&self) -> i16 {
        return self.rg(ASSTATE_G::CHANGE_LAST);
    }
    
    pub fn setChangeLast(&mut self, data: i16) {
        self.wg(ASSTATE_G::CHANGE_LAST, data);
    }

    pub fn getRicoOfferTotal(&self) -> Box<[i16]> {
        let ro = self.rg(ASSTATE_G::STAT_OFFER_R_TOTAL);
        let io = self.rg(ASSTATE_G::STAT_OFFER_I_TOTAL);
        let co = self.rg(ASSTATE_G::STAT_OFFER_C_TOTAL);
        let po = self.rg(ASSTATE_G::STAT_OFFER_P_TOTAL);
        return Box::new([ro, io, co, po]);
    }

    pub fn setRicoOfferTotal(&mut self, data: Box<[i16]>) {
        self.wg(ASSTATE_G::STAT_OFFER_R_TOTAL, data[0]);
        self.wg(ASSTATE_G::STAT_OFFER_I_TOTAL, data[1]);
        self.wg(ASSTATE_G::STAT_OFFER_C_TOTAL, data[2]);
        self.wg(ASSTATE_G::STAT_OFFER_P_TOTAL, data[3]);
    }

    pub fn getRicoOfferTotalLast(&self) -> Box<[i16]> {
        let ro = self.rg(ASSTATE_G::STAT_OFFER_R_TOTAL_LAST);
        let io = self.rg(ASSTATE_G::STAT_OFFER_I_TOTAL_LAST);
        let co = self.rg(ASSTATE_G::STAT_OFFER_C_TOTAL_LAST);
        let po = self.rg(ASSTATE_G::STAT_OFFER_P_TOTAL_LAST);
        return Box::new([ro, io, co, po]);
    }

    pub fn setRicoOfferTotalLast(&mut self, data: Box<[i16]>) {
        self.wg(ASSTATE_G::STAT_OFFER_R_TOTAL_LAST, data[0]);
        self.wg(ASSTATE_G::STAT_OFFER_I_TOTAL_LAST, data[1]);
        self.wg(ASSTATE_G::STAT_OFFER_C_TOTAL_LAST, data[2]);
        self.wg(ASSTATE_G::STAT_OFFER_P_TOTAL_LAST, data[3]);
    }

    pub fn getRicoDemandTotal(&self) -> Box<[i16]> {
        let ro = self.rg(ASSTATE_G::STAT_DEMAND_R_TOTAL);
        let io = self.rg(ASSTATE_G::STAT_DEMAND_I_TOTAL);
        let co = self.rg(ASSTATE_G::STAT_DEMAND_C_TOTAL);
        let po = self.rg(ASSTATE_G::STAT_DEMAND_P_TOTAL);
        return Box::new([ro, io, co, po]);
    }
    
    pub fn setRicoDemandTotal(&mut self, data: Box<[i16]>) {
        self.wg(ASSTATE_G::STAT_DEMAND_R_TOTAL, data[0]);
        self.wg(ASSTATE_G::STAT_DEMAND_I_TOTAL, data[1]);
        self.wg(ASSTATE_G::STAT_DEMAND_C_TOTAL, data[2]);
        self.wg(ASSTATE_G::STAT_DEMAND_P_TOTAL, data[3]);
    }

    pub fn getRicoDemandTotalLast(&self) -> Box<[i16]> {
        let ro = self.rg(ASSTATE_G::STAT_DEMAND_R_TOTAL_LAST);
        let io = self.rg(ASSTATE_G::STAT_DEMAND_I_TOTAL_LAST);
        let co = self.rg(ASSTATE_G::STAT_DEMAND_C_TOTAL_LAST);
        let po = self.rg(ASSTATE_G::STAT_DEMAND_P_TOTAL_LAST);
        return Box::new([ro, io, co, po]);
    }
    
    pub fn setRicoDemandTotalLast(&mut self, data: Box<[i16]>) {
        self.wg(ASSTATE_G::STAT_DEMAND_R_TOTAL_LAST, data[0]);
        self.wg(ASSTATE_G::STAT_DEMAND_I_TOTAL_LAST, data[1]);
        self.wg(ASSTATE_G::STAT_DEMAND_C_TOTAL_LAST, data[2]);
        self.wg(ASSTATE_G::STAT_DEMAND_P_TOTAL_LAST, data[3]);
    }

    pub fn initialize(&mut self, table_size_x: usize, table_size_y: usize) {
        self.setTableSize(table_size_x, table_size_y);
        self.setPlay(-1);
        self.setTick(0);
        self.setFrame(0);
        self.setTickSpeed(0);
        self.setChangeFirst(0);
        self.setChangeLast(0);
        for x in 0..table_size_x as i32 {
            for y in 0..table_size_y as i32 {
                let index = self.getIndex(x, y) as i32;
                self.clear(index);
                self.setChangeFlag(index, 0);
            }
        }
        self.setRoadTraversalStart(-1);
        self.setRoadTraversalCurrentIndex(-1);
        self.setRoadTraversalEdgeCount(-1);
    }

    pub fn getMaximumValue(&self) -> i32 {
        return std::i16::MAX as i32;
    }

    pub fn setTableSize(&mut self, size_x: usize, size_y: usize) {
        let total_size = ASSTATE_G::END as usize + size_x*size_y*ASSTATE_C::END as usize; //* Int32Array.BYTES_PER_ELEMENT;
        let empty_vec: Vec<i16> = vec![0;total_size];
        self.setRawDataVec(empty_vec);
        self.setTableSizeX(size_x as i16);
        self.setTableSizeY(size_y as i16);
    }

    pub fn getTableSizeX(&self) -> i16 {
        return self.rg(ASSTATE_G::SIZE_X);
    }
    
    pub fn setTableSizeX(&mut self, data: i16) {
        self.wg(ASSTATE_G::SIZE_X, data);
    }
    
    pub fn getTableSizeY(&self) -> i16 {
        return self.rg(ASSTATE_G::SIZE_Y);
    }
    
    pub fn setTableSizeY(&mut self, data: i16) {
        self.wg(ASSTATE_G::SIZE_Y, data);
    }

    pub fn isValidIndex(&self, index: i32) -> bool {
        //if (typeof index == 'undefined' || index == null)
        //{
        //    throw 'undefined index';
        //}
        let is_out_of_bound = index <= 0 || index > (self.getTableSizeX() as i32 * self.getTableSizeY() as i32);
        return !is_out_of_bound;
    }

    pub fn isValidCoordinates(&self, tile_x: i32, tile_y: i32) -> bool {
        let is_out_of_bound = tile_x < 0 || tile_x >= self.getTableSizeX() as i32 || tile_y < 0 || tile_y >= self.getTableSizeY() as i32;
        return !is_out_of_bound;
    }

    fn replaceChangeFirst(&mut self, new_index: i32) {
        self.setChangeFirst(new_index as i16);
        self.setChangeLast(new_index as i16);
        self.setChangeFlag(new_index, new_index as i16);
    }
    
    fn replaceChangeLast(&mut self, new_index: i32) {
        let last_index = self.getChangeLast() as i32;
        self.setChangeFlag(last_index, new_index as i16);
        self.setChangeFlag(new_index, new_index as i16);
        self.setChangeLast(new_index as i16);
    }

    pub fn notifyChange(&mut self, new_index: i32) {
        let first_index = self.getChangeFirst();
        if first_index > 0 {
            let middle_index = self.getChangeFlag(new_index);
            if middle_index > 0 && middle_index != new_index as i16 {
                
            } else {
                self.replaceChangeLast(new_index);
            }
        } else {
            self.replaceChangeFirst(new_index);
        }
    }

    pub fn retrieveChange(&mut self) -> i32 {
        let first_index = self.getChangeFirst();
        let last_index = self.getChangeLast();
        if first_index > 0 && last_index > 0 && first_index == last_index {
            self.setChangeFirst(0);
            self.setChangeLast(0);
            self.setChangeFlag(first_index as i32, 0);
        } else if first_index > 0 {
            let next_index = self.getChangeFlag(first_index as i32);
            self.setChangeFirst(next_index);
            /*if (G_CHECK && next_index == 0)
            {
                throw 'next_index 0';
            }*/
            self.setChangeFlag(first_index as i32, 0);
        }
        return first_index as i32;
    }

    pub fn getSerializable(&self) -> String {
        return stringify(self.cells.clone());
    }

    pub fn setSerializable(&mut self, string: String) {
        let _str: &str = string.as_str();
        let v: Vec<i16> = serde_json::from_str(_str).unwrap();
        self.setRawDataVec(v);
    }

    // Internal use
    fn setRawDataVec(&mut self, array: Vec<i16>) {
        self.cells = array;
    }

    pub fn setRawData(&mut self, array: Box<[i16]>, array_size: usize) {
        self.cells = vec![0; array_size];
        for i in 0..array_size {
            self.cells[i] = array[i];
        }
    }
}

#[repr(i16)]
enum C_TILE_ZONE {
    NONE = 0,
    DIRT = 10,
    PATH = 12,
    ROAD = 14,
    HIGHWAY = 16,
    RESLOW = 21,
    INDLOW = 24,
    COMLOW = 27,
    RESHIG = 23,
    INDHIG = 26,
    COMHIG = 29,
    POWLOW = 31,
}
impl C_TILE_ZONE {
    pub const DEFAULT: C_TILE_ZONE = C_TILE_ZONE::DIRT;
}

#[repr(i16)]
enum C_TILE_ROAD_CONGESTION {
    NONE = 100,
    LOW = 101,
    MID = 102,
    HIG = 103,
    VHI = 104
}


impl C_TILE_ZONE {
    pub fn C_TYPE_SPEED(&self) -> i32 {
        match &self {
            Self::PATH => 5,
            Self::ROAD => 14,
            Self::HIGHWAY => 25,
            _ => 0
        }
    }

    pub fn C_TYPE_LANE(&self) -> i32 {
        match &self {
            Self::PATH => 1,
            Self::ROAD => 1,
            Self::HIGHWAY => 3,
            _ => 0
        }
    }
}


impl ASROAD {
    const C_DEBUG_TRAVERSAL: bool = true;

    const C_DAY_DURATION: i32 = 3600; // s
    const C_TILE_LENGTH: i32 = 16; // m
    const C_MAX_SPEED: i32 = 50; // m / s
    const C_INTER_CAR: i32 = 1; // s
    const C_CAR_LENGTH: i32 = 4; // m

    const G_CHECK: bool = false;

    fn getRoadTypeEnum(&self, state: &ASSTATE, index: i32) -> C_TILE_ZONE {
        let zone_id = state.getZoneId(index);
        if zone_id == C_TILE_ZONE::PATH as i16 {
            return C_TILE_ZONE::PATH;
        }
        if zone_id == C_TILE_ZONE::ROAD as i16 {
            return C_TILE_ZONE::ROAD;
        }
        if zone_id == C_TILE_ZONE::HIGHWAY as i16 {
            return C_TILE_ZONE::HIGHWAY;
        }
        if Self::G_CHECK {
            // throw exception in which zone_id is not a road
        }
        return C_TILE_ZONE::NONE;
    }
}

#[wasm_bindgen]
impl ASROAD {
    pub fn new() -> ASROAD {
        return ASROAD {};
    }
    
    pub fn getRoadType(&self, state: &ASSTATE, index: i32) -> i16 {
        let zone_id = state.getZoneId(index);
        //let type = C_ZONE_ROAD[zone_id];
        /*if (G_CHECK && (type == null))
        {
            throw 'zone ' + zoneId + ' at ' + index + ' is not a road';
        }*/
        return zone_id;
    }
    
    pub fn changeDataIndex(&self, state: &mut ASSTATE, index: i32) {
        state.notifyChange(index);
    }
    
    pub fn changeTraversalIndex(&self, state: &mut ASSTATE, index: i32) {
        if Self::C_DEBUG_TRAVERSAL {
            state.notifyChange(index);
        }
    }

    pub fn getDataIdByCongestion(&self, state: &mut ASSTATE, x: i32, y: i32) -> i32 {
        if !state.isValidCoordinates(x, y) {
            return C_TILE_ROAD_CONGESTION::NONE as i32;
        }
        let index: i32 = state.getIndex(x, y) as i32;
        if !self.hasRoad(state, index) {
            return C_TILE_ROAD_CONGESTION::NONE as i32;
        }
        let ratio: f32 = 0.; //getRoadLastCarFlowRatio(index);
        if ratio < 0.5 {
            return C_TILE_ROAD_CONGESTION::LOW as i32;
        } else if ratio < 0.75 {
            return C_TILE_ROAD_CONGESTION::MID as i32;
        } else if ratio < 1. {
            return C_TILE_ROAD_CONGESTION::HIG as i32;
        } else if ratio >= 1. {
        	return C_TILE_ROAD_CONGESTION::VHI as i32;
        } else {
        	return C_TILE_ROAD_CONGESTION::NONE as i32;
        }
    }
    
    pub fn getDataIdByTraversalState(&self, state: &mut ASSTATE, x: i32, y: i32) -> i32 {
        if !state.isValidCoordinates(x, y) {
            return C_TILE_ROAD_CONGESTION::NONE as i32;
        }
        let index: i32 = state.getIndex(x, y) as i32;
        let value = if self.hasRoad(state, index) { state.getRoadDebug(index) } else { 0 };
        if (value >= 104) {
            return C_TILE_ROAD_CONGESTION::VHI as i32;
        }
        else if (value >= 103) {
            return C_TILE_ROAD_CONGESTION::HIG as i32; // in queue and processed
        }
        else if (value >= 102) {
            return C_TILE_ROAD_CONGESTION::MID as i32; // current
        }
        else if (value >= 101) {
        	return C_TILE_ROAD_CONGESTION::LOW as i32; // in queue
        }
        else if (value >= 0) {
        	return C_TILE_ROAD_CONGESTION::NONE as i32; // unexplored
        }
        else {
            return 0;
            //console.log('getTileByTraversalState error ' + index);
        }
    }
    
    /*pub fn getIndexTo(&self, x: i32, y: i32, d: i32)
    {
        const C_XOFFSET = [-1, 0, 1, 0, -2, 0, 2, 0];
        const C_YOFFSET = [0, -1, 0, 1, 0, -2, 0, 2];
        let xd = x + C_XOFFSET[d];
        let yd = y + C_YOFFSET[d];
        let to = ASSTATE.getIndex(xd, yd);
        return to;
    }*/

    pub fn hasRoad(&self, state: &mut ASSTATE, index: i32) -> bool {
        if !state.isValidIndex(index) {
            return false;
        }
        let zone_id: i16 = state.getZoneId(index);
        if zone_id == C_TILE_ZONE::PATH as i16 {
            return true;
        }
        if zone_id == C_TILE_ZONE::ROAD as i16 {
            return true;
        }
        if zone_id == C_TILE_ZONE::HIGHWAY as i16 {
            return true;
        }
        return false;
    }

    pub fn getRoadMaximumCarFlow(&self, state: &mut ASSTATE, index: i32) -> i32 {
        //LC * (TD - TL / TS) / (CL / SP + IC)
        let road_type_enum: C_TILE_ZONE = self.getRoadTypeEnum(state, index);
        let max_speed: i32 = road_type_enum.C_TYPE_SPEED();
        let lane_count: i32 = road_type_enum.C_TYPE_LANE();
        let max_flow = (lane_count as f32 * Self::C_DAY_DURATION as f32 / (Self::C_CAR_LENGTH as f32 / max_speed as f32 + Self::C_INTER_CAR as f32)) as i32;
        return max_flow;
    }

    pub fn getRoadSpeed(&self, state: &mut ASSTATE, index: i32) -> i32 {
        // LN * TL / TC / IC
        let road_type_enum: C_TILE_ZONE = self.getRoadTypeEnum(state, index);
        let max_speed: i32 = road_type_enum.C_TYPE_SPEED();
        let ratio: f32 = self.getRoadCarFlowRatio(state, index);
        return if ratio >= 1. { 0 } else { max_speed | 0 };
    }

    pub fn getRoadCarFlowRatio(&self, state: &mut ASSTATE, index: i32) -> f32 {
        let max_flow: i32 = self.getRoadMaximumCarFlow(state, index);
        let current_flow: i16 = state.getRoadCarFlow(index);
        let ratio: f32 = current_flow as f32 / max_flow as f32;
        return if ratio >= 1. { 1. } else { ratio };
    }
    
    pub fn getRoadLastCarFlowRatio(&self, state: &mut ASSTATE, index: i32) -> f32 {
        //let type = getRoadType(index);
        let max_flow: i32 = self.getRoadMaximumCarFlow(state, index);
        let last_flow: i16 = state.getRoadLastCarFlow(index);
        let ratio: f32 = last_flow as f32 / max_flow as f32;
        return if ratio >= 1. { 1. } else { ratio };
    }
    
    pub fn getRoadTrafficDecay(&self, state: &mut ASSTATE, index: i32) -> f32 {
        // LN / TF / IC * TD
        let road_type_enum: C_TILE_ZONE = self.getRoadTypeEnum(state, index);
        let lane_count = road_type_enum.C_TYPE_LANE();
        let car_flow: i16 = state.getRoadCarFlow(index);
        let decay: f32 = (lane_count as f32 / car_flow as f32 / Self::C_INTER_CAR as f32 * Self::C_DAY_DURATION as f32);
        return decay;
    }
}

#[cfg(test)]
mod test {

    #[test]
    fn basics() {
        assert_eq!(super::rustadd(1,2), 3);
    }
}