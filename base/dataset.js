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
    */
   function Dataset(values) {
      List.call(this, values);
      normalizeList(this).unnest(Infinity);
      return validateLengths(this);
   }

   Dataset.prototype = Object.create(List.prototype);

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

   // Need to clone variables
   function normalizeList(list) {
      list.each(function(val, i, name) {
         if (val instanceof List) {
            normalizeList(val);
         } else if (val instanceof Variable.Matrix) {
            list.set(i, normalizeList(List.apply({}, val.toArray())));
         } else {
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
