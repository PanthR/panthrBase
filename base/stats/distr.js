(function(define) {
'use strict';
define(function(require) {

// Add standard distribution functions

/* eslint-disable max-statements */
return function(loader) {
   var utils, Variable, panthrMath;

   utils = require('../utils');
   panthrMath = require('panthr-math');

   Variable = loader.getClass('Variable');

   /**
    * Each distribution has 4 methods:
    *
    * - `r*(n, ...)` for generating random variates from that distribution
    * - `d*(x, { ..., lowerTail: true, log: false })` for the pdf
    * - `p*(x, { ..., lowerTail: true, log: false })` for the cdf
    * - `q*(p, { ..., lowerTail: true, log: false })` for the inverse cdf
    *
    * The remaining parameters are to be the same for all 4 methods, but
    * different for different distributions.
    *
    * All parameters are to be specified as a second argument to the call,
    * in the form of an `options` object.
    *
    * - `n` is to be an integer
    * - `x` and `p` are to be arrays or scalar variables
    *
    * Specific distribution parameters and their defaults:
    *
    * - unif: min = 0, max = 1
    * - norm: mu = 0, sigma = 1
    * - beta: a = 2, b = 2
    * - gamma: a = 1, s = 1
    * - t: df = 10
    * - chisq: df = 10
    * - binom: size = 10, p = 0.5
    * - pois: lambda = 1
    */

   //
   // UNIFORM
   //
   loader.addModuleMethod('stats', 'runif',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.min, opt.max],
            function(min, max) { return panthrMath.runif(min, max)(); },
            'scalar',
            n
         );
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'dunif',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.min, opt.max],
            function(x, min, max) { return panthrMath.dunif(min, max, opt.log)(x); },
            'scalar'
         );
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'punif',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.min, opt.max],
            function(x, min, max) {
               return panthrMath.punif(min, max, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'qunif',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.min, opt.max],
            function(p, min, max) {
               return panthrMath.qunif(min, max, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { min: 0, max: 1 })
   );

   //
   // NORMAL
   //
   loader.addModuleMethod('stats', 'rnorm',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.mu, opt.sigma],
            function(mean, sd) { return panthrMath.rnorm(mean, sd)(); },
            'scalar',
            n
         );
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'dnorm',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.mu, opt.sigma],
            function(x, mean, sd) { return panthrMath.dnorm(mean, sd, opt.log)(x); },
            'scalar'
         );
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'pnorm',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.mu, opt.sigma],
            function(x, mu, sigma) {
               return panthrMath.pnorm(mu, sigma, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'qnorm',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.mu, opt.sigma],
            function(p, mu, sigma) {
               return panthrMath.qnorm(mu, sigma, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { mu: 0, sigma: 1 })
   );
   //
   // BETA
   //
   loader.addModuleMethod('stats', 'rbeta',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.a, opt.b],
            function(a, b) { return panthrMath.rbeta(a, b)(); },
            'scalar',
            n
         );
      }, { a: 2, b: 2 })
   );
   loader.addModuleMethod('stats', 'dbeta',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.a, opt.b],
            function(x, a, b) { return panthrMath.dbeta(a, b, opt.log)(x); },
            'scalar'
         );
      }, { a: 2, b: 2 })
   );
   loader.addModuleMethod('stats', 'pbeta',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.a, opt.b],
            function(x, a, b) {
               return panthrMath.pbeta(a, b, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { a: 2, b: 2 })
   );
   loader.addModuleMethod('stats', 'qbeta',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.a, opt.b],
            function(p, a, b) {
               return panthrMath.qbeta(a, b, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { a: 2, b: 2 })
   );
   //
   // GAMMA
   //
   loader.addModuleMethod('stats', 'rgamma',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.a, opt.b],
            function(a, b) { return panthrMath.rgamma(a, b)(); },
            'scalar',
            n
         );
      }, { a: 1, s: 1 })
   );
   loader.addModuleMethod('stats', 'dgamma',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.a, opt.s],
            function(x, a, s) { return panthrMath.dgamma(a, s, opt.log)(x); },
            'scalar'
         );
      }, { a: 1, s: 1 })
   );
   loader.addModuleMethod('stats', 'pgamma',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.a, opt.s],
            function(x, a, s) {
               return panthrMath.pgamma(a, s, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { a: 1, s: 1 })
   );
   loader.addModuleMethod('stats', 'qgamma',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.a, opt.s],
            function(p, a, s) {
               return panthrMath.qgamma(a, s, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { a: 1, s: 1 })
   );
   //
   // Student's t
   //
   loader.addModuleMethod('stats', 'rt',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.df],
            function(df) { return panthrMath.rt(df)(); },
            'scalar',
            n
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'dt',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.df],
            function(x, df) { return panthrMath.dt(df, opt.log)(x); },
            'scalar'
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'pt',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.df],
            function(x, df) {
               return panthrMath.pt(df, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'qt',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.df],
            function(p, df) {
               return panthrMath.qt(df, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { df: 10 })
   );
   //
   // Chi-squared
   //
   loader.addModuleMethod('stats', 'rchisq',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.df],
            function(df) { return panthrMath.rchisq(df)(); },
            'scalar',
            n
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'dchisq',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.df],
            function(x, df) { return panthrMath.dchisq(df, opt.log)(x); },
            'scalar'
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'pchisq',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.df],
            function(x, df) {
               return panthrMath.pchisq(df, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'qchisq',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.df],
            function(p, df) {
               return panthrMath.qchisq(df, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { df: 10 })
   );
   //
   // Binomial
   //
   loader.addModuleMethod('stats', 'rbinom',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.size, opt.p],
            function(size, p) { return panthrMath.rbinom(size, p)(); },
            'scalar',
            n
         );
      }, { size: 10, p: 0.5 })
   );
   loader.addModuleMethod('stats', 'dbinom',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.size, opt.p],
            function(x, size, p) { return panthrMath.dbinom(size, p, opt.log)(x); },
            'scalar'
         );
      }, { size: 10, p: 0.5 })
   );
   loader.addModuleMethod('stats', 'pbinom',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.size, opt.p],
            function(x, size, p) {
               return panthrMath.pbinom(size, p, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { size: 10, p: 0.5 })
   );
   loader.addModuleMethod('stats', 'qbinom',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.size, opt.p],
            function(p, size, prob) {
               return panthrMath.qbinom(size, prob, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { size: 10, p: 0.5 })
   );
   //
   // Poisson
   //
   loader.addModuleMethod('stats', 'rpois',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.lambda],
            function(lambda) { return panthrMath.rpois(lambda)(); },
            'scalar',
            n
         );
      }, { lambda: 1 })
   );
   loader.addModuleMethod('stats', 'dpois',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.lambda],
            function(x, lambda) { return panthrMath.dpois(lambda, opt.log)(x); },
            'scalar'
         );
      }, { lambda: 1 })
   );
   loader.addModuleMethod('stats', 'ppois',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.lambda],
            function(x, lambda) {
               return panthrMath.ppois(lambda, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { lambda: 1 })
   );
   loader.addModuleMethod('stats', 'qpois',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.lambda],
            function(p, lambda) {
               return panthrMath.qpois(lambda, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { lambda: 1 })
   );

   //
   // Geometric
   //
   loader.addModuleMethod('stats', 'rgeom',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.prob],
            function(prob) { return panthrMath.rgeom(prob)(); },
            'scalar',
            n
         );
      }, { prob: 0.5 })
   );
   loader.addModuleMethod('stats', 'dgeom',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.prob],
            function(x, prob) { return panthrMath.dgeom(prob, opt.log)(x); },
            'scalar'
         );
      }, { prob: 0.5 })
   );
   loader.addModuleMethod('stats', 'pgeom',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.prob],
            function(x, prob) {
               return panthrMath.pgeom(prob, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { prob: 0.5 })
   );
   loader.addModuleMethod('stats', 'qgeom',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.prob],
            function(p, prob) {
               return panthrMath.qgeom(prob, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { prob: 0.5 })
   );
   //
   // Exponential
   //
   loader.addModuleMethod('stats', 'rexp',
      makeRandom(function(n, opt) {
         return Variable.mapMulti(
            [opt.rate],
            function(rate) { return panthrMath.rexp(rate)(); },
            'scalar',
            n
         );
      }, { rate: 1 })
   );
   loader.addModuleMethod('stats', 'dexp',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.rate],
            function(x, rate) { return panthrMath.dexp(rate, opt.log)(x); },
            'scalar'
         );
      }, { rate: 1 })
   );
   loader.addModuleMethod('stats', 'pexp',
      makeWrapDefaults(function(xs, opt) {
         return Variable.mapMulti(
            [xs, opt.rate],
            function(x, rate) {
               return panthrMath.pexp(rate, opt.lowerTail, opt.log)(x);
            },
            'scalar'
         );
      }, { rate: 1 })
   );
   loader.addModuleMethod('stats', 'qexp',
      makeWrapDefaults(function(ps, opt) {
         return Variable.mapMulti(
            [ps, opt.rate],
            function(p, rate) {
               return panthrMath.qexp(rate, opt.lowerTail, opt.log)(p);
            },
            'scalar'
         );
      }, { rate: 1 })
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
         if (n instanceof Variable) { n = n.length(); }
         opt = getOptions(opt, defs);

         Object.keys(opt).forEach(function(key) {
            if (!(opt[key] instanceof Variable)) {
               opt[key] = new Variable(opt[key]);
            }
         });

         return f(n, opt);
      };
   }

   // Create the `d*` density function based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the density value for `x=val` and
   // parameters `opt`.
   function makeWrapDefaults(f, defs) {
      return function(x, opt) {
         opt = getOptions(opt, defs);

         Object.keys(opt).forEach(function(key) {
            if (key === 'log' || key === 'lowerTail') { return; }
            if (!(opt[key] instanceof Variable)) {
               opt[key] = new Variable(opt[key]);
            }
         });

         return f(Variable.oneDimToVariable(x), opt);
      };
   }
};

});
/* eslint-disable max-statements */

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
