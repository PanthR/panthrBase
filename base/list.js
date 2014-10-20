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
      this._namesObj = {};
      this._namesArr = [null];
      if (Array.isArray(values)) {
         this.values = values;
         this.values.unshift(null);
      } else {
         // Given an object. Need to populate array based on it
         this.values = [null];
         Object.keys(values || {}).forEach(function(key) {
            this.values.push(values[key]);
            this._namesObj[key] = this._namesArr.length;
            this._namesArr.push(key);
         }.bind(this));
      }
   }

   List.prototype = Object.create({});

   /**
    * this.names();
    * this.names(i);
    * this.names(i, newName);  // newName is a string or null (or evals to missing)
    * this.names(newNames);   // Array of strings/nulls of length equal to list length
    */
   List.prototype.names = function names(newNames) {
      var i;
      if (arguments.length === 0) {
         return Variable.string(this._namesArr.slice(1));
      } else if (arguments.length > 1) {
         i = newNames;
         newNames = arguments[1];
         delete this._namesObj[this._namesArr[i]];
         this._namesObj[newNames] = i;
         this._namesArr[i] = newNames;
      } else {
         if (!Array.isArray(newNames)) {
            return this._namesArr[newNames];
         }
         if (newNames.length !== this.length()) {
            throw new Error('Incompatible names length');
         }
         this._namesArr = [null];
         this._namesObj = {};
         newNames.forEach(function(key) {
            this._namesObj[key] = this._namesArr.length;
            this._namesArr.push(key);
         }.bind(this));
         return this;
      }
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
      if (arguments.length === 0) { return this.values.slice(1); }
      if (typeof i === 'number') { return this.values[i]; }
      return this._namesObj.hasOwnProperty(i) ?
               this.values[this._namesObj[i]] :
               utils.missing;
   };

   return List;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
