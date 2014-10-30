/**
 * Representation of "Lists"
 * @module List
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 * Bill Altermatt <altermattw@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var Variable, utils;

   utils = require('./utils');
   Variable = require('./variable');

   /**
    * Lists are essentially objects that can be accessed by array indexing as well.
    * One can remove a "property" from a list, which results in the other properties
    * shifting place.
    *
    * Indexing starts at 1.
    *
    * List Properties:
    * - Array of values.
    * - Object that holds names as keys and array indices as values.
    *
    * To create a list:
    * - object
    * - array of unnamed values
    * - with no argument, create empty list
    */
   function List(values) {
      if (!(this instanceof List)) { return new List(values); }
      if (Array.isArray(values)) {
         this.values = [utils.missing].concat(values);
         this._names = this.values.map(function() { return utils.missing; });
      } else {
         // Given an object. Need to populate array based on it
         this._names = [utils.missing].concat(Object.keys(values || {}));
         this.values = this._names.map(function(key) {
            return utils.isMissing(key) ? key : values[key];
         });
      }
   }

   List.prototype = Object.create({});

   /**
    * this.names();
    * this.names(i);
    * this.names(i, newName);  // newName is a string or null (or evals to missing)
    * this.names(newNames);    // Array or Variable of strings/nulls
    */
   List.prototype.names = function names(i, newNames) {
      if (arguments.length === 0) {
         return utils.allMissing(this._names) ? utils.missing
                                              : Variable.string(this._names.slice(1))
      }
      if (arguments.length > 1) {
         this._names[i] = newNames;
      } else { // one argument, `i`
         if (utils.isMissing(i)) {
            this._names = this.values.map(function() { return utils.missing; });
            return this;
         }
         if (i instanceof Variable) { i = i.asString().toArray(); }
         if (!Array.isArray(i)) { return this._names[i]; }
         if (i.length !== this.length()) {
            throw new Error('Incompatible names length');
         }
         this._names = [utils.missing].concat(i);
      }
      return this;
   };

   List.prototype.length = function length() {
      return this.values.length - 1;
   };

   /**
    * i can be:
    * - index
    * - string name
    * - null/missing (return the array of values)
    */
   List.prototype.get = function get(i) {
      if (utils.isMissing(i)) { return this.values.slice(1); }
      if (typeof i !== 'number') {
         i = this._names.indexOf(i);
         if (i === -1) { return utils.missing; }
      }
      return this.values[i];
   };

   /**
    * i can be:
    * - index:  If i > length of list, create new item at index i and fill the
    *           gap with missing
    * - string (name):  If i is not already a name in the list, append new item
    *                   with name `i`.  Else, update existing item with new value.
    * - object of name-value pairs (update existing, append new)
    * - array of values (append new)
    * val can be any sort of thing.
    * omit `val` if `i` is an object or array.
    */
   List.prototype.set = function set(i, val) {
      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number' || typeof i === 'string') {
         return this._set(i, val);
      }
      if (Array.isArray(i)) {
         i.forEach(function(v) {
            this._set(this.length() + 1, v);
         }.bind(this));
      } else {
         // i is an object
         Object.keys(i).forEach(function(key) {
            this._set(key, i[key]);
         }.bind(this));
      }
      return this;
   };

   // for setting exactly one value
   // `i` is a positive int or a name string
   // val is a thing
   List.prototype._set = function _set(i, val) {
      var name;
      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number') {
         i = Math.floor(i);
         if (i < 1) { throw new Error('cannot set at negative index: ' + i); }
         this.values[i] = val;
      } else {
         name = i;
         i = this._names.indexOf(name);
         if (i === -1) { // append
            i = this.length() + 1;
            this._names[i] = name;
         }
         this.values[i] = val;
      }
      return this;
   };

   /**
    * Delete the item in the `i` position (i integer or string)
    */
   List.prototype.delete = function _delete(i) {
    if (utils.isMissing(i)) { return this; }
    if (typeof i !== 'number') { i = this._names.indexOf(i); }
    if (i >= 1) {
      this.values.splice(i, 1);
      this._names.splice(i, 1);
    }
    return this;
   };

   /**
   * Takes a function `f(val, i, name)` and applies it to each value in this
   * list.  For any values with no associated name, `name` will be supplied as
   * `undefined`.
   */
   List.prototype.each = function each(f) {
      var i;
      for (i = 1; i <= this.length(); i += 1) {
         f(this.values[i], i, this._names[i]);
      }
      return this;
   };

   /**
    * Takes a function `f(acc, val, i, name)` and accumulates a return value.
    * For any values with no associated name, `name` will be supplied as
    * `undefined`.
    */
   List.prototype.reduce = function reduce(f, initial) {
      var i, acc;
      acc = initial;
      for (i = 1; i <= this.length(); i += 1) {
         acc = f(acc, this.values[i], i, this._names[i]);
      }
      return acc;
   };

   /**
    * Takes a function `f(val, i, name)` and applies it to each value in this
    * list to create a new list.  For any values with no associated name,
    * `name` will be supplied as `undefined`.
    */
   List.prototype.map = function map(f) {
      var arr;
      arr = [];
      this.each(function(val, i, name) {
         arr.push(f(val, i, name));
      });
      return (new List(arr)).names(this.names().toArray());
   };

 /**
    * Returns a new Variable without changing this List.
    * Works for values which are among the following (mixed ok):
    * - single value
    * - array
    * - Vector
    * - Variable
    * - List
    * Names are generated for the new Variable.  The general idea is
    * to preserve any names in this list and/or in the values of this
    * list in some reasonble way, wherever they exist.
    * - If variable with names, and list entry also named, join the names
    * - If variable with names, and list entry not named, use variable name
    * - If variable without names, and list entry named, provide lname.1, ...
    */
   List.prototype.toVariable = function toVariable() {
      var resolvedEntries;
      resolvedEntries = this.get().map(function(val, i) {
         if (val instanceof List) { return val.toVariable(); }
         if (val instanceof Variable) { return val.clone(); }
         if (val instanceof Variable.Vector ||
             Array.isArray(val)) { return new Variable(val); }
         // Single value. turn into a Variable
         return new Variable([val]);
      });
      resolvedEntries.forEach(function(val, i) {
         val.names(joinNames(this.names(i + 1),
                             val.names(),
                             val.length()));
      }.bind(this));
      return Variable.concat.apply(null, resolvedEntries);
   };

   /**
    * Unnests a number of levels out of a nested list, starting at the
    * top level. This operation changes the list in _in place_.
    * `levels` is the number of levels it will attempt to unnest.
    * Level 0 indicates no change. Default is 1.
    * Level Infinity indicates complete unnesting.
    */
   List.prototype.unnest = function unnest(levels) {
      var i;
      if (arguments.length === 0) { levels = 1; }
      if (levels === 0) { return this; }
      if (levels > 1) {
         this.each(function(e) {
            if (e instanceof List) { e.unnest(levels - 1); }
         });
      }
      for (i = this.length(); i > 0; i -= 1) {
         if (this.values[i] instanceof List) {
            [].splice.apply(this._names,
               [i, 1].concat(
                  joinNames(this._names[i],
                            this.values[i].names(),
                            this.values[i].length()
                  )
               )
            );
            [].splice.apply(this.values,
               [i, 1].concat(this.values[i].get())
            );
         }
      }
      return this;
   };


   /* Helper methods */
   function joinNames(itemName, valueNames, length) {
      if (utils.isMissing(itemName)) {
         return Variable.ensureArray(valueNames);
      }
      if (utils.isMissing(valueNames)) {
         if (length === 1) { return [itemName]; }
         valueNames = Variable.Vector.seq(length);
      }
      return Variable.ensureArray(valueNames)
                     .map(function(s) { return itemName + '.' + s; });
   }

   return List;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
