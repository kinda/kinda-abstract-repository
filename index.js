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
    this._cachedCollections = {};
    this.repository = this;
  });

  this.createCollection = function(name) {
    var collection = this._cachedCollections[name];
    if (collection) return collection;
    var klass = this.collectionClasses[name];
    if (!klass) {
      throw new Error('collection class \'' + name + '\' not found');
    }
    collection = klass.create();
    collection.setRepository(this);
    this._cachedCollections[name] = collection;
    return collection;
  };

  this.createCollectionFromItemClassName = function(name) {
    var collectionClassName = this._collectionClassNamesByItemClassName[name];
    if (!collectionClassName) {
      throw new Error('item class \'' + name + '\' not found');
    }
    return this.createCollection(collectionClassName);
  };
});

module.exports = KindaAbstractRepository;
