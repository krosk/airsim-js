/*pub enum List {
  Empty,
  Elem(i32, Box<List>)
}*/

use std::mem;

pub struct List {
  head: Link,
}

struct Node {
  elem: i32,
  next: Link
}

enum Link {
  Empty,
  More(Box<Node>),
}

impl List {
  pub fn new() -> Self {
    List { head: Link::Empty }
  }
  
  pub fn push(&mut self, elem: i32) {
    let _new_node = Box::new(Node {
      elem: elem,
      next: mem::replace(&mut self.head, Link::Empty),
    });
    
    self.head = Link::More(_new_node);
  }
  
  pub fn pop(&mut self) -> Option<i32> {
    match mem::replace(&mut self.head, Link::Empty) {
      Link::Empty => None,
      Link::More(_node) => {
        self.head = _node.next;
        Some(_node.elem)
      }
    }
  }
}

impl Drop for List {
  fn drop(&mut self) {
    let mut _cur_link = mem::replace(&mut self.head, Link::Empty);
    while let Link::More(mut _boxed_node) = _cur_link {
      _cur_link = mem::replace(&mut _boxed_node.next, Link:: Empty);
    }
  }
}

#[cfg(test)]
mod test {
  use super::List;
  #[test]
  fn basics() {
    let mut list = List::new();
    
    assert_eq!(list.pop(), None);
    
    list.push(5);
    assert_eq!(list.pop(), Some(5));
    
    list.push(3);
    list.push(4);
    assert_eq!(list.pop(), Some(4));
    assert_eq!(list.pop(), Some(3));
    assert_eq!(list.pop(), None);
  }
}