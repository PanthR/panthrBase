(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils;

   utils = require('./utils');

   loader.addModule('fun', {});

   /**
    * Return a function g(x) whose graph is piecewise linear with vertices
    * specified by the pairs created by the vectors/arrays/variables `xs`, `ys`.
    * The `xs` will be assumed to be in increasing order.
    * The result of `g(x)` for `x` outside the range of `xs` is unspecified.
    *
    * Example: `fun.interpolate([1, 3, 4], [0, 1, 2])` has as graph the line segments
    * joining `(1, 0)` to `(3, 1)` and then to `(4, 2)`.
    */
   loader.addModuleMethod('fun.interpolate', function interpolate(xs, ys) {
      xs = xs.hasOwnProperty('toArray') ? xs.toArray() : xs;
      ys = ys.hasOwnProperty('toArray') ? ys.toArray() : ys;
      if (xs.length !== ys.length) {
         throw new Error('fun.interpolate: lengths must agree.');
      }
      return function(x) {
         var i, gamma;
         if (x < xs[0] || x > xs[xs.length - 1]) { return utils.missing; }
         if (x === xs[xs.length - 1]) { return ys[xs.length - 1]; }
         i = -1;
         while (xs[i + 1] <= x) { i += 1; }
         gamma = (x - xs[i]) / (xs[i + 1] - xs[i]);
         return (1 - gamma) * ys[i] + gamma * ys[i + 1];
      };
   });
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
