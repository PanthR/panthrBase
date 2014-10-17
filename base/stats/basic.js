(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils, Variable;

   utils = require('../utils');

   Variable = loader.getClass('Variable');

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

   /**
    * Return the permutation that sorts the elements in the variable according
    * to the order specified by `desc`.
    * - If `desc` is a boolean, then `false` indicates ascending order, `true`
    * indicates descending order.
    * - If `desc` is a function `f(a, b)`, then it is interpreted as the comparator
    * for sorting, and must return `-1` if `a` precedes `b`, `0` if `a` and `b` are "equal"
    * in order, and `1` if `b` precedes `a`.
    * - If `desc` is omitted, it defaults to `false`.
    */
   loader.addInstanceMethod('Variable', 'order', function order(desc) {
      return Variable.scalar(this.toVector().order(desc));
   });

   /**
    * Return a new variable with the values sorted in the order specified by `desc`.
    * See `Variable.order`.
    */
   loader.addInstanceMethod('Variable', 'sort', function sort(desc) {
      return this.reproduce(this.toVector().sort(desc));
   });

   /**
    * Return the requested quantiles for the values of `this`.
    * `probs` can be a single number or array/Vector/Variable, and is
    * used to specify the desired quantiles.  Each value in `probs`
    * should be in the range [0, 1].  If a value in `probs` is missing
    * then the corresponding quantile will be recorded as missing.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, an error is thrown.
    * The quantile results are returned in a 'named' scalar variable.
    */
   loader.addInstanceMethod('Variable', 'quantile',
   function quantile(probs, skipMissing) {
      var getQuant, quantiles, names;
      if (skipMissing === true) {
         return this.nonMissing().quantile(probs);
      } else if (this.hasMissing()) {
         throw new Error(
            'missing values in variable and skipMissing not set to true'
         );
      }
      probs = Variable.ensureArray(probs);
      probs.forEach(function(p) { if (p < 0 || p > 1) {
         throw new Error('"probs" outside [0, 1]');
      }});
      getQuant = function(p) {
         var g, k;
         p = p * (this.length() - 1) + 1;
         k = Math.floor(p);
         g = p - k; // fractional part of scaled prob
         // interpolate: (1-g)*x[k] + g*x[k+1]
         return (1 - g) * this.get(k) + g * this.get(k + 1);
      }.bind(this.asScalar().sort());
      quantiles = probs.map(utils.makePreserveMissing(getQuant));
      names = probs.map(function(p) {
         return utils.isMissing(p) ? utils.missing : p * 100 + '%';
      });
      return Variable.scalar(quantiles).names(names);
   });

   loader.addInstanceMethod('Variable', 'median', function median(skipMissing) {
      return this.hasMissing() && skipMissing !== true ? utils.missing
         : this.quantile(0.5, true).get(1);
   });

   loader.addInstanceMethod('Variable', 'fiveNum', function fiveNum(skipMissing) {
      return this.quantile([0, 0.25, 0.5, 0.75, 1], skipMissing)
         .names(['Min', 'Q1', 'Median', 'Q3', 'Max']);
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
