'use strict';

let _ = require('lodash');
let KindaObject = require('kinda-object');
let KindaEventManager = require('kinda-event-manager');
let KindaLog = require('kinda-log');

let KindaAbstractRepository = KindaObject.extend('KindaAbstractRepository', function() {
  this.include(KindaEventManager);

  this.creator = function(options = {}) {
    if (!options.name) throw new Error('repository name is missing');
    if (!options.url) throw new Error('repository url is missing');
    if (!_.isArray(options.collections)) throw new Error('collectionClasses is invalid');

    let log = options.log;
    if (!KindaLog.isClassOf(log)) log = KindaLog.create(log);
    this.log = log;

    this.name = options.name;

    this.collectionClasses = {};
    this._collectionClassNamesByItemClassName = {};
    options.collections.forEach(klass => {
      let collectionClassName = klass.name;
      this.collectionClasses[collectionClassName] = klass;
      let itemClass = klass.prototype.Item;
      let itemClassName = itemClass.name;
      this._collectionClassNamesByItemClassName[itemClassName] = collectionClassName;
    });

    this.repository = this;
  };

  this.use = function(plugin) {
    plugin.plug(this);
  };

  this.createCollection = function(name, cache) {
    if (cache && name in cache) return cache[name];
    let klass = this.collectionClasses[name];
    if (!klass) {
      throw new Error(`collection class '${name}' not found`);
    }
    let collection = klass.create(this);
    if (cache) cache[name] = collection;
    return collection;
  };

  this.createCollectionFromItemClassName = function(name, cache) {
    let collectionClassName = this._collectionClassNamesByItemClassName[name];
    if (!collectionClassName) {
      throw new Error(`item class '${name}' not found`);
    }
    return this.createCollection(collectionClassName, cache);
  };

  Object.defineProperty(this, 'rootCollectionClass', {
    get() {
      if (this._rootCollectionClass) return this._rootCollectionClass;
      let rootCollectionClass;
      _.forOwn(this.collectionClasses, klass => {
        let itemPrototype = klass.prototype.Item.prototype;
        let itemClassNames = itemPrototype.classNames;
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
    }
  });

  this.createRootCollection = function() {
    return this.rootCollectionClass.create(this);
  };
});

module.exports = KindaAbstractRepository;
