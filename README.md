*This package is not designed for you to use - it's a collection of experiments*

Useful Collections
=====================

This is designed to be a simpler replacement for several other packages we currently use, plus a few other features I thought of. Packages I hope this will replace:

* matb33:collection-hooks
* dburles:collection-helpers
* cwohlman:audited-collections

Features
=====================
1. Simple, server-side-only collection hooks.
2. Simple, prototype based collection helpers.
3. Simple, extendable logging of collection updates.
4. Chainable find queries

The UsefulCollection object
======================
We want to implement all these features with a minimum of invasive code so we attach all of these functions to the prototype of a wrapper constructor:

```javascript
    UsefulCollection = function () {
        this._mongoCollection = new Mongo.Collection(arguments);
    }
    UsefulCollection.prototype.helpers = function () {
        //Code here
    }
    // etc.
```

**However...** we can't implement server-side hooks this way or they wouldn't get called when the client performs inserts/updates/removes, so we do (lazily) monkey patch the different modifier methods on a collection.

This constructor is easy to use, just call it the same way you would call Mongo.Collection, or you can pass an existing collection as the first argument and we'll wrap that.

The UsefulCollection prototype
======================
Once you've created a UsefulCollection you have access to all the methods below which we define on the prototype. You can also feel free to add your own methods to the UsefulCollection prototype.
- `UsefulCollection.prototype.hooks(hooks)` - Takes an object who's keys are the hooks to apply, hooks can have any of the following keys:
    - 'before.update'
    - 'after.update'
    - 'before.insert'
    - 'after.insert'
    - 'before.remove'
    - 'after.remove'
  Set any/all of these keys to a function and it will be called with exactly the arguments passed to the original method.
  The following two keys are also allowed, they will be called similar to the above methods, but with the method name prepended to the arguments array, e.g. (`update`, {_id: "x"}, {$set: {y: 5}})
    - 'before.*'
    - 'after.*'
  In a future version we may want to improve the way these callbacks are called.
- `UsefulCollection.prototype.helpers(helpers)` - Takes an object and attaches each key as a helper onto the collection item prototype, will also attach each helper to the collection itself by wrapping the function like so:

```javascript
    Item[key] = fn;
    Collection[key] = function (item/*, args */) {
        var args = _.toArray(arguments).slice(1);
        var item = _.extend(new Item(), item)
        return item[key].apply(item, args);
    }
```

  helpers will throw an error if the key exists on the Collection. In a future version we might want to add config options to define the behavior in these cases, for example we might allow passing a flag to signal only setting the helper on the item, or the collection

- `UsefulCollection.prototype.audit()` - Initializes the default audit function which:
    + Records dateCreated and dateModified on every document inserted or updated
    + Logs userId and dateCreated for every document inserted
    + Logs userId, dateModified, and fieldNames for every document modified
    + Logs userId and dateRemoved, and lastState for every document removed
- `UsefulCollection.prototype.audit("*")` - Initializes the default audit function, but records documents inserted and modifier objects for updates.
    + Overrides `audit()`, that is, if called either before or after `audit()` will always record more info.
    + Pass true for the second argument to throw an error in the above case.
- `UsefulCollection.prototype.audit(fieldName, fn)` - Calls fn and stores the result on inserted and updated documents as property fieldName.
    + Works regardless of whether `audit()` or `audit("*")` have been called.
    + fn is called with the same arguments as the 'before.*' hook
- `UsefulCollection.prototype.log(fieldName)` - Adds additional fields to be logged when auditing collection inserts and updates. e.g. `Collection.log('status')` will ensure that the status property of every document is logged when inserted or updated.
    + Has no effect if audit("*") has been called.
    + Has no effect if audit() has not been called.
    + pass true for the second argument to throw an error in either of the above cases.
- `UsefulCollection.prototype.log(fieldName, fn)` - Like `log(fieldName)` but allows you to specify a custom value to be logged. fn will be called with the same arguments as the 'after.*' hook.


There's an important difference between `audit(fieldName, fn)` and `log(fieldName, fn)`, audit stores a value on the document being modified, log stores the value in the log collection.

- `UsefulCollection.prototype.where(findQuery, findOptions)` - Returns a clone of this collection, but which wraps calls to find extending them with the query and options specified in the call to where.
    + We may also want to modify the way that insert and remove work -or-
    + We may want want to disallow insert and update operations which don't leave the item in the narrowed collection
    + Should also limit the query portion of an update command, eg.
        ```javascript
            Collection.where({kind: 'public'}).update({overdue: true}, {$set: {
                problem: true
            }})
            // is equivalent to
            Collection.update({
                kind: 'public'
                , overdue: true
            }, {
                $set: {
                    problem: true
                }
            });
        ```
    + This command is chainable, it returns a new instance of UsefulCollection
    + This command uses the documentConstructor from the parent instance of UsefulCollection, it is not recommended that you call .helpers on narrowed collections.
    + We run a shallow extend against both findQuery and findOptions. So this will not work `Collection.where({age: {$exists: true}}).where({age: {$gt: 21}})`. We should probably throw an exception in this case, but currently do not.

- `UsefulCollection.prototype.publish(name, whereFn)` - Publishes a meteor subscription called `name` which accepts some query options from the client.
    + If you subscribe to `name` all your arguments will be passed to the `whereFn`
    + The `whereFn` should return `this.where({}, {})` to narrow the collection however desired, e.g. `function (name) {return this.where({name: name})}`
    + If you subscribe to `name` you can pass an optional last argument with options for your query, the following options are accepted: 
        * `filter` - Pass this to filter the result set, takes a mongo query object
        * `sort` - Pass to sort the result set (remember server side sorting has no effect on the order of client side documents)
        * `limit` and `skip` - Pass to paginate the data
        * `fields` - Pass to limit the fields returned by the data.
    + All the above options work by passing them through to the underlying collection find method, transform is not supported because we perform the find on the server.
    + In the future this command will be valid on the client and we'll support another command `UsefulCollection.prototype.get(subscriptionName)` which returns only those documents which would have been returned by a particular subscription. (We'll be able to support the transform option as well)
- `UsefulCollection.prototype.publishAs(name)` - This method is available on both the client and the server, on the server it calls `this.publish(name, function () {return this;}`, on the client it records the name on the collection `this.defaultSubscription = name`
- `UsefulCollection.prototype.subscribe()` - Calls `Meteor.subscribe(this.defaultSubscription)`
- `UsefulCollection.prototype.mock(insert, update, find)` - Performs a mock operation against the db (using an unbacked local collection) allowing you to examine what an item will look like after an update operation.
    + Each argument can be an array, an object, or null/undefined.
    + When you pass an array we pass those arguments to the specified function.
    + If you pass null for the insert argument, we try to grab the findQuery part of the update argument and use that, e.g. `insert = this.findOne(update[0])`
    + If you pass null for update we won't perform an update operation
    + If you pass null for find we'll use the id of the doc you inserted.
    + If you pass an object for insert we insert that object
    + If you pass an object for update we treat that as the modifier argument to an update command
    + If you pass an object for find we treat that as the query argument to the find command.
    + Find queries are narrowed in the same way as find queries on the associated collection would be, to avoid this behaviour use UsefulCollection.mock which takes the same arguments.
    + If you pass null for the insert argument and the update argument returns multiple documents we will throw an error, since we don't support mocking multiple documents. This is to keep things simple and performance implications minimal.

Prototype Inheritance
======================

This package provides a convenient constructor function `UsefulDocument` which serves as the base for the helpers functionality. You can extend the prototype of UsefulDocument to add helpers to all UsefulCollection document instances, or inherit from UsefulDocument to get all those helpers on your own prototype.

Every instance of UsefulCollection has a property `Collection.documentConstructor` which is used as the constructor for all items in this collection. We set the documentConstructor to a default value so you don't have to write your own constructor if you don't want to:

```javascript
var Doc = function () {};
Doc.prototype = new UsefulDocument();
this.documentConstructor = Doc;
```

Each document returned by find or findOne is wrapped in this constructor so you have access to the helper functions from `Collection.helpers({...})`:

```javascript
// We always pass this transform property as part of the options to the 
// find or findOne call. We could pass it to the Collection constructor, but
// we don't always construct the Collection.
{
    transform: function (doc) {
        return _.extend(new Collection.documentConstructor(), doc);
    }
}
```

You can extend the documentConstructor by calling `Collection.helpers({some helpers...})` or you can set it to use your own constructor.

It is recommended that you do not accept any arguments to custom constructors you create. Instead define properties on the constructor prototype.




