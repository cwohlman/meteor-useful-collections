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

Tinytest.addAsync('UsefulCollections - where - narrows update', function (test, done) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  });
  
  LibraryBooks.update(
    Meteor.isServer ? {} : {
      _id: _books.findOne({kind: {$ne: "library"}})._id
  }, {
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
    test.equal(result, Meteor.isServer ? 1 : 0);
    done();
  });
});

if (Meteor.isServer) {
  Tinytest.add('UsefulCollections - where - narrows remove multi', function (test) {
    _books.insert({
      kind: "library"
      , genre: "a"
    });
    _books.insert({
      kind: "personal"
      , genre: "a"
    });
    var LibraryBooks = new UsefulCollection(_books).where({
      kind: "library"
    });

    test.equal(LibraryBooks.remove({genre: "a"}), 1);
    test.equal(_books.remove({genre: "a"}), 1);
  });
}

Tinytest.addAsync('UsefulCollections - where - narrows remove', function (test, done) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  });
  
  LibraryBooks.remove({
      _id: _books.findOne({kind: {$ne: "library"}})._id
  }, function (error, result) {
    try {
      if (error) {
        test.fail({
            type: 'error'
            , message: error.toString()
          });
      }
      test.equal(result, 0);

    } finally {
      done();
    }
  });
});

Tinytest.add('UsefulCollections - where - narrowed collection returns instances of parent prototype', function (test) {
  var Books = new UsefulCollection(_books);

  var LibraryBooks = Books.where({
    kind: "library"
  });
  
  test.instanceOf(LibraryBooks.findOne({
    genre: "fiction"
  }), Books.documentConstructor);
});

if (Meteor.isServer) {
  Tinytest.add('UsefulCollections - where - extends queries through the chain', function (test) {
    _books.insert({
      kind: "library"
      , genre: "b"
    });

    var LibraryBooks = new UsefulCollection(_books).where({
      kind: "library"
    });
    var GenreBooks = LibraryBooks.where({
      genre: "b"
    });
    
    test.equal(LibraryBooks.find().count(), 2);
    test.equal(GenreBooks.find().count(), 1);

    _books.remove({genre: "b"});
  });  
}

Tinytest.add('UsefulCollections - where - extends options', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  }, {
    fields: {
      genre: true
    }
  });
  
  test.equal(!!LibraryBooks.findOne().genre, true);
  test.equal(!!LibraryBooks.findOne().name, false);
});

Tinytest.add('UsefulCollections - where - extends options through the chain', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  }, {
    fields: {
      genre: true
    }
  });
  var GenreBooks = LibraryBooks.where({}, {
    fields: {
      genre: true
      , kind: true
    }
  });
  
  test.equal(!!GenreBooks.findOne().genre, true);
  test.equal(!!GenreBooks.findOne().name, false);
  test.equal(!!GenreBooks.findOne().kind, true);
});

Tinytest.add('UsefulCollections - where - extends prototype through the chain', function (test) {
  var LibraryBooks = new UsefulCollection(_books).where({
    kind: "library"
  }, {
    fields: {
      genre: true
    }
  });
  var GenreBooks = LibraryBooks.where().where();
  
  test.instanceOf(GenreBooks.findOne(), LibraryBooks.documentConstructor);
});



