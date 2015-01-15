var _books = new Mongo.Collection('books');

if (Meteor.isServer) {
  if (!_books.find().count()) {
    _books.insert({
      name: "Hucklberry Finn"
      , author: "Mark Twain"
      , genre: "fiction"
      , kind: "library"
    });
    _books.insert({
      name: "What's Wrong With the World"
      , author: "G K Chesterton"
      , genre: "religion"
      , kind: "personal"
    });
  }
  Meteor.publish('books', function () {
    return _books.find();
  });
} else {
  Meteor.subscribe('books');
}