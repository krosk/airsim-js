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

    fn getChangeFlag(&self, index: i32) -> i16 {
        return self.r(index, AsStateC::CHANGE as i32);
    }

    fn setChangeFlag(&mut self, index: i32, data: i16) {
        self.w(index, AsStateC::CHANGE as i32, data);
    }

    fn getChangeFirst(&self) -> i16 {
        return self.r(0, AsStateG::CHANGE_FIRST as i32);
    }
    
    fn setChangeFirst(&mut self, data: i16) {
        self.w(0, AsStateG::CHANGE_FIRST as i32, data);
    }
    
    fn getChangeLast(&self) -> i16 {
        return self.r(0, AsStateG::CHANGE_LAST as i32);
    }
    
    fn setChangeLast(&mut self, data: i16) {
        self.w(0, AsStateG::CHANGE_LAST as i32, data);
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