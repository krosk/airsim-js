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

#[wasm_bindgen]
pub struct AsState {
    cells: Vec<i16>, //dataStateView
}

enum AsStateC {
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

impl AsStateC {
    pub const PROPERTY_START: AsStateC = AsStateC::_5;

    pub const ROAD_CAR_FLOW: AsStateC = AsStateC::_5;
    pub const ROAD_CAR_LAST_FLOW: AsStateC = AsStateC::_6;
    pub const ROAD_TRAVERSAL_PROCESSED: AsStateC = AsStateC::_7;
    pub const ROAD_TRAVERSAL_COST: AsStateC = AsStateC::_8;
    pub const ROAD_TRAVERSAL_PARENT: AsStateC = AsStateC::_9;
    pub const ROAD_DEBUG: AsStateC = AsStateC::_10;

    pub const RICO_DENSITY_LEVEL: AsStateC = AsStateC::_5;
    pub const RICO_DEMAND_OFFER_R: AsStateC = AsStateC::_6;
    pub const RICO_DEMAND_OFFER_I: AsStateC = AsStateC::_7;
    pub const RICO_DEMAND_OFFER_C: AsStateC = AsStateC::_8;
    pub const RICO_DEMAND_OFFER_P: AsStateC = AsStateC::_9;
}

enum AsStateG {
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

#[wasm_bindgen]
impl AsState {
    pub fn new() -> AsState {
        let cells = Vec::new();
        AsState { cells }
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

    pub fn r(&self, index: i32, field: i32) -> i16 {
        let target: usize = (if index == 0 { field } else { (index - 1)*(AsStateC::END as i32) + (AsStateG::END as i32) + field }) as usize;
        return self.cells[target as usize];
        /*
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
        */
    }

    pub fn w(&mut self, index: i32, field: i32, data: i16) {
        let target: usize = (if index == 0 { field } else { (index - 1)*(AsStateC::END as i32) + (AsStateG::END as i32) + field }) as usize;
        self.cells[target] = data;
        /*
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
        */
    }

    pub fn clear(&mut self, index: i32) {
        if index == 0 {
            for i in 0..(AsStateG::END as usize) {
                self.cells[i] = 0;
            }
        }
        else
        {
            let target_base: usize = ((index - 1)*(AsStateC::END as i32) + (AsStateG::END as i32)) as usize;
            for i in 0..(AsStateC::END as usize)
            {
                self.cells[target_base + i] = 0;
            }
        }
    }

    pub fn clearProperties(&mut self, index: i32) {
        if index > 0 {
            let target_base: usize = ((index - 1)*(AsStateC::END as i32) + (AsStateG::END as i32)) as usize;
            for i in (AsStateC::PROPERTY_START as usize)..(AsStateC::END as usize) {
                self.cells[target_base + i] = 0;
            }
        }
    }

    pub fn getZoneId(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ZONE_ID as i32);
    }

    pub fn setZoneId(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ZONE_ID as i32, data);
    }

    pub fn getZoneRequest(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ZONE_REQUEST as i32);
    }

    pub fn setZoneRequest(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ZONE_REQUEST as i32, data);
    }

    pub fn getChangeFlag(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::CHANGE as i32);
    }

    pub fn setChangeFlag(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::CHANGE as i32, data);
    }

    pub fn getRoadConnected(&self, index: i32) -> bool {
        return self.r(index, AsStateC::ROAD_CONNECT as i32) > 0;
    }

    pub fn getRoadConnectTo(&self, index: i32, d: i32) -> i16 {
        let mask = 1 << d;
        return self.r(index, AsStateC::ROAD_CONNECT as i32) & mask;
    }

    pub fn setRoadConnectTo(&mut self, index: i32, d: i32) {
        let mask = 1 << d;
        let data = self.r(index, AsStateC::ROAD_CONNECT as i32) | mask;
        self.w(index, AsStateC::ROAD_CONNECT as i32, data);
    }

    pub fn setRoadDisconnectTo(&mut self, index: i32, d: i32) {
        let mask = !(1 << d);
        let data = self.r(index, AsStateC::ROAD_CONNECT as i32) & mask;
        self.w(index, AsStateC::ROAD_CONNECT as i32, data);
    }

    pub fn getDisplayId(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::DISPLAY_ID as i32);
    }

    pub fn setDisplayId(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::DISPLAY_ID as i32, data);
    }

    pub fn getRoadLastCarFlow(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_CAR_LAST_FLOW as i32);
    }
    
    pub fn setRoadLastCarFlow(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_CAR_LAST_FLOW as i32, data);
    }

    pub fn getRoadCarFlow(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_CAR_FLOW as i32);
    }
    
    pub fn setRoadCarFlow(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_CAR_FLOW as i32, data);
    }

    pub fn getRoadTraversalProcessed(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_TRAVERSAL_PROCESSED as i32);
    }
    
    pub fn setRoadTraversalProcessed(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_TRAVERSAL_PROCESSED as i32, data);
    }
    
    pub fn getRoadTraversalCost(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_TRAVERSAL_COST as i32);
    }
    
    pub fn setRoadTraversalCost(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_TRAVERSAL_COST as i32, data);
    }

    pub fn getRoadTraversalParent(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_TRAVERSAL_PARENT as i32);
    }
    
    pub fn setRoadTraversalParent(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_TRAVERSAL_PARENT as i32, data);
    }
    
    pub fn getRoadDebug(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::ROAD_DEBUG as i32);
    }
    
    pub fn setRoadDebug(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::ROAD_DEBUG as i32, data);
    }

    pub fn getRicoDemandOffer(&self, index: i32) -> Box<[i16]> {
        let dor = self.r(index, AsStateC::RICO_DEMAND_OFFER_R as i32);
        let doi = self.r(index, AsStateC::RICO_DEMAND_OFFER_I as i32);
        let doc = self.r(index, AsStateC::RICO_DEMAND_OFFER_C as i32);
        let dop = self.r(index, AsStateC::RICO_DEMAND_OFFER_P as i32);
        return Box::new([dor, doi, doc, dop]);
    }

    pub fn setRicoDemandOffer(&mut self, index: i32, demand_offer: Box<[i16]>)
    {
        self.w(index, AsStateC::RICO_DEMAND_OFFER_R as i32, demand_offer[0]);
        self.w(index, AsStateC::RICO_DEMAND_OFFER_I as i32, demand_offer[1]);
        self.w(index, AsStateC::RICO_DEMAND_OFFER_C as i32, demand_offer[2]);
        self.w(index, AsStateC::RICO_DEMAND_OFFER_P as i32, demand_offer[3]);
    }

    pub fn getRicoDensity(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::RICO_DENSITY_LEVEL as i32);
    }
    
    pub fn setRicoDensity(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::RICO_DENSITY_LEVEL as i32, data);
    }
    
    pub fn getBuildingData(&self, field: i32, index: i32) -> i16 {
        return self.r(index, field);
    }
    
    pub fn setBuildingData(&mut self, field: i32, index: i32, data: i16) {
        self.w(index, field, data);
    }
    
    pub fn getTick(&self) -> i16 {
        return self.r(0, AsStateG::TICK as i32);
    }
    
    pub fn setTick(&mut self, data: i16) {
        self.w(0, AsStateG::TICK as i32, data);
    }
    
    pub fn getTickSpeed(&self) -> i16 {
        return self.r(0, AsStateG::TICK_SPEED as i32);
    }
    
    pub fn setTickSpeed(&mut self, data: i16) {
        self.w(0, AsStateG::TICK_SPEED as i32, data);
    }
    
    pub fn getFrame(&self) -> i16 {
        return self.r(0, AsStateG::FRAME as i32);
    }
    
    pub fn setFrame(&mut self, data: i16) {
        self.w(0, AsStateG::FRAME as i32, data);
    }
    
    pub fn getPlay(&self) -> i16 {
        return self.r(0, AsStateG::PLAY as i32);
    }
    
    pub fn setPlay(&mut self, data: i16) {
        self.w(0, AsStateG::PLAY as i32, data);
    }
    
    pub fn getTickProgress(&self) -> i16 {
        return self.r(0, AsStateG::TICK_PROGRESS as i32);
    }
    
    pub fn setTickProgress(&mut self, data: i16) {
        self.w(0, AsStateG::TICK_PROGRESS as i32, data);
    }
    
    pub fn getRicoStep(&self) -> i16 {
        return self.r(0, AsStateG::RICO_STEP as i32);
    }
    
    pub fn setRicoStep(&mut self, data: i16) {
        self.w(0, AsStateG::RICO_STEP as i32, data);
    }
    
    pub fn getRoadTraversalStart(&self) -> i16 {
        return self.r(0, AsStateG::ROAD_TRAVERSAL_START as i32);
    }
    
    pub fn setRoadTraversalStart(&mut self, data: i16) {
        self.w(0, AsStateG::ROAD_TRAVERSAL_START as i32, data);
    }
    
    pub fn getRoadTraversalCurrentIndex(&self) -> i16  {
        return self.r(0, AsStateG::ROAD_TRAVERSAL_CURRENT_INDEX as i32);
    }
    
    pub fn setRoadTraversalCurrentIndex(&mut self, data: i16) {
        self.w(0, AsStateG::ROAD_TRAVERSAL_CURRENT_INDEX as i32, data);
    }
    
    pub fn getRoadTraversalEdgeCount(&self) -> i16 {
        return self.r(0, AsStateG::ROAD_TRAVERSAL_EDGE_COUNT as i32);
    }
    
    pub fn setRoadTraversalEdgeCount(&mut self, data: i16) {
        self.w(0, AsStateG::ROAD_TRAVERSAL_EDGE_COUNT as i32, data);
    }

    pub fn getChangeFirst(&self) -> i16 {
        return self.r(0, AsStateG::CHANGE_FIRST as i32);
    }
    
    pub fn setChangeFirst(&mut self, data: i16) {
        self.w(0, AsStateG::CHANGE_FIRST as i32, data);
    }
    
    pub fn getChangeLast(&self) -> i16 {
        return self.r(0, AsStateG::CHANGE_LAST as i32);
    }
    
    pub fn setChangeLast(&mut self, data: i16) {
        self.w(0, AsStateG::CHANGE_LAST as i32, data);
    }

    pub fn getRicoOfferTotal(&self) -> Box<[i16]> {
        let ro = self.r(0, AsStateG::STAT_OFFER_R_TOTAL as i32);
        let io = self.r(0, AsStateG::STAT_OFFER_I_TOTAL as i32);
        let co = self.r(0, AsStateG::STAT_OFFER_C_TOTAL as i32);
        let po = self.r(0, AsStateG::STAT_OFFER_P_TOTAL as i32);
        return Box::new([ro, io, co, po]);
    }

    pub fn setRicoOfferTotal(&mut self, data: Box<[i16]>) {
        self.w(0, AsStateG::STAT_OFFER_R_TOTAL as i32, data[0]);
        self.w(0, AsStateG::STAT_OFFER_I_TOTAL as i32, data[1]);
        self.w(0, AsStateG::STAT_OFFER_C_TOTAL as i32, data[2]);
        self.w(0, AsStateG::STAT_OFFER_P_TOTAL as i32, data[3]);
    }

    pub fn getRicoOfferTotalLast(&self) -> Box<[i16]> {
        let ro = self.r(0, AsStateG::STAT_OFFER_R_TOTAL_LAST as i32);
        let io = self.r(0, AsStateG::STAT_OFFER_I_TOTAL_LAST as i32);
        let co = self.r(0, AsStateG::STAT_OFFER_C_TOTAL_LAST as i32);
        let po = self.r(0, AsStateG::STAT_OFFER_P_TOTAL_LAST as i32);
        return Box::new([ro, io, co, po]);
    }

    pub fn setRicoOfferTotalLast(&mut self, data: Box<[i16]>) {
        self.w(0, AsStateG::STAT_OFFER_R_TOTAL_LAST as i32, data[0]);
        self.w(0, AsStateG::STAT_OFFER_I_TOTAL_LAST as i32, data[1]);
        self.w(0, AsStateG::STAT_OFFER_C_TOTAL_LAST as i32, data[2]);
        self.w(0, AsStateG::STAT_OFFER_P_TOTAL_LAST as i32, data[3]);
    }

    pub fn getRicoDemandTotal(&self) -> Box<[i16]> {
        let ro = self.r(0, AsStateG::STAT_DEMAND_R_TOTAL as i32);
        let io = self.r(0, AsStateG::STAT_DEMAND_I_TOTAL as i32);
        let co = self.r(0, AsStateG::STAT_DEMAND_C_TOTAL as i32);
        let po = self.r(0, AsStateG::STAT_DEMAND_P_TOTAL as i32);
        return Box::new([ro, io, co, po]);
    }
    
    pub fn setRicoDemandTotal(&mut self, data: Box<[i16]>) {
        self.w(0, AsStateG::STAT_DEMAND_R_TOTAL as i32, data[0]);
        self.w(0, AsStateG::STAT_DEMAND_I_TOTAL as i32, data[1]);
        self.w(0, AsStateG::STAT_DEMAND_C_TOTAL as i32, data[2]);
        self.w(0, AsStateG::STAT_DEMAND_P_TOTAL as i32, data[3]);
    }

    pub fn getRicoDemandTotalLast(&self) -> Box<[i16]> {
        let ro = self.r(0, AsStateG::STAT_DEMAND_R_TOTAL_LAST as i32);
        let io = self.r(0, AsStateG::STAT_DEMAND_I_TOTAL_LAST as i32);
        let co = self.r(0, AsStateG::STAT_DEMAND_C_TOTAL_LAST as i32);
        let po = self.r(0, AsStateG::STAT_DEMAND_P_TOTAL_LAST as i32);
        return Box::new([ro, io, co, po]);
    }
    
    pub fn setRicoDemandTotalLast(&mut self, data: Box<[i16]>) {
        self.w(0, AsStateG::STAT_DEMAND_R_TOTAL_LAST as i32, data[0]);
        self.w(0, AsStateG::STAT_DEMAND_I_TOTAL_LAST as i32, data[1]);
        self.w(0, AsStateG::STAT_DEMAND_C_TOTAL_LAST as i32, data[2]);
        self.w(0, AsStateG::STAT_DEMAND_P_TOTAL_LAST as i32, data[3]);
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
        let total_size = AsStateG::END as usize + size_x*size_y*AsStateC::END as usize; //* Int32Array.BYTES_PER_ELEMENT;
        let empty_vec: Vec<i16> = vec![0;total_size];
        self.setRawDataVec(empty_vec);
        self.setTableSizeX(size_x as i16);
        self.setTableSizeY(size_y as i16);
    }

    pub fn getTableSizeX(&self) -> i16 {
        return self.r(0, AsStateG::SIZE_X as i32);
    }
    
    pub fn setTableSizeX(&mut self, data: i16) {
        self.w(0, AsStateG::SIZE_X as i32, data);
    }
    
    pub fn getTableSizeY(&self) -> i16 {
        return self.r(0, AsStateG::SIZE_Y as i32);
    }
    
    pub fn setTableSizeY(&mut self, data: i16) {
        self.w(0, AsStateG::SIZE_Y as i32, data);
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
        stringify(self.cells.clone())
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

#[cfg(test)]
mod test {

    #[test]
    fn basics() {
        assert_eq!(super::rustadd(1,2), 3);
    }
}