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
         this._names = [null];
         this.values = [null].concat(values);
      } else {
         // Given an object. Need to populate array based on it
         this._names = [null].concat(Object.keys(values || {}));
         this.values = this._names.map(function(key) {
            return key === null ? null : values[key];
         });
      }
   }

   List.prototype = Object.create({});

   /**
    * this.names();
    * this.names(i);
    * this.names(i, newName);  // newName is a string or null (or evals to missing)
    * this.names(newNames);   // Array of strings/nulls of length equal to list length
    */
   List.prototype.names = function names(i, newNames) {
      if (arguments.length === 0) {
         return Variable.string(this._names.slice(1));
      }
      if (arguments.length > 1) {
         this._names[i] = newNames;
      } else { // one argument, `i`
         if (!Array.isArray(i)) { return this._names[i]; }
         if (i.length > this.length()) {
            throw new Error('Incompatible names length');
         }
         this._names = [null].concat(i);
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

   return List;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
