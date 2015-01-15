Tinytest.add('UsefulCollections - where - narrows collection', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  });
  
  test.equal(LibraryBooks.find().count(), 1);
});

Tinytest.add('UsefulCollections - where - narrows find', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  });
  
  test.equal(LibraryBooks.find({
    genre: "fiction"
  }).count(), 1);
  test.equal(LibraryBooks.find({
    genre: "religion"
  }).count(), 0);
});

Tinytest.add('UsefulCollections - where - narrows findOne', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  });
  
  test.equal(!!LibraryBooks.findOne({
    genre: "fiction"
  }), true);
  test.equal(!!LibraryBooks.findOne({
    genre: "religion"
  }), false);
});

if (Meteor.isServer) {
  Tinytest.addAsync('UsefulCollections - where - narrows update', function (test, done) {
    var LibraryBooks = new UsefulCollection(_books).where({
      kind: "library"
    });
    
    LibraryBooks.update({}, {
      $set: {
        "narrows update server": true
      }
    }, {
      multi: true
    }, function (error, result) {
      if (error) {
        test.fail({
            type: 'error'
            , message: error.toString()
          });
      }
      test.equal(result, 1);
      done();
    });
  });
} else {
  Tinytest.addAsync('UsefulCollections - where - narrows update', function (test, done) {
    var LibraryBooks = new UsefulCollection(_books).where({
      kind: "library"
    });
    
    LibraryBooks.update({
      _id: _books.findOne({kind: {$ne: "library"}})._id
    }, {
      $set: {
        "narrows update client": true
      }
    }, function (error, result) {
      if (error) {
        test.fail({
            type: 'error'
            , message: error.toString()
          });
      }
      test.equal(result, 0);
      done();
    });
  });
}
