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
   loader.addModuleMethod('stats', 'runif', function runif(n, opt) {
      opt = getOptionsUnif(opt);
      return new Variable(rgen.uniform(opt.min, opt.max), { length: n });
   });

   /**
    * Return a scalar variable of the same length as `x`, where `x` is
    * an array or a variable.  `opt` is an
    * options object with possible properties `min`, `max`, and log.
    */
   loader.addModuleMethod('stats', 'dunif', function dunif(x, opt) {
      opt = getOptionsUnif(opt);
      return Variable.oneDimToVariable(x).map(function(v) {
         var h;
         h = v <= opt.max && v >= opt.min ? 1 / (opt.max - opt.min) : 0;
         return opt.log ? Math.log(h) : h;
      });
   });

   /**
    * Return a scalar variable of the same length as `x`, where `x` is
    * an array or a variable.  `opt` is an
    * options object with possible properties `min`, `max`, log, and
    * lowerTail.
    */
   loader.addModuleMethod('stats', 'punif', function punif(x, opt) {
      opt = getOptionsUnif(opt);
      return Variable.oneDimToVariable(x).map(function(val) {
         var p;
         p = val < opt.min ? 0 :
             val > opt.max ? 1 :
            (val - opt.min) / (opt.max - opt.min);
         p = opt.lowerTail ? p : 1 - p;
         return opt.log ? Math.log(p) : p;
      });
   });

   /**
    * Return a scalar variable of the same length as `p`, where `p` is
    * an array or a variable of probabilities.  `opt` is an
    * options object with possible properties `min`, `max`, log, and
    * lowerTail.
    */
   loader.addModuleMethod('stats', 'qunif', function qunif(p, opt) {
      opt = getOptionsUnif(opt);
      return Variable.oneDimToVariable(p).map(function(val) {
         if (utils.isMissing(val)) { return utils.missing; }
         val = opt.log ? Math.exp(val) : val;
         val = opt.lowerTail ? val : 1 - val;
         if (val <= 0) { return opt.min; }
         if (val >= 1) { return opt.max; }
         return val * (opt.max - opt.min) + opt.min;
      });
   });

   // Helper Methods
   function getOptionsUnif(opt) {
      return utils.mixin({}, opt, {
         min: 0,
         max: 1,
         log: false,
         lowerTail: true
      });
   }

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
