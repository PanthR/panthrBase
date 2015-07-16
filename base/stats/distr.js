(function(define) {'use strict';
define(function(require) {

// Add standard distribution functions

return function(loader) {
   var utils, Variable, rgen;

   utils = require('../utils');
   rgen = require('rgen');

   Variable = loader.getClass('Variable');

   /**
    * Return a Variable of `n` random uniform values, where `n` is a
    * non-negative integer.  Range defaults to [0, 1].  `opt` is an
    * options object with possible properties `min` and `max`.
    */
   loader.addModuleMethod('stats', 'runif',
      makeRandom(function(opt) {
         return rgen.uniform(opt.min, opt.max);
      }, { min: 0, max: 1 })
   );

   /**
    * Return a scalar variable of the same length as `x`, where `x` is
    * an array or a variable.  `opt` is an
    * options object with possible properties `min`, `max`, and log.
    */
   loader.addModuleMethod('stats', 'dunif',
      makePdf(function(val, opt) {
         return val <= opt.max && val >= opt.min ? 1 / (opt.max - opt.min)
                                                 : 0;
      }, { min: 0, max: 1 })
   );

   /**
    * Return a scalar variable of the same length as `x`, where `x` is
    * an array or a variable.  `opt` is an
    * options object with possible properties `min`, `max`, log, and
    * lowerTail.
    */
   loader.addModuleMethod('stats', 'punif',
      makeCdf(function(val, opt) {
         return val < opt.min ? 0 :
                val > opt.max ? 1 :
                (val - opt.min) / (opt.max - opt.min);
      }, { min: 0, max: 1 })
   );

   /**
    * Return a scalar variable of the same length as `p`, where `p` is
    * an array or a variable of probabilities.  `opt` is an
    * options object with possible properties `min`, `max`, log, and
    * lowerTail.
    */
   loader.addModuleMethod('stats', 'qunif',
      makeInvCdf(function(p, opt) {
         return p <= 0 ? opt.min :
                p >= 1 ? opt.max :
                p * (opt.max - opt.min) + opt.min;
      }, { min: 0, max: 1 })
   );

   // Helper Methods

   // Standardizes the options object `opt` mixing in the distribution
   // defaults `defs` along with defaults for `lowerTail` and `log`
   function getOptions(opt, defs) {
      return utils.mixin({}, opt, defs, {
         lowerTail: true,
         log: false
      });
   }

   // Create the `r*` distribution function based on distribution defaults
   // `defs`. The function `f(opt)` returns a function that produces the
   // random deviates based on parameters `opt`.
   function makeRandom(f, defs) {
      return function(n, opt) {
         opt = getOptions(opt, defs);
         return new Variable(f(opt), { length: n });
      };
   }

   // Create the `d*` density function based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the density value for `x=val` and
   // parameters `opt`.
   function makePdf(f, defs) {
      return function(x, opt) {
         opt = getOptions(opt, defs);
         return Variable.oneDimToVariable(x).map(function(val) {
            return opt.log ? Math.log(f(val, opt))
                           : f(val, opt);
         }, true /* skipMissing */);
      };
   }

   // Create the `p*` cdf based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the cdf value for `x=val` and
   // parameters `opt`.
   function makeCdf(f, defs) {
      return function(x, opt) {
         opt = getOptions(opt, defs);
         return Variable.oneDimToVariable(x).map(function(val) {
            var p = f(val, opt);
            p = opt.lowerTail ? p : 1 - p;
            return opt.log ? Math.log(p) : p;
         }, true /* skipMissing */);
      };
   }

   // Create the `q*` inverse cdf based on distribution defaults `defs`.
   // The function `f(p, opt)` returns the percentile for `p` and
   // parameters `opt`.
   function makeInvCdf(f, defs) {
      return function(p, opt) {
         opt = getOptions(opt, defs);
         return Variable.oneDimToVariable(p).map(function(val) {
            val = opt.log ? Math.exp(val) : val;
            val = opt.lowerTail ? val : 1 - val;
            return f(val, opt);
         }, true /* skipMissing */);
      };
   }

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
