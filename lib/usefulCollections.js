UsefulDocument = function () {};

// Write your package code here!
UsefulCollection = function (collection, options) {
  if (collection instanceof UsefulCollection)
    return UsefulCollection;

  if (collection instanceof Mongo.Collection) {
    this._mongoCollection = collection;
  } else {
    this._mongoCollection = new Mongo.Collection(collection, options);
  }

  this.setPrototype();

};

// We want users to be able to treat this as an ordinary mongo collection
// so here we attach all the Mongo.Collection.prototype methods

_.each(Mongo.Collection.prototype, function (val, key) {
  if (typeof val === "function") {
    UsefulCollection.prototype[key] = function () {
      return this._mongoCollection[key].apply(this._mongoCollection, arguments);
    };
  }
});

// This function just sets documentConstructor to proto, ensuring that proto is
// an instance of UsefulDocument. Pass 0 arguments to set documentConstructor
// to a new Constructor function (proto = function () {})

UsefulCollection.prototype.setPrototype = function(proto) {
  if (!proto) {
    // `var doc` is necessary to avoid the function being called 'proto' when
    // used as a constructor.
    var doc = function () {};
    proto = doc;
  }
  proto.prototype = new UsefulDocument();
  
  this.documentConstructor = proto;
};

// BEGIN MONKEY PATCH
// ========================
// We modify the _selectorIsIdPerhapsAsObject to permit ids as part of a client
// selector. This doesn't present security problems because the query will
// still only find/update a single document with the specified id
// e.g. we want to allow selectors like {_id: "123", kind: "public"}
var LocalCollection = Package.minimongo.LocalCollection;
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {
  return LocalCollection._selectorIsId(selector) ||
    (selector && typeof selector === "object" &&
     // old code:
     // selector._id && LocalCollection._selectorIsId(selector._id) &&
     // _.size(selector) === 1);
     // new code:
      selector._id && LocalCollection._selectorIsId(selector._id));
};
// =======================
// END MONKEY PATCH

// This function narrows a selector to only include documents from this
// collection in the case that the collection was created using a where call

UsefulCollection.prototype._mutateSelector = function (selector) {
  if (LocalCollection._selectorIsId(selector))
    selector = {_id: selector};
  return _.extend({}, selector, this._narrowingQuery);
};

UsefulCollection.prototype._mutateOptions = function (options) {
  var self = this;
  return _.extend({}, options, self._narrowingOptions, {
    transform: function (doc) {
      return _.extend(new self.documentConstructor(), doc);
    }
  });
};

// We need to override these fields to correctly mutate the selector argument
// "find", "findOne", "insert", "update", "remove", "upsert"

// we may need to modify the options on find and findOne
_.each(["find", "findOne"], function (key) {
  UsefulCollection.prototype[key] = function (selector, options, callback) {
    selector = this._mutateSelector(selector);
    options = this._mutateOptions(options);
    return this._mongoCollection[key](selector, options, callback);
  };
});

// we only need to modify the selector argument on the collection modify methods
_.each(["update", "remove", "upsert"], function (key) {
  UsefulCollection.prototype[key] = function (selector) {
    var args = _.toArray(arguments);
    args[0] = this._mutateSelector(selector);
    return this._mongoCollection[key].apply(this._mongoCollection, args);
  };
});

// XXX insert

// This function attaches functions to the documentConstructor prototype
// and also to the Collection itself

UsefulCollection.prototype.helpers = function (helpers) {
  var self = this;

  _.extend(self.documentConstructor.prototype, helpers);
  _.each(helpers, function (helper, key) {
    if (self[key])
      throw new Error('Helper already exists on collection');

    self[key] = function (doc) {
      var args = _.toArray(arguments).slice(1);

      if (!(doc instanceof self.documentConstructor))
        doc = _.extend(new self.documentConstructor(), doc);

      return doc[key].apply(doc, args);
    };
  });
};

// This function uses a null collection to mock the results of a db operation
// e.g. Books.mock({name: 'joe'}, {$set: {read: true}})
// returns {name: 'joe', read: true}

var mockCollection = new Mongo.Collection(null);

UsefulCollection.prototype.mock = function (insert, update, find) {
  var self = this;

  // clear out the mock collection in case an previous calls failed to clean
  // up after themselves
  mockCollection.remove({});

  if (!insert) {
    if (!_.isArray(update))
      throw new Error("implicit insert requires two update arguments");
    insert = self.findOne(update[0]);
  }
  if (!_.isArray(insert)) {
    insert = [insert];
  }

  var insertResult;
  if (insert && insert[0])
    insertResult = mockCollection.insert.apply(mockCollection, insert);

  if (update) {
    if (!_.isArray(update)) {
      update = [insertResult, update];
    }
    update[0] = self._mutateSelector(update[0]);
    var updateResult = mockCollection.update.apply(mockCollection, update);
  }

  if (!find) find = insertResult;

  if (!_.isArray(find)) {
    find = [find];
  }
  find[0] = self._mutateSelector(find[0]);
  find[1] = self._mutateOptions(find[1]);

  var findResult = mockCollection.findOne.apply(mockCollection, find);

  return findResult;
};

UsefulCollection.prototype.where = function (query, options) {
  var parent = this;
  var narrowedCollection = new UsefulCollection(parent._mongoCollection);
  narrowedCollection._narrowingQuery = _.extend({}, parent._narrowingQuery, query);
  narrowedCollection._narrowingOptions = _.extend({}, parent._narrowingOptions, options);
  narrowedCollection.documentConstructor = parent.documentConstructor;
  return narrowedCollection;
};

UsefulCollection.hook = function (collection, eventName, hook) {
  if (collection._narrowingQuery) {
    throw new Error('Hooks for narrowed collections are not yet implemented.');
  }
  var eventParts = eventName.split('.');
  var when = eventParts[0];
  var method = eventParts[1];

  if (when === "*")
    throw new Error('Wildcard for when is not supported');
  if (method === "*")
    throw new Error('Wildcard for method is not yet implemented');

  if (Meteor.isServer) {

    collection = collection._mongoCollection._collection;
    var self = collection["_useful_hook_" + method];
    if (!self) {
      var original = collection[method];
      self = Meteor.wrapAsync(function () {
        var args = _.toArray(arguments);
        _.each(self.before, function (hook) {
          hook.apply(collection, args);
        });
        var callback = args.pop();
        var originalArgs = args.concat();
        args.push(function (error, result) {
          if (result) {
            _.each(self.after, function (hook) {
              try {
                hook.apply(collection, originalArgs.concat([result]));
              } catch (e) {
                // XXX should we swallow this?
                // do we consider the operation to successful, or failed
                // the developer might expect side-effects from the after hook
                // to exist, or they might not...
                // It's really bad practice to write after hooks which can throw
                // errors.
                // error = new Error("Collection hook failed.");
                // error.details = e;
                error = e;
              }
            });
          }
          callback(error, result);
        });
        original.apply(collection, args);
      });
      self.before = [];
      self.after = [];
      collection[method] = self;
      collection["_useful_hook_" + method] = self;
    }

    if (when === "before") {
      self.before.push(hook);
    } else if (when === "after") {
      self.after.push(hook);
    } else {
      throw new Error("Unrecognized 'when' portion of hook selector.");
    }

    return self;
  } else {
    throw new Error("Client side hooks not yet implemented");
  }
};

UsefulCollection.prototype.hooks = function (hooks) {
  var self = this;
  _.each(hooks, function (hook, eventName) {
    UsefulCollection.hook(self, eventName, hook);
  });
};

var userId = function () {try {return Meteor.userId();} catch (e) {return null;}};

if (Meteor.isServer) {
  UsefulCollection.Logs = new Mongo.Collection('__cwohlman_audit_log');
  UsefulCollection.prototype.audit = function () {
    this.hooks({
      "before.insert": function (doc) {
        doc.dateCreated = new Date();
        if (!doc._id)
          doc._id = Random.id();

        UsefulCollection.Logs.insert({
          docId: doc._id
          , userId: userId()
          , operationType: 'insert'
          , timestamp: new Date()
        });
      }
      , "before.update": function (doc, modifier) {
        var fieldNames = _.chain(modifier)
          .map(function (a, key) {
            if (/^\$/.test(key)) {
              return _.keys(a);
            } else {
              return [key];
            }
          })
          .flatten()
          .value();

        if (_.any(modifier, function (a, key) {return /^\$/.test(key); })) {
          modifier.$set = modifier.$set || {};
          modifier.$set.dateUpdated = new Date();          
        } else if (_.keys(modifier).length) {
          modifier.dateUpdated = new Date();
        }

        UsefulCollection.Logs.insert({
          docId: doc._id
          , userId: userId()
          , operationType: 'update'
          , timestamp: new Date()
          , fields: fieldNames
        });
      }
      , "before.remove": function (doc) {
        doc = this.findOne(doc);
        UsefulCollection.Logs.insert({
          docId: doc._id
          , userId: userId()
          , operationType: 'remove'
          , timestamp: new Date()
          , oldDoc: doc
        });
      }
    });
  };
}
