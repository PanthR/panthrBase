/**
 * Representation of "statistics" Datasets
 * @module Dataset
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 * Bill Altermatt <altermattw@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var List, Variable;

   List     = require('./list');
   Variable = require('./variable');
   /**
    * See `List` for options for `values`.
    * An extra requirement is that all "variables" should have same length.
    * If `values` is a `List`,`Vector`, or `Matrix`, it will be
    * 'unpacked' to create the columns of the `Dataset`.
    * If multiple arguments are provided, they are wrapped in an array.
    */
   function Dataset(values) {
      if (arguments.length > 1 ||
          isOfType(values, [List, Variable, Variable.Vector, Variable.Matrix])) {
         values = [].slice.call(arguments);
      }
      List.call(this, values);
      normalizeList(this).unnest(Infinity);
      validateLengths(this);
      // clone each variable
      this.each(function(val, i) {
         List.prototype.set.call(this, i, new Variable(val));
      }.bind(this));
      return this;
   }

   Dataset.prototype = Object.create(List.prototype);

   // test if v is one of some list of types (an array)
   function isOfType(v, types) {
      return types.some(function(t) { return v instanceof t; });
   }
   // Throw error if there are variables of unequal length
   function validateLengths(dSet) {
      dSet.reduce(function(acc, val) {
         if (acc === null) { return val.length(); }
         if (acc !== val.length()) {
            throw new Error('Dataset columns have unequal length.');
         }
         return acc;
      }, null);
      return dSet;
   }

   function normalizeList(list) {
      list.each(function(val, i, name) {
         if (val instanceof List) {
            normalizeList(val);
         } else if (val instanceof Variable.Matrix) {
            list.set(i, normalizeList(List.call({}, val.toArray())));
         } else if (! (val instanceof Variable)) {
            list.set(i, new Variable(val));
         }
      });
      return list;
   }

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
