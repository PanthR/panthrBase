(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var Variable, List;

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');

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
         }, 1, that.nrow, {mode: 'factor'});
      }
      if (select instanceof Variable) { select = select.which(); }
      return select.map(function(val) { return that.get(val, true); });
   });

   /**
    * Return a `List` of arrays of indices corresponding to the distribution
    * of the factor variable.
    *
    *     Variable.factor(['a','a','b']).which(); // { a: [1, 2], b: [3] }
    */
   loader.addInstanceMethod('Variable.FactorVar', 'which', function which() {
      var arr, levels;
      levels = this.levels();
      arr = new Variable.Vector(function() { return []; }, levels.length).get();
      this.values.each(function(c, i) { arr[c - 1].push(i); });
      return new List(arr).names(levels);
   });
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
