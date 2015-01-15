Tinytest.add('UsefulCollections - helpers - docs are instances of prototype', function (test) {
  var Books = new UsefulCollection(_books);
  
  test.instanceOf(Books.findOne(), Books.documentConstructor);
  test.instanceOf(Books.find()[0], Books.documentConstructor);
});

Tinytest.add('UsefulCollections - helpers - custom constructor', function (test) {
  var Books = new UsefulCollection(_books);
  
  var Book = function () {};
  Books.documentConstructor = Book;

  test.instanceOf(Books.findOne(), Book);
});
