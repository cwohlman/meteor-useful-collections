Tinytest.add('UsefulCollections - mock - simple update operation returns updated doc', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock(null, [{name: "Huckleberry Finn"}, {$set: {age: 10}}]);

  test.equal(mockedBook.name, "Huckleberry Finn");
  test.equal(mockedBook.age, 10);
});

Tinytest.add('UsefulCollections - mock - simple update operation returns instance of prototype', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock(null, [{name: "Huckleberry Finn"}, {$set: {age: 10}}]);

  test.instanceOf(Books.findOne(), Books.documentConstructor);
});

Tinytest.add('UsefulCollections - mock - update operation uses insert result', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock({name: "Joe"}, {$set: {age: 10}});

  test.equal(mockedBook.name, "Joe");
  test.equal(mockedBook.age, 10);
});

Tinytest.add('UsefulCollections - mock - combined insert and update operation', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock({name: "Joe"}, [{name: "Joe"}, {$set: {age: 10}}]);

  test.equal(mockedBook.name, "Joe");
  test.equal(mockedBook.age, 10);
});

Tinytest.add('UsefulCollections - mock - find query returns book', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock({name: "Joe"}, {$set: {age: 10}}, {age: 10});

  test.equal(mockedBook.name, "Joe");
  test.equal(mockedBook.age, 10);
});

Tinytest.add('UsefulCollections - mock - find query mismatch returns undefined', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock({name: "Joe"}, {$set: {age: 10}}, {age: 11});

  test.equal(mockedBook, undefined);
});

Tinytest.add('UsefulCollections - mock - update query mismatch returns undefined', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock(null, [{name: "Joe"}, {$set: {age: 10}}]);

  test.equal(mockedBook, undefined);
});

Tinytest.add('UsefulCollections - mock - update and find accept options', function (test) {
  var Books = new UsefulCollection(_books);
  
  var mockedBook = Books.mock(
    {name: "Sam"}, 
    [{name: "Joe"}, {$set: {age: 10, height: 10}}, {upsert: true}],
    [{name: "Joe"}, {fields: {name: 1, height: 1}}]
    );

  test.equal(mockedBook.name, "Joe");
  test.equal(mockedBook.height, 10);
  test.equal(mockedBook.age, undefined);
});
