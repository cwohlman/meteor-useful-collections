var log = new Mongo.Collection('logs');

if (Meteor.isServer) Meteor.publish('logs', function () {return log.find();});
if (Meteor.isClient) Meteor.subscribe('logs');

var original = _books._collection.insert;
var Books = new UsefulCollection(_books);

if (Meteor.isServer) {
  log.remove({});

  Books.hooks({
    "before.insert": function (doc) {
      log.insert({
        method: "insert"
        , where: "before"
        , logField: doc.logField
      });
    }
    , "before.update": function (query, modifier) {
      if (modifier && modifier.$set && modifier.$set.logField){
        log.insert({
          method: "update"
          , where: "before"
          , logField: modifier.$set.logField
        });
      }
    }
    , "before.remove": function (query) {
      log.insert({
        method: "remove"
        , where: "before"
        , logField: query._id
      });
    }
    , "after.insert": function (doc) {
      log.insert({
        method: "insert"
        , where: "after"
        , logField: doc.logField
      });
    }
    , "after.update": function (query, modifier) {
      if (modifier && modifier.$set && modifier.$set.logField){
        log.insert({
          method: "update"
          , where: "after"
          , logField: modifier.$set.logField
        });
      }
    }
    , "after.remove": function (query) {
      log.insert({
        method: "remove"
        , where: "after"
        , logField: query._id
      });
    }
  });
}

var logField;

Tinytest.addAsync('UsefulCollections - hooks - before insert', function (test, done) {
  logField = Random.id();
  Books.insert({logField: logField}, function () {
    test.equal(log.find({logField: logField, method: "insert", where: "before"}).count(), 1);
    done();
  });
});

Tinytest.add('UsefulCollections - hooks - after insert', function (test) {
  test.equal(log.find({
    logField: logField
    , where: 'after'
    , method: 'insert'
  }).count(), 1);
});

Tinytest.addAsync('UsefulCollections - hooks - before update', function (test, done) {
  logField = Random.id();
  var doc = Books.findOne({logField: {$exists: true}});
  Books.update(doc._id, {$set:{logField: logField}}, function () {
    test.equal(log.find({logField: logField, method: "update", where: "before"}).count(), 1);
    done();
  });
});

Tinytest.add('UsefulCollections - hooks - after update', function (test) {
  test.equal(log.find({
    logField: logField
    , where: 'after'
    , method: 'update'
  }).count(), 1);
});

var docRemoved;

Tinytest.addAsync('UsefulCollections - hooks - before remove', function (test, done) {
  logField = Random.id();
  docRemoved = Books.findOne({logField: {$exists: true}});
  Books.remove(docRemoved._id, function () {
    test.equal(log.find({
      logField: docRemoved._id
      , method: "remove"
      , where: "before"
    }).count(), 1);
    done();
  });
});

Tinytest.add('UsefulCollections - hooks - after remove', function (test) {
  test.equal(log.find({
    logField: docRemoved._id
    , where: 'after'
    , method: 'remove'
  }).count(), 1);
});

if (Meteor.isServer) {
  Tinytest.addAsync('UsefulCollections - hooks - survives monkey patch', function (test, done) {
    var original = _books._collection.insert;
    var patch;
    logField = Random.id();

    _books._collection.insert = patch = function (doc) {
      return original.apply(_books._collection, arguments);
    };
    Books.hooks({
      "before.insert": function (doc) {
        log.insert({
          logField: doc.logField
          , method: "mokeypatch"
          , where: "before"
        });
      }
      , "after.insert": function (doc) {
        log.insert({
          logField: doc.logField
          , method: "mokeypatch"
          , where: "after"
        });
      }
    });
    test.equal(_books._collection.insert, patch);
    Books.insert({logField: logField}, function () {
      test.equal(log.find({logField: logField, method: "mokeypatch", where: "before"}).count(), 1);
      test.equal(log.find({logField: logField, method: "mokeypatch", where: "after"}).count(), 1);
      done();
    });
  });
  Tinytest.addAsync('UsefulCollections - hooks - patches users collection', function (test, done) {
    var original = _books._collection.insert;
    var patch;
    logField = Random.id();
    var Users = new UsefulCollection(Meteor.users);
    Users.hooks({
      "before.insert": function (doc) {
        log.insert({
          logField: doc.logField
          , method: "users"
          , where: "before"
        });
      }
      , "after.insert": function (doc) {
        log.insert({
          logField: doc.logField
          , method: "users"
          , where: "after"
        });
      }
    });
    Users.insert({logField: logField}, function () {
      test.equal(log.find({logField: logField, method: "users", where: "before"}).count(), 1);
      test.equal(log.find({logField: logField, method: "users", where: "after"}).count(), 1);
      Users.remove({logField: logField});
      done();
    });
  });
}