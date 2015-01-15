Tinytest.add('UsefulCollections - helpers - findOne docs are instances of prototype', function (test) {
  var Books = new UsefulCollection(_books);
  
  test.instanceOf(Books.findOne(), Books.documentConstructor);
});

Tinytest.add('UsefulCollections - helpers - find Docs are instances of prototype', function (test) {
  var Books = new UsefulCollection(_books);
  
  test.instanceOf(Books.find().fetch()[0], Books.documentConstructor);
});

Tinytest.add('UsefulCollections - helpers - custom constructor', function (test) {
  var Books = new UsefulCollection(_books);
  
  var Book = function () {};
  Books.documentConstructor = Book;

  test.instanceOf(Books.findOne(), Book);
});

Tinytest.add('UsefulCollections - helpers - helpers extends constructor', function (test) {
  var Books = new UsefulCollection(_books);
  Books.helpers({
    page: function () {
      return 5;
    }
  });
  test.instanceOf(Books.findOne().page, Function);
  test.equal(Books.findOne().page(), 5);
});

Tinytest.add('UsefulCollections - helpers - helpers extends collection', function (test) {
  var Books = new UsefulCollection(_books);
  Books.helpers({
    page: function () {
      return 5;
    }
  });
  test.instanceOf(Books.page, Function);
  test.equal(Books.page({}), 5);
});
