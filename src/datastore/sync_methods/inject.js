var DSUtils = require('../../utils');
var DSErrors = require('../../errors');
var observe = require('../../../lib/observe-js/observe-js');
var _compute = require('./compute')._compute;
var stack = 0;
var data = {
  injectedSoFar: {}
};

function _getReactFunction(DS, definition, resource) {
  return function _react(added, removed, changed, oldValueFn, firstTime) {
    var target = this;
    var item;
    var innerId = (oldValueFn && oldValueFn(definition.idAttribute)) ? oldValueFn(definition.idAttribute) : target[definition.idAttribute];

    DSUtils.forEach(definition.relationFields, function (field) {
      delete added[field];
      delete removed[field];
      delete changed[field];
    });

    if (!DSUtils.isEmpty(added) || !DSUtils.isEmpty(removed) || !DSUtils.isEmpty(changed) || firstTime) {
      item = DS.get(definition.name, innerId);
      resource.modified[innerId] = DSUtils.updateTimestamp(resource.modified[innerId]);
      resource.collectionModified = DSUtils.updateTimestamp(resource.collectionModified);
      if (definition.keepChangeHistory) {
        var changeRecord = {
          resourceName: definition.name,
          target: item,
          added: added,
          removed: removed,
          changed: changed,
          timestamp: resource.modified[innerId]
        };
        resource.changeHistories[innerId].push(changeRecord);
        resource.changeHistory.push(changeRecord);
      }
    }

    if (definition.computed) {
      item = item || DS.get(definition.name, innerId);
      DSUtils.forOwn(definition.computed, function (fn, field) {
        var compute = false;
        // check if required fields changed
        DSUtils.forEach(fn.deps, function (dep) {
          if (dep in added || dep in removed || dep in changed || !(field in item)) {
            compute = true;
          }
        });
        compute = compute || !fn.deps.length;
        if (compute) {
          _compute.call(item, fn, field, DSUtils);
        }
      });
    }

    if (definition.relations) {
      item = item || DS.get(definition.name, innerId);
      DSUtils.forEach(definition.relationList, function (def) {
        if (item[def.localField] && (def.localKey in added || def.localKey in removed || def.localKey in changed)) {
          DS.link(definition.name, item[definition.idAttribute], [def.relation]);
        }
      });
    }

    if (definition.idAttribute in changed) {
      console.error('Doh! You just changed the primary key of an object! ' +
        'I don\'t know how to handle this yet, so your data for the "' + definition.name +
        '" resource is now in an undefined (probably broken) state.');
    }
  };
}

function _inject(definition, resource, attrs, options) {
  var _this = this;
  var _react = _getReactFunction(_this, definition, resource, attrs, options);

  var injected;
  if (DSUtils.isArray(attrs)) {
    injected = [];
    for (var i = 0; i < attrs.length; i++) {
      injected.push(_inject.call(_this, definition, resource, attrs[i], options));
    }
  } else {
    // check if "idAttribute" is a computed property
    var c = definition.computed;
    var idA = definition.idAttribute;
    if (c && c[idA]) {
      var args = [];
      DSUtils.forEach(c[idA].deps, function (dep) {
        args.push(attrs[dep]);
      });
      attrs[idA] = c[idA][c[idA].length - 1].apply(attrs, args);
    }
    if (!(idA in attrs)) {
      var error = new DSErrors.R(definition.name + '.inject: "attrs" must contain the property specified by `idAttribute`!');
      console.error(error);
      throw error;
    } else {
      try {
        definition.beforeInject(definition.name, attrs);
        var id = attrs[idA];
        var item = _this.get(definition.name, id);

        if (!item) {
          if (options.useClass) {
            if (attrs instanceof definition[definition.class]) {
              item = attrs;
            } else {
              item = new definition[definition.class]();
            }
          } else {
            item = {};
          }
          resource.previousAttributes[id] = {};

          DSUtils.deepMixIn(item, attrs);
          DSUtils.deepMixIn(resource.previousAttributes[id], attrs);

          resource.collection.push(item);

          resource.changeHistories[id] = [];
          resource.observers[id] = new observe.ObjectObserver(item);
          resource.observers[id].open(_react, item);
          resource.index[id] = item;

          _react.call(item, {}, {}, {}, null, true);
        } else {
          DSUtils.deepMixIn(item, attrs);
          if (definition.resetHistoryOnInject) {
            resource.previousAttributes[id] = {};
            DSUtils.deepMixIn(resource.previousAttributes[id], attrs);
            if (resource.changeHistories[id].length) {
              DSUtils.forEach(resource.changeHistories[id], function (changeRecord) {
                DSUtils.remove(resource.changeHistory, changeRecord);
              });
              resource.changeHistories[id].splice(0, resource.changeHistories[id].length);
            }
          }
          resource.observers[id].deliver();
        }
        resource.saved[id] = DSUtils.updateTimestamp(resource.saved[id]);
        definition.afterInject(definition.name, item);
        injected = item;
      } catch (err) {
        console.error(err);
        console.error('inject failed!', definition.name, attrs);
      }
    }
  }
  return injected;
}

function _injectRelations(definition, injected, options) {
  var _this = this;

  function _process(def, relationName, injected) {
    var relationDef = _this.definitions[relationName];
    if (relationDef && injected[def.localField] && !data.injectedSoFar[relationName + injected[def.localField][relationDef.idAttribute]]) {
      try {
        data.injectedSoFar[relationName + injected[def.localField][relationDef.idAttribute]] = 1;
        injected[def.localField] = _this.inject(relationName, injected[def.localField], options);
      } catch (err) {
        console.error(definition.name + ': Failed to inject ' + def.type + ' relation: "' + relationName + '"!', err);
      }
    } else if (options.findBelongsTo && def.type === 'belongsTo') {
      if (DSUtils.isArray(injected)) {
        DSUtils.forEach(injected, function (injectedItem) {
          _this.link(definition.name, injectedItem[definition.idAttribute], [relationName]);
        });
      } else {
        _this.link(definition.name, injected[definition.idAttribute], [relationName]);
      }
    } else if ((options.findHasMany && def.type === 'hasMany') || (options.findHasOne && def.type === 'hasOne')) {
      if (DSUtils.isArray(injected)) {
        DSUtils.forEach(injected, function (injectedItem) {
          _this.link(definition.name, injectedItem[definition.idAttribute], [relationName]);
        });
      } else {
        _this.link(definition.name, injected[definition.idAttribute], [relationName]);
      }
    }
  }

  DSUtils.forEach(definition.relationList, function (def) {
    if (DSUtils.isArray(injected)) {
      DSUtils.forEach(injected, function (injectedI) {
        _process(def, def.relation, injectedI);
      });
    } else {
      _process(def, def.relation, injected);
    }
  });
}

function inject(resourceName, attrs, options) {
  var _this = this;
  var definition = _this.definitions[resourceName];

  options = options || {};

  if (!definition) {
    throw new DSErrors.NER(resourceName);
  } else if (!DSUtils.isObject(attrs) && !DSUtils.isArray(attrs)) {
    throw new DSErrors.IA(resourceName + '.inject: "attrs" must be an object or an array!');
  } else if (!DSUtils.isObject(options)) {
    throw new DSErrors.IA('"options" must be an object!');
  }
  var injected;

  stack++;

  try {
    if (!('useClass' in options)) {
      options.useClass = definition.useClass;
    }
    injected = _inject.call(_this, definition, _this.store[resourceName], attrs, options);
    if (definition.relations) {
      _injectRelations.call(_this, definition, injected, options);
    }

    if (options.linkInverse) {
      if (DSUtils.isArray(injected) && injected.length) {
        _this.linkInverse(definition.name, injected[0][definition.idAttribute]);
      } else {
        _this.linkInverse(definition.name, injected[definition.idAttribute]);
      }
    }

    _this.notify(definition, 'inject', injected);

    stack--;
  } catch (err) {
    stack--;
    throw err;
  }

  if (!stack) {
    data.injectedSoFar = {};
  }

  return injected;
}

module.exports = inject;
