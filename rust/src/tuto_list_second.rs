
pub struct List<T> {
  head: Link<T>,
}

pub struct IntoIter<T>(List<T>);

// T used to be i32
struct Node<T> {
  elem: T,
  next: Link<T>
}

/*
enum Link {
  Empty,
  More(Box<Node>),
}
*/
// used to be 
//   Link::Empty => None
//   Link::More => Some
//   mem::replace => take
type Link<T> = Option<Box<Node<T>>>;

impl<T> List<T> {
  pub fn new() -> Self {
    List { head: None }
  }
  
  pub fn push(&mut self, elem: T) {
    let _new_node = Box::new(Node {
      elem: elem,
      next: self.head.take(),
    });
    
    self.head = Some(_new_node);
  }
  
  pub fn pop(&mut self) -> Option<T> {
    // match to map
    /*
    match self.head.take() {
      None => None,
      Some(_node) => {
        self.head = _node.next;
        Some(_node.elem)
      }
    }
    */
    self.head.take().map(|_node| {
      self.head = _node.next;
      _node.elem
    })
  }

  pub fn peek(&self) -> Option<&T> {
    // use as_ref (peek) instead of take (replace)
    self.head.as_ref().map(|_node| {
      &_node.elem
    })
  }

  pub fn peek_mut(&mut self) -> Option<&mut T> {
    self.head.as_mut().map(|_node| {
      &mut _node.elem
    })
  }

  pub fn into_iter(self) -> IntoIter<T> {
    IntoIter(self)
  }
}

impl<T> Iterator for IntoIter<T> {
  // trait Iterator requires Item and next
  type Item = T;
  fn next(&mut self) -> Option<Self::Item> {
    // access fields of a tuple struct numerically
    self.0.pop()
  }
}

impl<T> Drop for List<T> {
  fn drop(&mut self) {
    let mut _cur_link = self.head.take();
    while let Some(mut _boxed_node) = _cur_link {
      _cur_link = _boxed_node.next.take();
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
    
    list.push(5.);
    assert_eq!(list.pop(), Some(5.));
    
    list.push(3.);
    list.push(4.);
    assert_eq!(list.pop(), Some(4.));
    assert_eq!(list.pop(), Some(3.));
    assert_eq!(list.pop(), None);
  }

  #[test]
  fn peek() {
    let mut list = List::new();

    assert_eq!(list.peek(), None);
    assert_eq!(list.peek_mut(), None);

    list.push(1.); list.push(2.); list.push(3.);
    assert_eq!(list.peek(), Some(& 3.));
    assert_eq!(list.peek_mut(), Some(&mut 3.));

    // note: writing &mut value means "the argument is a mutable reference,
    // but just copy the value it points to into value"
    // note that type of value is &mut{float}, aka a reference/pointer
    list.peek_mut().map(|value| {
      *value = 42.
    });
  }

  #[test]
  fn into_iter() {
    let mut list = List::new();
    list.push(1.); list.push(2.); list.push(3.);

    let mut iter = list.into_iter();
    assert_eq!(iter.next(), Some(3.));
    assert_eq!(iter.next(), Some(2.));
    assert_eq!(iter.next(), Some(1.));
    assert_eq!(iter.next(), None);
  }
}