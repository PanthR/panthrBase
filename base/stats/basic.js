(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils, Variable, List;

   utils = require('../utils');

   Variable = loader.getClass('Variable');
   List = loader.getClass('List');

   /**
    * Return the sum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'sum', function sum(skipMissing) {
      return this.asScalar().reduce(utils.op.add, 0, skipMissing);
   });

   /**
    * Return the mean of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'mean', function mean(skipMissing) {
     var v;  // the variable whose mean we will return
     v = filterMissing(this.asScalar(), skipMissing);
     return utils.singleMissing(v.sum() / v.length());
   });

   /**
    * Return the variance of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
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

   /**
    * Return the standard deviation of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'sd', function sd(skipMissing) {
      return utils.singleMissing(Math.sqrt(this.var(skipMissing)));
   });

   /**
    * Return the minimum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'min', function min(skipMissing) {
      return this.asScalar().reduce(utils.op.min2, Infinity, skipMissing);
   });

   /**
    * Return the maximum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'max', function max(skipMissing) {
      return this.asScalar().reduce(utils.op.max2, -Infinity, skipMissing);
   });

   /**
    * Return a `Variable` representing the permutation that sorts the values of the
    * original variable according to the order specified by `desc`.
    * - If `desc` is a boolean value, then `false` indicates ascending order, `true`
    * indicates descending order.
    * - If `desc` is a function `f(a, b)`, then it is interpreted as the comparator
    * for sorting, and must return `-1` if `a` precedes `b`, `0` if `a` and `b` are "equal"
    * in order, and `1` if `b` precedes `a`.
    * - If `desc` is omitted, it defaults to `false` (ascending order).
    */
   loader.addInstanceMethod('Variable', 'order', function order(desc) {
      return Variable.scalar(this.toVector().order(desc));
   });

   /**
    * Return a new `Variable` with the values sorted in the order specified by `desc`.
    * See `Variable#order`.
    */
   loader.addInstanceMethod('Variable', 'sort', function sort(desc) {
      return this.select(this.toVector().order(desc).toArray());
   });

   /**
    * Return a 'named' scalar variable of the requested quantiles for the values
    * of the variable.
    *
    * `probs` can be a single number or a one-dimensional object (`Array`,
    * `Vector` or `Variable`) and is used to specify the desired quantiles.
    * Each value in `probs` should be in the range [0, 1].  If a value in `probs`
    * is 'utils.isMissing' then the corresponding quantile will be recorded as
    * `utils.missing`.
    *
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and the variable
    * has missing values, an error is thrown.
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
      names = probs.map(function(prob) {
         return utils.optionMap(prob, function(p) { return p * 100 + '%'; });
      });
      return Variable.scalar(quantiles).names(names);
   });

   /**
    * Return the median of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'median', function median(skipMissing) {
      return this.hasMissing() && skipMissing !== true ? utils.missing
         : this.quantile(0.5, true).get(1);
   });

   /**
    * Return a 'named' scalar variable of the five-number of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'fiveNum', function fiveNum(skipMissing) {
      return this.quantile([0, 0.25, 0.5, 0.75, 1], skipMissing)
         .names(['Min', 'Q1', 'Median', 'Q3', 'Max']);
   });

   /**
    * Return a frequency table for the variable, in the form of a 'named' scalar
    * variable.  The variable is treated as a factor variable in order to
    * accumulate the frequencies.
    */
   loader.addInstanceMethod('Variable', 'table', function table() {
      var factor, freqs, missing, names;
      factor = Variable.factor(this.toArray()).sort();
      freqs = [];
      missing = 0;
      factor.each(function(val) {
         if (utils.isMissing(val)) {
            missing += 1;
         } else {
            freqs[val - 1] = freqs[val - 1] ? freqs[val - 1] + 1 : 1;
         }
      });
      names = factor.levels();
      if (missing > 0) { freqs.push(missing); names.push(utils.missing); }
      return Variable.scalar(freqs).names(names);
   });

   /**
    * Rescale the variable based on the provided `center` and `scale`.
    * Return a `List` holding three items:
    *  - `center`
    *  - `scale`
    *  - `values` (a `Variable` holding the rescaled values).
    *
    * Must be called with two arguments.
    */
   loader.addInstanceMethod('Variable', 'scale', function(center, scale) {
      return new List({
         center: center,
         scale: scale,
         values: this.map(function(x) { return (x - center) / scale; })
      });
   });

   /**
    * Return the standardized values using `Variable#rescale` where `center` is the
    * mean of the variable and `scale` is the standard deviation.
    *
    * Missing values are preserved, but are ignored in the computation.
    */
   loader.addInstanceMethod('Variable', 'zscore', function zscore() {
      return this.scale(this.mean(true), this.sd(true));
   });

   /**
    * Return the Pearson correlation coefficient between two variables, `xs` and `ys`.
    * By default, uses all the values of both variables.  If `skipMissing` is not set
    * to `true` and missing values exist, return `utils.missing`.
    *
    * The two variables must have the same length.
    */
   loader.addModuleMethod('stats', 'correlate', function correlate(xs, ys, skipMissing) {
      var M, MTM, V, validIndices; // V is vector [sumX, sumY]
      // calculate M, the cleaned-up 2-col matrix of xs & ys
      if (!xs.sameLength(ys)) {
         throw new Error('correlate requires same-length variables');
      }
      validIndices = Variable.seq(xs.length())
         .filter(function(i) {
            return utils.isNotMissing(xs.get(i)) && utils.isNotMissing(ys.get(i));
         });
      if (validIndices.length() !== xs.length()) {
         if (skipMissing !== true) { return utils.missing; }
         xs = xs.get(validIndices);
         ys = ys.get(validIndices);
      }
      M = new Variable.Matrix([Variable.ensureArray(xs), Variable.ensureArray(ys)]);
      MTM = M.transpose().mult(M);
      V = M.mapCol(function(col) { return col.reduce(utils.op.add, 0); });
      M = MTM.pAdd(V.outer(V).sMult(-1 / M.nrow));  // really, -VVT / n
      return M.get(1, 2) / Math.sqrt(M.get(1, 1) * M.get(2, 2));
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
