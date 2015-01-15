_books = new Mongo.Collection('books');


if (Meteor.isServer) {
  _books.remove({});
  _books.insert({
    name: "Huckleberry Finn"
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
  Meteor.publish('books', function () {
    return _books.find();
  });
  _books.allow({
    insert: function (userId, doc) {
      return true;
    },
    update: function (userId, doc, fields, modifier) {
      return true;
    },
    remove: function (userId, doc) {
      return true;
    }
  });
} else {
  Meteor.subscribe('books');
}