#[no_mangle]
pub extern fn rustadd(a: usize, b:usize) -> usize {
    a+b
}

#[no_mangle]
pub extern fn rust_r(index: i32, field: i32) -> i32 {
    let target: i32 = if index == 0 { field } else { (index - 1)*11 + 30 + field };
    return target;
}

#[cfg(test)]
mod test {

    #[test]
    fn basics() {
        assert_eq!(super::rustadd(1,2), 3);
    }
}