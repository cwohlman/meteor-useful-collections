var log = new Mongo.Collection('logs');

if (Meteor.isServer) Meteor.publish('logs', function () {return log.find();});
if (Meteor.isClient) Meteor.subscribe('logs');

var original = _books._collection.insert;
var Books = new UsefulCollection(_books);

if (Meteor.isServer) {
  log.remove({});

  // Books.hooks({
  //   "before.insert": function (doc) {
  //     log.insert({
  //       method: "insert"
  //       , where: "before"
  //       , logField: doc.logField
  //     });
  //   }
  // });

  UsefulCollection.hook(Books, "before.insert", function (doc) {
    log.insert({
      logField: doc.logField
    });
  });
}

if (Meteor.isClient) {
  Tinytest.addAsync('UsefulCollections - hooks - before insert', function (test, done) {
    Books.insert({logField: "a"}, function () {
      test.equal(log.find({logField: "a"}).count(), 1);
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