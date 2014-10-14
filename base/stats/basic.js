(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils;

   utils = require('../utils');

   /**
    * Return the sum of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is null.
    */
   loader.addInstanceMethod('Variable', 'sum', function sum(skipMissing) {
      return this.asScalar().reduce(utils.op.add, 0, skipMissing);
   });

   /**
    * Return the mean of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is null.
    */
   loader.addInstanceMethod('Variable', 'mean', function mean(skipMissing) {
     var v;  // the variable whose mean we will return
     v = filterMissing(this.asScalar(), skipMissing);
     return utils.singleMissing(v.sum() / v.length());
   });

   loader.addInstanceMethod('Variable', 'var', function variance(skipMissing) {
      var res, K;
      res = this.reduce(function(acc, val) {
         if (K == null) { K = val; } // Center around first value for stability
         val = val - K;
         acc.sum += val;
         acc.sumSquares += val * val;
         acc.length += 1;
         return acc;
      }, { sum: 0, sumSquares: 0, length: 0 }, skipMissing);
      return utils.singleMissing( (res.sumSquares - res.sum * res.sum / res.length) /
                                  (res.length - 1)
      );
   });

   loader.addInstanceMethod('Variable', 'sd', function sd(skipMissing) {
      return utils.singleMissing(Math.sqrt(this.var(skipMissing)));
   });

   /**
    * Return the minimum of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is missing.
    */
   loader.addInstanceMethod('Variable', 'min', function min(skipMissing) {
      return this.asScalar().reduce(utils.op.min2, Infinity, skipMissing);
   });

   /**
    * Return the maximum of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is missing.
    */
   loader.addInstanceMethod('Variable', 'max', function max(skipMissing) {
      return this.asScalar().reduce(utils.op.max2, -Infinity, skipMissing);
   });

   // helper methods

   // Takes a variable `v` and a boolean `skipMissing`.
   // If `skipMissing` is true, filters out those missing values.
   // skipMissing defaults to false.
   function filterMissing(v, skipMissing) {
      return skipMissing === true ? v.nonMissing() : v;
   }
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
