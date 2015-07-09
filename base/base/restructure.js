(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var Variable, List, utils;

   Variable = loader.getClass('Variable');
   List = loader.getClass('List');

   utils = require('../utils');

   /**
    * Split a `Dataset` into a `List` of sub-datasets, based on the specified
    * subsets of the rows.  `select` can be:
    *  - A `List` whose elements are one-dimensional collections of row indices
    *  - A factor `Variable` of length `nrow`.  Rows with the same corresponding
    *  factor value will be grouped together.
    *  - A function `f(row, i)`.  Rows with the same function value will be grouped
    *  together.
    *
    * If an empty group of rows is created by `select`, it will generate an empty `Dataset`.
    */
   loader.addInstanceMethod('Dataset', 'split', function split(select) {
      var that = this;
      if (typeof select === 'function') {
         select = Variable.tabulate(function(i) {
            return select(that.rowFun(i), i);
         }, 1, that.nrow, { mode: 'factor' });
      }
      if (select instanceof Variable) { select = select.groupIndices(); }
      return select.map(function(val) { return that.get(val, true); });
   });

   /**
    * Return a `List` of arrays of indices corresponding to the distribution
    * of the factor variable. If the variable is not factor or ordinal, it will
    * be treated as a factor variable.
    *
    * If missing values are present, an extra (unnamed) list item to hold those
    * indices will be created at the end of the list.
    *
    *     Variable.factor(['a','a','b']).groupIndices(); // { a: [1, 2], b: [3] }
    */
   loader.addInstanceMethod('Variable', 'groupIndices', function groupIndices() {
      var that = this, arr, levels;
      if (that.mode !== 'factor' && that.mode !== 'ordinal') {
         /* eslint-disable consistent-this */
         that = Variable.factor(that.toArray());
         /* eslint-enable consistent-this */
      }
      levels = that.levels();
      arr = new Variable.Vector(function() { return []; }, levels.length).get();
      that.values.each(function(c, i) {
         if (utils.isMissing(c)) {
            arr[levels.length] = arr[levels.length] || [];
            arr[levels.length].push(i);
         } else {
            arr[c - 1].push(i);
         }
      });
      if (arr.length !== levels.length) { levels.push(utils.missing); }
      return new List(arr).names(levels);
   });
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
