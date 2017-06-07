/**
 * Views into a list
 * @module List
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {
'use strict';
define(function(require) {

var Variable, utils;

utils = require('../utils');
Variable = require('../variable');

return function(List) {
   /*
    * Subclass of List that maintains access to a `target` list via specific `indices`.
    * Changes to the view instead occur on the target list.
    *
    * Caution: If the target list changes, the view may become stale.
    *
    * `target` must be a `List`. `indices` is an array of integers referring to
    * top-level entries in the `target`.
    *
    * Entries in the view list can be accessed by the original names or by updated integer
    * indices (so index of 1 in the view refers to the `target entry at the first index in
    * `indices`).
    *
    * Cloning a view returns a concrete `List` detached from the original target.
    */
   function ListView(target, indices) {
      this.target = target;
      this.indices = [utils.missing].concat(indices);
   }

   ListView.prototype = Object.create(List.prototype);

   ListView.prototype.names = function(i, newNames) {
      var targetListNames;

      targetListNames = this.target.names.bind(this.target);

      if (arguments.length === 0) {
         return new Variable(this.indices.slice(1).map(function(index) {
            return targetListNames(index);
         }));
      }
      if (arguments.length > 1) {
         targetListNames(this.indices[i], newNames);
      } else {
         if (utils.isMissing(i)) {
            this.indices.slice(1).forEach(function(index) {
               targetListNames(index, utils.missing);
            });

            return this;
         }
         if (i instanceof Variable) { i = i.asString().toArray(); }
         if (!Array.isArray(i)) {
            return targetListNames(this.indices[i]);
         }
         if (i.length !== this.length()) {
            throw new Error('Incompatible names length');
         }
         newNames = i;
         this.indices.slice(1).forEach(function(index, indicesIndex) {
            targetListNames(index, newNames[indicesIndex]);
         });
      }

      return this;
   };

   ListView.prototype.get = function(i) {
      var target, targetIndex;

      target = this.target;
      if (utils.isMissing(i)) {
         return this.indices.slice(1)
            .map(function(index) { return target.get(index); });
      }

      targetIndex = this.getIndexOf(i);
      if (utils.isMissing(targetIndex)) { return utils.missing; }

      return this.target.get(this.indices[targetIndex]);
   };

   ListView.prototype._set = function _set(i, val) {
      var name;

      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number') {
         i = Math.floor(i);
         if (i < 1) { throw new Error('cannot set at negative index: ' + i); }
         if (i >= this.indices.length) {
            throw new Error('Cannot set out of range on a list view');
         }
      } else {
         name = i;
         i = this.getIndexOf(name);
         if (utils.isMissing(i)) {
            throw new Error('Cannot set unknown name in list view');
         }
      }
      this.target._set(this.indices[i], val);

      return this;
   };

   ListView.prototype.getIndexOf = function(name) {
      var indices, namesFunc;

      indices = this.indices;
      namesFunc = this.names.bind(this);

      function getSingleIndex(aName) {
         var i;

         if (typeof aName === 'number') { return aName; }
         for (i = 1; i < indices.length; i += 1) {
            if (namesFunc(i) === aName) { return i; }
         }

         return utils.missing;
      }
      return Array.isArray(name) ? name.map(getSingleIndex) : getSingleIndex(name);
   };

   ListView.prototype.length = function() {
      return this.indices.length - 1;
   };

   ListView.prototype.unnest = function(levels) {
      return this.clone().unnest(levels);
   };

   ListView.prototype.append = function() {
      throw new Error('Cannot append on a list view');
   };
   ListView.prototype.push = function() {
      throw new Error('Cannot push on a list view');
   };
   ListView.prototype.prepend = function() {
      throw new Error('Cannot prepend on a list view');
   };
   ListView.prototype.delete = function() {
      throw new Error('Cannot delete on a list view');
   };

   return ListView;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
