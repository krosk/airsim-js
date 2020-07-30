

use std::mem;

pub struct List {
  head: Link,
}

enum Link {
  Empty,
  More(Box<Node>),
}

// cannot implement the Drop trait
struct Node {
  elem: i32,
  next: Link,
}

impl List {
  pub fn new() -> Self {
    return Self { head: Link::Empty };
  }
  
  pub fn push(& mut self, _elem: i32) {
    // mut for self.head assignment
    let mut _boxed_node = Box::new(Node { 
      elem: _elem, 
      next: mem::replace(&mut self.head, Link::Empty),
    });
    // Box::new for Box creation
    // mem::replace at replaced value borrow, 
    // effective when first member has a new value
    self.head = Link::More(_boxed_node);
  }
  
  pub fn pop(& mut self) -> Option<i32> {
    // return type as option of type or None
    // non-None return value must use Some
    // When accessing _boxed_node, ownership is
    //   transferred here,
    //   hence need of &self.head
    // borrow of self.head made at match level, 
    //   mem::replace to be applied there
    //   and regular assignment made later
    /*match mem::replace(&mut self.head, Link::Empty) {
      Link::Empty => None,
      // _boxed_node is moved
      Link::More(_boxed_node) => {
        self.head = _boxed_node.next;
        return Some(_boxed_node.elem);
      },
    }*/
    // equivalent syntax to learn if let
    if let Link::More(_boxed_node) = mem::replace(&mut self.head, Link::Empty) {
      self.head = _boxed_node.next;
      return Some(_boxed_node.elem);
    }
    else {
      return None;
    }
  }
}

// >cargo test --target-dir ~/target -- --nocapture
// non-tail recursive drop structure
/*
impl Drop for Link {
  fn drop(&mut self) {
    println!("Dropping link");
  }
}

impl Drop for Node {
  fn drop(&mut self) {
    println!("Dropping node");
  }
}
*/
impl Drop for List {
  fn drop(&mut self) {
    println!("Dropping list");
    let mut _cur_link = mem::replace(&mut self.head, Link::Empty);
    // while let enum pattern is a curious syntax
    while let Link::More(mut _boxed_node) = _cur_link 
    {
      _cur_link = mem::replace(&mut _boxed_node.next, Link::Empty);
      println!("drop");
    }
  }
}


#[cfg(test)]
mod test {
  use super::List;
  #[test]
  fn basics() {
    let mut list = List::new(); // new requires impl
    // mut for push(& mut self)
    assert_eq!(list.pop(), None);
    
    list.push(5);
    assert_eq!(list.pop(), Some(5));
    assert_eq!(list.pop(), None);
    
    list.push(5);
    list.push(10);
    assert_eq!(list.pop(), Some(10));
    assert_eq!(list.pop(), Some(5));
    assert_eq!(list.pop(), None);
    
    list.push(5);
    list.push(10);
  }
}