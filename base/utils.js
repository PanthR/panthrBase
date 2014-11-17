/**
 * Utility library for panthrBase.
 * @module utils
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   /**
    * A collection of utilities used by panthrBase
    */
   var utils = {};

   /** Value to be used for missing */
   utils.missing = NaN;

   /** Returns true iff `val` is undefined, null, or NaN. **/
   utils.isMissing = function isMissing(val) {
      /* eslint-disable no-self-compare */
      return val == null || val !== val;
      /* eslint-enable */
   };

   utils.isNotMissing = function isNotMissing(val) {
      /* eslint-disable no-self-compare */
      return val != null && val === val;
      /* eslint-enable */
   };

   /** For an array, returns whether the array has any "missing values" in it. */
   utils.hasMissing = function hasMissing(arr) {
      return arr.some(utils.isMissing);
   };

   utils.singleMissing = function singleMissing(val) {
      return utils.isMissing(val) ? NaN : val;
   };

   /* Returns a new function `g` such that: `g(any missing)` is `null`, and `g(val)` is either `f(val)`
    * or `null` if `f(val)` would be "isMissing". */
   utils.makePreserveMissing = function makePreserveMissing(f) {
      return function(val) {
         return utils.isMissing(val) ? NaN :
               utils.singleMissing(f.apply(null, [].slice.call(arguments)));
      };
   };

   /** Return true if all entries in the array are missing */
   utils.allMissing = function allMissing(arr) {
     return arr.every(utils.isMissing);
   };

   /** If `val` is a missing value, return `deflt`, else return `val` */
   utils.getDefault = function getDefault(val, deflt) {
     return utils.isMissing(val) ? deflt : val;
   };

   /**
    * if `val` is a missing value, return it. Otherwise return the result of
    * applying `f` to `val`.
    */
   utils.optionMap = function optionMap(val, f) {
     return utils.isMissing(val) ? utils.missing : f(val);
   };

   utils.equal = function equal(a, b) {
      return utils.isMissing(a) ? utils.isMissing(b)
                                : utils.isNotMissing(b) && a === b;
   };

   /**
    * Checks for array element equality where NaN is considered equal to NaN. Does not
    * recurse.
    */
   utils.areEqualArrays = function areEqualArrays(A, B) {
      var i;
      if (A.length !== B.length) { return false; }
      for (i = 0; i < A.length; i += 1) {
         if (!utils.equal(A[i], B[i])) { return false; }
      }
      return true;
   };

   utils.arrayToObject = function arrayToObject(arr) {
      var obj;
      obj = {};
      arr.forEach(function(k, i) { obj[k] = i + 1; });
      return obj;
   };

   // test if v is one of some list of types (an array)
   utils.isOfType = function isOfType(v, types) {
      return types.some(function(t) { return v instanceof t; });
   };

   utils.seq = function seq(from, to, step) {
      var arr = [];
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
    * Take a user-provided option description `s` and a list of
    * allowable option settings.  Return the first element of the list
    * that has the string `s` as its initial substring.  Return `null`
    * if no such match is found.
    *
    * If `s` is empty or `null` / undefined, return the default setting `def`.
    */
   utils.getOption = function getOption(s, optList, def) {
      var i;
      if (s == null || s === '') { return def; }
      s = s.toLowerCase();
      for (i = 0; i < optList.length; i += 1) {
         if (optList[i].toLowerCase().indexOf(s) === 0) { return optList[i]; }
      }
      return null;
   };

   return utils;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
