/**
 * Representation of "statistics" Variables
 * @module Variable
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 * Bill Altermatt <altermattw@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var Variable, utils;

   utils = require('./utils');

   /**
    * Create a new variable. `values` is an array with the desired values.
    * If given a variable instead of an array, use `get`.
    * `options` is an object indicating properties of the variable:
    *  - `label`: The label to use in graphs/tables/descriptions.
    *  - `mode`: A string describing what type of variable to create. If `mode` is missing
    * it will be determined based on the first non-missing entry in `values`.
    *  - `_names`: An optional vector/array/variable of equal length containing names for
    * the values. Access it via the `names` method.
    *
    *
    * Further options depend on the particular mode chosen. See the subclass documentations
    * for details.
    *
    * A default label value will be generated if not provided. So creating a `Variable` can
    * be as simple as passing a `values` argument to the constructor.
    *
    * Variable construction and setting needs to preserve the invariant that all entries are
    * either `null` or a "meaningful" value. All `undefined`, missing and `NaN` entries will be
    * converted to `null`.
    */
   Variable = function(values, options) {
      var ret;
      if (values instanceof Variable) { values = values.get(); }
      if (values instanceof Variable.Vector) { values = values.toArray(); }
      values = normalizeValue(values);
      if (options == null) { options = {}; }
      options.mode = utils.getOption(options.mode, Object.keys(Variable.modes)) ||
                     inferMode(values);
      ret = new Variable.modes[options.mode](values, options);
      ret._names = utils.missing;
      ret.label = options.label || '';
      return ret;
   };

   Variable.prototype = Object.create({});

   Variable.Vector      = require('linalg-panthr').Vector;
   Variable.ScalarVar   = require('./variable/scalar')(Variable);
   Variable.LogicalVar  = require('./variable/logical')(Variable);
   Variable.StringVar   = require('./variable/string')(Variable);
   Variable.FactorVar   = require('./variable/factor')(Variable);
   Variable.OrdinalVar  = require('./variable/ordinal')(Variable);
   Variable.DateTimeVar = require('./variable/datetime')(Variable);

   // mode values are the keys for Variable.modes
   // the corresponding constructors are stored as values
   Variable.modes = {
      'scalar':   Variable.ScalarVar,
      'logical':  Variable.LogicalVar,
      'string':   Variable.StringVar,
      'factor':   Variable.FactorVar,
      'ordinal':  Variable.OrdinalVar,
      'dateTime': Variable.DateTimeVar
   };
   // give a mode property to each Variable subclass
   Object.keys(Variable.modes).forEach(function(key) {
      Variable.modes[key].prototype.mode = function mode() { return key; };
   });

   /** Convenience constructor. */
   Variable.scalar = function scalar(values, label) {
      return new Variable(values, { mode: 'scalar', label: label });
   };

   /** Convenience constructor. */
   Variable.logical = function logical(values, label) {
      return new Variable(values, { mode: 'logical', label: label });
   };

   /** Convenience constructor. */
   Variable.string = function string(values, label) {
      return new Variable(values, { mode: 'string', label: label });
   };

   /** Convenience constructor. */
   Variable.factor = function factor(values, label) {
      return new Variable(values, { mode: 'factor', label: label });
   };

   /** Convenience constructor. `levels` or `label` could be omitted. */
   Variable.ordinal = function ordinal(values, levels, label) {
      return new Variable(values,
         Array.isArray(levels) ? { mode: 'ordinal', levels: levels, label: label }
                               : { mode: 'ordinal', label: levels }
      );
   };

   /** Convenience constructor. */
   Variable.dateTime = function dateTime(values, label) {
      return new Variable(values, { mode: 'date', label: label });
   };

   /**
    * Construct a variable from the function `f(i)`, using arguments
    * i = from .. to
    */
   Variable.tabulate = function tabulate(f, from, to, options) {
      var arr, i;
      arr = [];
      for (i = from; i <= to; i += 1) {
         arr.push(f(i));
      }
      return new Variable(arr, options);
   };

   /**
    * Construct a scalar variable from an arithmetic sequence.
    * `step` defaults to 1 or -1 if omitted.
    * `from` defaults to 1 (`to` is positive in this case)
    * seq(5.1, 6.1, .5) would have values [5.1, 5.6, 6.1]
    * seq(5, 7.5) would have values [5, 6, 7]
    * `options` parameter is an optional options object
    */
   Variable.seq = function seq(from, to, step, options) {
      var args, v;
      args = Array.prototype.slice.call(arguments);
      if (typeof args[args.length - 1] === 'object') {
         options = args.pop();
      }
      v = Variable.Vector.seq.apply(null, args);
      return new Variable(v, options);
   };

   /**
    * Takes 0 or more variables as arguments and concatenates them.
    */
   Variable.concat = function concat(vars) {
      var commonMode, converters;
      if (arguments.length === 0) { return Variable.scalar([]); }
      if (arguments.length === 1) { return arguments[0]; }
      vars = [].slice.call(arguments);  // at least 2 variables
      commonMode = vars.map(function(v) { return v.mode(); }).reduce(_lcMode);
      converters = {
         'scalar': function(v) { return v.asScalar(); },
         'string': function(v) { return v.asString(); },
         'factor': function(v) { return v.asString(); }
      };
      // make all vars the same type & concatenate their values
      if (converters[commonMode]) { vars = vars.map(converters[commonMode]); }
      vars = vars.map(function(v) { return v.get(); });  // array of arrays
      return new Variable([].concat.apply([], vars), { mode: commonMode });
   };

   // val can be a single number / missing / array / Variable / Vector
   // returns an array with missing values normalized to utils.missing
   Variable.ensureArray = function ensureArray(val) {
      if (val instanceof Variable) { val = val.toVector(); }
      if (val instanceof Variable.Vector) { val = val.toArray(); }
      if (!Array.isArray(val)) { val = [val]; }
      return normalizeValue(val);
   };

   Variable.prototype.asScalar = function asScalar() {
      return new Variable(this.values);
   };

   Variable.prototype.asString = function asString() {
      return Variable.string(this.values.map(utils.makePreserveMissing(
         function(val) { return '' + val; }
      )));
   };

   /**
    * Return the values(s) indicated by `i`.  (Keep in mind that Variables
    * are indexed from 1.)
    *
    * - if `i` is a positive integer, return the value at index `i`.
    * - if `i` is an array of non-negative integers, return an array of
    * the corresponding values (skipping indices of value 0).
    * - if `i` is an array of non-positive integers, return an array of
    * all values of `this` except those indicated by the negative indices.
    * - if `i` is a scalar variable, it is converted into an array.
    * - if `i` is a logical variable, it must have the same length as `this`, in
    * which case, return an array of the values which correspond to the `true`
    * values in `i`.
    */
   Variable.prototype.get = function get(i) {
      return this._get(normalizeIndices(this, i));
   };

   Variable.prototype._get = function _get(i) {
      return utils.isMissing(i) ? this.values.toArray() : this.values.get(i);
   };

   Variable.prototype.toArray = function toArray() {
      return this.get();
   };

   Variable.prototype.toVector = function toVector() {
      return this.values;
   };
   /**
     * Set the entries indicated by `i` to the values indicated by `val`.
     * (Keep in mind that Variables are indexed from 1.)
     *
     * `val` may be a single value, or a `Variable` or array of values of
     * the appropriate length.
     *
     * - if `i` is a positive integer, set the value at index `i`.
     * - if `i` is an array of non-negative integers, set
     * the corresponding values (skipping indices of value 0).
     * - if `i` is an array of non-positive integers, set
     * all values of `this` except those indicated by the negative indices.
     * - if `i` is a scalar variable, it is converted into an array.
     * - if `i` is a logical variable, it must have the same length as `this`, in
     * which case, we set the values which correspond to the `true` values in `i`.
     *
     * In all cases, if there are any null/undefined/NaN indices, an error occurs.
     *
     * To set values out of bounds, you are required to call resize first.
     */
   Variable.prototype.set = function set(i, val) {
      if (val instanceof Variable) {
         val = val.get();
      } else {
         val = normalizeValue(val); // Values from Variable#get already normalized
      }
      i = normalizeIndices(this, i);
      /* eslint-disable no-extra-parens */
      if (utils.isMissing(i) || (Array.isArray(i) && utils.hasMissing(i))) {
      /* eslint-enable */
         throw new Error('Missing indices not allowed in "set"');
      }
      return this._set(i, val);
   };

   Variable.prototype._set = function _set(i, val) {
      this.values.set(i, val);
      return this;
   };

   Variable.prototype.length = function length() {
      return this.values.length;
   };

   Variable.prototype.names = function names(newNames) {
      if (arguments.length === 0) { return this._names; }
      this._names = utils.isMissing(newNames) || !newNames ?
                        utils.missing : Variable.string(newNames).resize(this.length());
      return this;
   };

   /**
    * Clone `this`, creating a new variable with the same values,
    * mode, and label.
    */
   Variable.prototype.clone = function clone() {
      return this.reproduce(this.values.clone(), this.names());
   };

   /**
    * Return a new variable with all the same settings as `this`
    * but with values taken from `newValues`, which may be
    * a `Vector`, or an array.
    *
    * Note: If `this` is a factor or an ordinal variable, it is
    * assumed that the new values are codes which are in agreement
    * with the system of codes for `this`.
    *
    * If newNames is provided (variable/vector/array), it is used as the
    * names for the new variable.
    */
   Variable.prototype.reproduce = function reproduce(newValues, newNames) {
      var newVar;
      newVar = new Variable(newValues, {
         mode: this.mode(), label: this.label
      });
      return newNames ? newVar.names(newNames) : newVar;
   };

   /**
    * Repeats a variable according to a pattern to make a new variable.
    * `times` can be used in several different ways, depending on its type.
    * - `times` is a number: repeat the variable that many times
    * - `times` is a variable or array: use the values as frequencies for
    * corresponding entries.  `times` must have same length as `this`
    * - `times` is an object with a `length` property: cycle the values in `this`
    * until length `length` is filled
    * - `times` is an object with an `each` property: repeats each value that
    * many times (before going on to the next value)
    */
   Variable.prototype.rep = function rep(times) {
      if (times instanceof Variable) { times = times.values; }
      if (utils.isMissing(this._names)) {
         return this.reproduce(this.values.rep(times));
      }
      return this.reproduce(this.values.rep(times),
                            this.names().values.rep(times));
   };

   /**
    * Resize `this`.
    * If fill is `true`, recycle the values to reach the new length, `length`.
    * If fill is `false` or omitted, the new values will be `NaN`.
    */
   Variable.prototype.resize = function resize(length, fill) {
      if (fill !== true) { fill = function(i) { return utils.missing; }; }
      this.values = this.values.resize(length, fill);
      if (!utils.isMissing(this._names)) {
         this._names = this._names.resize(length);
      }
      return this;
   };

   /**
    * See `Variable.concat`.
    */
   Variable.prototype.concat = function concat(vars) {
      vars = [].slice.call(arguments);
      vars.unshift(this);
      return Variable.concat.apply(null, vars);
   };

   // Iterators

   // skipMissing defaults to false
   Variable.prototype.each = function each(f, skipMissing) {
      var f2;
      f2 = skipMissing !== true ? f :
               function(val, i) { if (utils.isNotMissing(val)) { f(val, i); } };
      this.values.each(f2);
   };

   // skipMissing defaults to false
   Variable.prototype.reduce = function reduce(f, initial, skipMissing) {
      var f2;
      f2 = skipMissing !== true ? f :
            function(acc, val, i) { return utils.isMissing(val) ? acc : f(acc, val, i); };
      return utils.singleMissing(this.values.reduce(f2, initial));
   };

   /** skipMissing defaults to false. If it is true, missings automatically map to missing
    * and f is only applied to non-missing values. `mode` must be a string if specified.
    * Both skipMissing and mode are optional.
    */
   Variable.prototype.map = function map(f, skipMissing, mode) {
      var f2;
      if (arguments.length === 2 && typeof skipMissing === 'string') {
         mode = skipMissing;
         skipMissing = false;
      }
      if (mode) { mode = { 'mode': mode }; }
      f2 = skipMissing !== true ? f : utils.makePreserveMissing(f);
      return (new Variable(this.values.map(f2), mode)).names(this.names());
   };

   /**
    * Given a predicate, `pred(val, i)`, return a `Variable` of the values from `this`
    * which pass the predicate.
    */
   Variable.prototype.filter = function filter(pred) {
      var arr;
      arr = [];
      this.values.each(function(val, i) {
         if (pred(val, i)) { arr.push(i); }
      });
      return !utils.isMissing(this._names) ?
         this.reproduce(this.values.get(arr), this.names().get(arr)) :
         this.reproduce(this.values.get(arr));
   };

   /**
    * Return a `Variable` of the non-null values from `this`.
    */
   Variable.prototype.nonMissing = function nonMissing() {
      return this.filter(utils.isNotMissing);
   };

   Variable.prototype.hasMissing = function hasMissing() {
      return utils.hasMissing(this.toArray());
   };

   Variable.prototype.sameLength = function sameLength(other) {
      return this.values.length === other.values.length;
   };

   // Helper methods

   /* Helper method to standardize values. All nan/missing/undefined turns to null.
    * `val` can be an array or a single value. */
   function normalizeValue(val) {
      var i;
      if (!Array.isArray(val)) { return utils.singleMissing(val); }
      for (i = 0; i < val.length; i += 1) { val[i] = utils.singleMissing(val[i]); }
      return val;
   }

   /* eslint-disable complexity */
   /* `v` is the Variable that these indices are meant to index.
    * `ind` can be: single value, array, vector, logical variable,
    * scalar variable (other variables turned scalar). Returns the indices as an array of
    * the positions we are interested in, with `NaN`s in for any "missing" indices.
    */
   function normalizeIndices(v, ind) {
      var allNonPos, allNonNeg;
      if (ind instanceof Variable) {
         if (ind.mode() === 'logical') {
            if (!v.sameLength(ind)) { throw new Error('incompatible lengths'); }
            ind = ind.which();    // to scalar variable
         }
         ind = ind.values;        // to vector
      }
      if (ind instanceof Variable.Vector) { ind = ind.get(); } // to array
      ind = normalizeValue(ind);
      // single numbers fall through to end
      if (Array.isArray(ind)) {
         allNonPos = ind.every(function(v) { return !(v > 0); });
         allNonNeg = ind.every(function(v) { return !(v < 0); });
         if (allNonPos) {
            ind = v.values.map(function(val, k) {
               return ind.indexOf(-k) === -1 ? k : 0;
            }).toArray();
         } else if (!allNonNeg) {
            throw new Error('Cannot use both positive and negative indices.');
         }
         // ind contains only null, nonnegative integers at this point
         ind = ind.filter(function(v) { return v !== 0; }); // drop the zeros
      }
      return ind;
   }
   /* eslint-enable */

   // values is an array!
   function inferMode(values) {
      var i = 0;
      while (i < values.length && utils.isMissing(values[i])) { i += 1; }
      if (i >= values.length || typeof values[i] === 'number') { return 'scalar'; }
      return typeof values[i] === 'boolean' ? 'logical' : 'factor';
   }

   /*
    * Given two mode strings `m1` and `m2`, returns the 'least common mode'.
    * Helper for the `concat` method and possibly others.
    * For example, _lcMode('factor', 'logical') would be 'scalar'.
    */
   function _lcMode(m1, m2) {
      if (m1 === 'ordinal') { m1 = 'factor'; }
      if (m2 === 'ordinal') { m2 = 'factor'; }
      if (m1 === m2) { return m1; }
      if (m1 === 'string' || m2 === 'string') { return 'string'; }
      return 'scalar';
   }

   return Variable;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
