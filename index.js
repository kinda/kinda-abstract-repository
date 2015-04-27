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
    collectionClasses.forEach(function(klass) {
      this.collectionClasses[klass.getName()] = klass;
    }, this);
    this.repository = this;
  });

  this.createCollection = function(name) {
    var klass = this.collectionClasses[name];
    if (!klass) throw new Error('collection class \'' + name + '\' not found');
    var collection = klass.create();
    collection.setRepository(this);
    return collection;
  };
});

module.exports = KindaAbstractRepository;
