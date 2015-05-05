"use strict";

var _ = require('lodash');
var KindaObject = require('kinda-object');

var KindaAbstractRepository = KindaObject.extend('KindaAbstractRepository', function() {
  this.setCreator(function(name, url, collectionClasses, options) {
    if (!name) throw new Error('name is missing');
    if (!url) throw new Error('url is missing');
    if (!_.isArray(collectionClasses)) throw new Error('collectionClasses is invalid');
    if (!options) options = {};
    this.name = name;
    this.collectionClasses = {};
    this._collectionClassNamesByItemClassName = {};
    collectionClasses.forEach(function(klass) {
      var collectionClassName = klass.getName();
      this.collectionClasses[collectionClassName] = klass;
      var itemClass = klass.getPrototype().Item;
      var itemClassName = itemClass.getName();
      this._collectionClassNamesByItemClassName[itemClassName] = collectionClassName;
    }, this);
    this.repository = this;
  });

  this.use = function(plugin) {
    plugin.plug(this);
  };

  this.createCollection = function(name, cache) {
    if (cache && name in cache) return cache[name];
    var klass = this.collectionClasses[name];
    if (!klass) {
      throw new Error('collection class \'' + name + '\' not found');
    }
    var collection = this._createCollection(klass);
    if (cache) cache[name] = collection;
    return collection;
  };

  this._createCollection = function(klass) {
    var collection = klass.create();
    collection.setRepository(this);
    return collection;
  }

  this.createCollectionFromItemClassName = function(name, cache) {
    var collectionClassName = this._collectionClassNamesByItemClassName[name];
    if (!collectionClassName) {
      throw new Error('item class \'' + name + '\' not found');
    }
    return this.createCollection(collectionClassName, cache);
  };

  this.getRootCollectionClass = function() {
    if (this._rootCollectionClass) return this._rootCollectionClass;
    var rootCollectionClass;
    _.forOwn(this.collectionClasses, function(klass) {
      var itemPrototype = klass.getPrototype().Item.getPrototype();
      var itemClassNames = itemPrototype.getClassNames();
      if (itemClassNames.length === 1) { // TODO: find out a cleaner way
        if (rootCollectionClass) {
          throw new Error('more than one root collection class found');
        }
        rootCollectionClass = klass;
      }
    });
    if (!rootCollectionClass) {
      throw new Error('root collection class not found');
    }
    this.repository._rootCollectionClass = rootCollectionClass;
    return rootCollectionClass;
  };

  this.createRootCollection = function() {
    var klass = this.getRootCollectionClass();
    return this._createCollection(klass);
  };
});

module.exports = KindaAbstractRepository;
