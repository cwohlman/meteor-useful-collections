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

// This function narrows a selector to only include documents from this
// collection in the case that the collection was created using a where call

UsefulCollection.prototype._mutateSelector = function (selector) {
  return selector || {};
};

UsefulCollection.prototype._mutateOptions = function (options) {
  var self = this;
  options = options || {};
  options.transform = function (doc) {
    return _.extend(new self.documentConstructor(), doc);
  };
  return options;
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
// _.each(["insert", "update", "remove", "upsert"], function (key)
