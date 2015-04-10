if (Meteor.isServer) {
  var Books;
  var bookId;
  Tinytest.add('UsefulCollections - audit - audits inserts', function (test) {
    Books = new UsefulCollection(Random.id().replace(/[0-9]/, ''));
    Books.audit();
    bookId = Books.insert({
      name: "Man of the Family"
      , categories: ['western']
      , oldName: 'some old name'
    });
    var auditLog = UsefulCollection.Logs.findOne({
      docId: bookId
    });
    UsefulCollection.Logs.remove({});

    test.equal(auditLog.operationType, 'insert');
    test.equal(auditLog.userId, null);
    test.equal(auditLog.timestamp instanceof Date, true);

    var createdDoc = Books.findOne(bookId);

    test.equal(createdDoc.dateCreated instanceof Date, true);
  });
  Tinytest.add('UsefulCollections - audit - audits update', function (test) {
    var bookId = Books.findOne()._id;
    Books.update(bookId, {
      $set: {
        author: 'Ralph Moody'
      }
      , $push: {
        generes: 'fiction'
      }
      , $unset: {
        name: true
      }
      , $pull: {
        categories: 'western'
      }
      , $inc: {
        checkoutCount: 1
      }
      , $rename: {
        oldName: 'some new name'
      }
      , $min: {
        rating: 1
      }
      , $max: {
        age: 1
      }
      , $currentDate: {
        checkoutDate: true
      }
    });

    var auditLog = UsefulCollection.Logs.findOne({
      docId: bookId
    });
    UsefulCollection.Logs.remove({});

    test.equal(auditLog.operationType, 'update');
    test.equal(auditLog.userId, null);
    test.equal(auditLog.timestamp instanceof Date, true);
    test.equal(auditLog.fields, [
      'author'
      , 'generes'
      , 'name'
      , 'categories'
      , 'checkoutCount'
      , 'oldName'
      , 'rating'
      , 'age'
      , 'checkoutDate'
    ]);

    var updatedDoc = Books.findOne(bookId);

    test.instanceOf(updatedDoc.dateUpdated, Date);

    Books.update(bookId, {name: "Man of the Family"});

    auditLog = UsefulCollection.Logs.findOne({
      docId: bookId
    });
    UsefulCollection.Logs.remove({});
    test.equal(auditLog.fields, ["name"]);

  });
  Tinytest.add('UsefulCollections - audit - audits remove', function (test) {
    var book = Books.findOne(bookId);
    Books.remove(bookId);

    auditLog = UsefulCollection.Logs.findOne({
      docId: bookId
    });
    UsefulCollection.Logs.remove({});
    test.equal(auditLog.operationType, 'remove');
    test.equal(auditLog.userId, null);
    test.equal(auditLog.timestamp instanceof Date, true);
    test.equal(auditLog.oldDoc, book);
  });

} else {
  Tinytest.add('UsefulCollections - audit - exists only on server', function (test) {
    var Books = new UsefulCollection(Random.id().replace(/[0-9]/, ''));
    
    test.equal(typeof Books.audit, 'undefined');
  });
}
