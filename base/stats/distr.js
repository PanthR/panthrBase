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
      makePdf(function(opt) {
         return panthrMath.dunif(opt.min, opt.max, opt.log);
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'punif',
      makeCdf(function(opt) {
         return panthrMath.punif(opt.min, opt.max, opt.lowerTail, opt.log);
      }, { min: 0, max: 1 })
   );
   loader.addModuleMethod('stats', 'qunif',
      makeInvCdf(function(opt) {
         return panthrMath.qunif(opt.min, opt.max, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dnorm(opt.mu, opt.sigma, opt.log);
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'pnorm',
      makeCdf(function(opt) {
         return panthrMath.pnorm(opt.mu, opt.sigma, opt.lowerTail, opt.log);
      }, { mu: 0, sigma: 1 })
   );
   loader.addModuleMethod('stats', 'qnorm',
      makeInvCdf(function(opt) {
         return panthrMath.qnorm(opt.mu, opt.sigma, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dbeta(opt.a, opt.b, opt.log);
      }, { a: 2, b: 2 })
   );
   loader.addModuleMethod('stats', 'pbeta',
      makeCdf(function(opt) {
         return panthrMath.pbeta(opt.a, opt.b, opt.lowerTail, opt.log);
      }, { a: 2, b: 2 })
   );
   loader.addModuleMethod('stats', 'qbeta',
      makeInvCdf(function(opt) {
         return panthrMath.qbeta(opt.a, opt.b, opt.lowerTail, opt.log);
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
      }, { a: 1, b: 1 })
   );
   loader.addModuleMethod('stats', 'dgamma',
      makePdf(function(opt) {
         return panthrMath.dgamma(opt.a, opt.s, opt.log);
      }, { a: 1, s: 1 })
   );
   loader.addModuleMethod('stats', 'pgamma',
      makeCdf(function(opt) {
         return panthrMath.pgamma(opt.a, opt.s, opt.lowerTail, opt.log);
      }, { a: 1, s: 1 })
   );
   loader.addModuleMethod('stats', 'qgamma',
      makeInvCdf(function(opt) {
         return panthrMath.qgamma(opt.a, opt.s, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dt(opt.df, opt.log);
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'pt',
      makeCdf(function(opt) {
         return panthrMath.pt(opt.df, opt.lowerTail, opt.log);
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'qt',
      makeInvCdf(function(opt) {
         return panthrMath.qt(opt.df, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dchisq(opt.df, opt.log);
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'pchisq',
      makeCdf(function(opt) {
         return panthrMath.pchisq(opt.df, opt.lowerTail, opt.log);
      }, { df: 10 })
   );
   loader.addModuleMethod('stats', 'qchisq',
      makeInvCdf(function(opt) {
         return panthrMath.qchisq(opt.df, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dbinom(opt.size, opt.p, opt.log);
      }, { size: 10, p: 0.5 })
   );
   loader.addModuleMethod('stats', 'pbinom',
      makeCdf(function(opt) {
         return panthrMath.pbinom(opt.size, opt.p, opt.lowerTail, opt.log);
      }, { size: 10, p: 0.5 })
   );
   loader.addModuleMethod('stats', 'qbinom',
      makeInvCdf(function(opt) {
         return panthrMath.qbinom(opt.size, opt.p, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dpois(opt.lambda, opt.log);
      }, { lambda: 1 })
   );
   loader.addModuleMethod('stats', 'ppois',
      makeCdf(function(opt) {
         return panthrMath.ppois(opt.lambda, opt.lowerTail, opt.log);
      }, { lambda: 1 })
   );
   loader.addModuleMethod('stats', 'qpois',
      makeInvCdf(function(opt) {
         return panthrMath.qpois(opt.lambda, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dgeom(opt.prob, opt.log);
      }, { prob: 0.5 })
   );
   loader.addModuleMethod('stats', 'pgeom',
      makeCdf(function(opt) {
         return panthrMath.pgeom(opt.prob, opt.lowerTail, opt.log);
      }, { prob: 0.5 })
   );
   loader.addModuleMethod('stats', 'qgeom',
      makeInvCdf(function(opt) {
         return panthrMath.qgeom(opt.prob, opt.lowerTail, opt.log);
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
      makePdf(function(opt) {
         return panthrMath.dexp(opt.rate, opt.log);
      }, { rate: 1 })
   );
   loader.addModuleMethod('stats', 'pexp',
      makeCdf(function(opt) {
         return panthrMath.pexp(opt.rate, opt.lowerTail, opt.log);
      }, { rate: 1 })
   );
   loader.addModuleMethod('stats', 'qexp',
      makeInvCdf(function(opt) {
         return panthrMath.qexp(opt.rate, opt.lowerTail, opt.log);
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
   function makePdf(f, defs) {
      return function(x, opt) {
         var dens;

         opt = getOptions(opt, defs);
         dens = f(opt);
         return Variable.oneDimToVariable(x).map(dens, true /* skipMissing */);
      };
   }

   // Create the `p*` cdf based on distribution defaults `defs`.
   // The function `f(val, opt)` returns the cdf value for `x=val` and
   // parameters `opt`.
   function makeCdf(f, defs) {
      return function(x, opt) {
         var cdf;

         opt = getOptions(opt, defs);
         cdf = f(opt);
         return Variable.oneDimToVariable(x).map(cdf, true /* skipMissing */);
      };
   }

   // Create the `q*` inverse cdf based on distribution defaults `defs`.
   // The function `f(p, opt)` returns the percentile for `p` and
   // parameters `opt`.
   function makeInvCdf(f, defs) {
      return function(p, opt) {
         var invCdf;

         opt = getOptions(opt, defs);
         invCdf = f(opt);
         return Variable.oneDimToVariable(p).map(invCdf, true /* skipMissing */);
      };
   }

};

});
/* eslint-disable max-statements */

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
