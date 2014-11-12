(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var Variable, List;

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');

   /**
    * Splits a `Dataset` into a `List` of sub-datasets, based on a set of
    * subsets of the rows.  `select` can be
    *  - a `List` whose elements are one-dimensional collections of row indices
    *  - a factor `Variable` of the appropriate length.  Any rows with the same
    *  value label will be grouped together.
    *  used to select groups of rows
    *  - a function `f(row, i)`.  Any rows with the same function value will be grouped
    *  together.
    *
    * If an empty group of rows is created by `select`, it will generate a `Dataset` with
    * zero rows.
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

   /** Creates a `List` of arrays of indices corresponding to the value labels. */
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
