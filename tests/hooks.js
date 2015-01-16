var log = new Mongo.Collection('logs');

if (Meteor.isServer) Meteor.publish('logs', function () {return log.find();});
if (Meteor.isClient) Meteor.subscribe('logs');

var original = _books._collection.insert;

if (Meteor.isServer) {
  log.remove({});

  console.log('is local collection', _books._collection)

  _books._collection.insert = function (doc) {
    console.log('logging', doc.logField);

    if (this !== log)
      log.insert({logField: doc.logField});

    return original.apply(this, arguments);
  };
}

if (Meteor.isClient) {
  Tinytest.addAsync('test test', function (test, done) {
    _books.insert({logField: "logged"}, function () {
      test.equal(log.find({logField: "logged"}).count(), 1);
      done();
    });
  });
}

// Tinytest.add('UsefulCollections - hooks - before update', function (test) {
//   var Books = new UsefulCollection(_books);

//   var hookWasRun = false;
//   Books.hooks({
//     "before.update": function () {
//       hookWasRun = true;
//     }
//   });

//   Books.update(Books.findOne()._id, {
//     $set: {
//       "before update hook": true
//     }
//   });
  
//   test.isTrue(hookWasRun);
// });