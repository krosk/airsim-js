#[no_mangle]
pub extern fn rustadd(a: usize, b:usize) -> usize {
    a+b
}

#[cfg(test)]
mod test {
    
    #[test]
    fn basics() {
        assert_eq!(super::rustadd(1,2), 3);
    }
}