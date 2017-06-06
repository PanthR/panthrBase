/**
 * Utility library for panthrBase.
 *
 * A collection of utilities used by panthrBase.
 * Contains methods for:
 *   - handling missing values,
 *   - standard arithmetic operations,
 *   - equality tests,
 *   - number formatting.
 * @module utils
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */
(function(define) {
'use strict';
define(function(require) {

   var utils;

   utils = {};

   /**
    * Mixes into the first object the key-value pairs from the other objects.
    * Shallow copy.
    * NOTE: Only mixes in values for "new" properties (safe mixin).
    */
   utils.mixin = function(target) {
      var rest;

      rest = [].slice.call(arguments, 1);
      rest.forEach(function(o) {
         if (o) {
            Object.keys(o).forEach(function(key) {
               if (!target.hasOwnProperty(key)) { target[key] = o[key]; }
            });
         }
      });
      return target;
   };

   /** Value to be used for all missing values. */
   utils.missing = NaN;

   /** Return true if `val` is `undefined`, `null`, or `NaN`. **/
   utils.isMissing = function isMissing(val) {
      /* eslint-disable no-self-compare */
      return val == null || val !== val;
      /* eslint-enable */
   };

   /** Return true if `val` is not `undefined`, `null`, or `NaN`. **/
   utils.isNotMissing = function isNotMissing(val) {
      /* eslint-disable no-self-compare */
      return val != null && val === val;
      /* eslint-enable */
   };

   /** For an array, return whether the array has any missing values in it. */
   utils.hasMissing = function hasMissing(arr) {
      return arr.some(utils.isMissing);
   };

   /** Return `val` if it is non-missing; otherwise return `utils.missing`. */
   utils.singleMissing = function singleMissing(val) {
      return utils.isMissing(val) ? utils.missing : val;
   };

   /**
    * Return a new function `g` such that `g(any missing)` is `utils.missing`,
    * and `g(val)` is either `f(val)` or `utils.missing`, depending on whether
    * `f(val)` is a missing value.
    */
   utils.makePreserveMissing = function makePreserveMissing(f) {
      return function(val) {
         return utils.isMissing(val) ?
            utils.missing
            : utils.singleMissing(f.apply(null, [].slice.call(arguments)));
      };
   };

   /** Return true if all entries in the array are missing. */
   utils.allMissing = function allMissing(arr) {
     return arr.every(utils.isMissing);
   };

   /** If `val` is a missing value, return `deflt`, else return `val`. */
   utils.getDefault = function getDefault(val, deflt) {
     return utils.isMissing(val) ? deflt : val;
   };

   /**
    * If `val` is a missing value, return `utils.missing`. Otherwise return `f(val)`.
    */
   utils.optionMap = function optionMap(val, f) {
     return utils.isMissing(val) ? utils.missing : f(val);
   };

   /** Test for equality that respects missing values. */
   utils.equal = function equal(a, b) {
      return utils.isMissing(a) ? utils.isMissing(b)
                                : utils.isNotMissing(b) && a === b;
   };

   /**
    * Test for array element equality that respects missing values.
    * Makes a shallow comparison.
    */
   utils.areEqualArrays = function areEqualArrays(A, B) {
      var i;

      if (A.length !== B.length) { return false; }
      for (i = 0; i < A.length; i += 1) {
         if (!utils.equal(A[i], B[i])) { return false; }
      }
      return true;
   };

   /* "Reverse lookup" for an array. */
   utils.arrayToObject = function arrayToObject(arr) {
      var obj;

      obj = {};
      arr.forEach(function(k, i) { obj[k] = i + 1; });
      return obj;
   };

   /**
    * Test if `v` is of one of the listed `types` (an array of strings).
    */
   utils.isOfType = function isOfType(v, types) {
      return types.some(function(t) { return v instanceof t; });
   };

   /**
    * Create an array of sequential values. Similar options to `Variable.seq`.
    */
   utils.seq = function seq(from, to, step) {
      var arr;

      arr = [];
      if (arguments.length === 1) { to = from; from = 1; }
      if (arguments.length < 3) { step = to >= from ? 1 : -1; }
      while ((to - from) * step >= 0) {
         arr.push(from);
         from += step;
      }
      return arr;
   };

   /** Arithmetic operators */
   utils.op = {};

   /** The function that adds two numbers. Also available as `utils.op['+']`. */
   utils.op.add = function add(a, b) { return a + b; };
   utils.op['+'] = utils.op.add;

   /** The function that subtracts two numbers. Also available as `utils.op['-']`. */
   utils.op.sub = function sub(a, b) { return a - b; };
   utils.op['-'] = utils.op.sub;

   /** The function that multiplies two numbers. Also available as `utils.op['*']`. */
   utils.op.mult = function mult(a, b) { return a * b; };
   utils.op['*'] = utils.op.mult;

   /** The function that divides two numbers. Also available as `utils.op['/']`. */
   utils.op.div = function divide(a, b) { return a / b; };
   utils.op['/'] = utils.op.div;

   /** The function that takes two values and returns the minimum. */
   utils.op.min2 = function min2(a, b) { return Math.min(a, b); };

   /** The function that takes two values and returns the maximum. */
   utils.op.max2 = function max2(a, b) { return Math.max(a, b); };

   /**
    * Take a user-provided option description `s` (a string) and an array `optList`
    * of allowable option settings.  Return the first element of the array that
    * has `s` as its initial substring.  Return `null` if no such match is found.
    *
    * If `s` is empty, `null` or `undefined`, return the default setting `deflt`.
    */
   utils.getOption = function getOption(s, optList, deflt) {
      var i;

      if (s == null || s === '') { return deflt; }
      s = s.toLowerCase();
      for (i = 0; i < optList.length; i += 1) {
         if (optList[i].toLowerCase().indexOf(s) === 0) { return optList[i]; }
      }
      return null;
   };

   /** An object containing formatting functions for numbers. */
   utils.format = {
      scientific: function(decimals) {
         return function(x) { return x.toExponential(decimals); };
      },
      fixed: function(decimals) {
         return function(x) { return x.toFixed(decimals); };
      }
   };

   utils.cloneIfPossible = function(val) {
      return val instanceof Object && val.clone ? val.clone() : val;
   };

   return utils;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
