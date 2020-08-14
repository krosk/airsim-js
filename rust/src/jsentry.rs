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

    fn replaceChangeFirst(&mut self, newIndex: i32) {
        self.setChangeFirst(newIndex as i16);
        self.setChangeLast(newIndex as i16);
        self.setChangeFlag(newIndex, newIndex as i16);
    }
    
    fn replaceChangeLast(&mut self, newIndex: i32) {
        let lastIndex = self.getChangeLast() as i32;
        self.setChangeFlag(lastIndex, newIndex as i16);
        self.setChangeFlag(newIndex, newIndex as i16);
        self.setChangeLast(newIndex as i16);
    }

    pub fn notifyChange(&mut self, newIndex: i32) {
        let firstIndex = self.getChangeFirst();
        if firstIndex > 0 {
            let middleIndex = self.getChangeFlag(newIndex);
            if middleIndex > 0 && middleIndex != newIndex as i16 {
                
            } else {
                self.replaceChangeLast(newIndex);
            }
        } else {
            self.replaceChangeFirst(newIndex);
        }
    }

    pub fn retrieveChange(&mut self) -> i32 {
        let firstIndex = self.getChangeFirst();
        let lastIndex = self.getChangeLast();
        if firstIndex > 0 && lastIndex > 0 && firstIndex == lastIndex {
            self.setChangeFirst(0);
            self.setChangeLast(0);
            self.setChangeFlag(firstIndex as i32, 0);
        } else if firstIndex > 0 {
            let nextIndex = self.getChangeFlag(firstIndex as i32);
            self.setChangeFirst(nextIndex);
            /*if (G_CHECK && nextIndex == 0)
            {
                throw 'nextIndex 0';
            }*/
            self.setChangeFlag(firstIndex as i32, 0);
        }
        return firstIndex as i32;
    }

    pub fn getSerializable(&self) -> String {
        stringify(self.cells.clone())
    }

    pub fn setRawDataSize(&mut self, array_size: usize) {
        self.cells = vec![0; array_size];
    }

    pub fn setRawDataValue(&mut self, index: i32, value: i16) {
        self.cells[index as usize] = value;
    }
}

#[cfg(test)]
mod test {

    #[test]
    fn basics() {
        assert_eq!(super::rustadd(1,2), 3);
    }
}