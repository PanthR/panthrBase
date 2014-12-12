/**
 * Representation of "statistics" Variables
 * @module Variable
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var Vector, utils;

   utils = require('./utils');

   /**
    * Create a new variable. `values` is one of the following:
    * - an array or vector with the desired values,
    * - a variable (which is simply cloned)
    * - a function `f(i)` for generating the values, in which case `length` is
    *   a required option.
    * `options` is an object indicating properties of the variable:
    *  - `length`: Will be ignored if `values` is not a function
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
    *
    * If `values` is a `Variable` it will simply be cloned (`options` will be ignored).
    */
   function Variable(values, options) {
      var ret;
      if (values instanceof Variable) { return values.clone(); }
      options = utils.getDefault(options, {});
      if (typeof values === 'function') {
         if (utils.isMissing(options.length)) {
            throw new Error('Variable definition via function requires length option');
         }
         values = new Vector(values, options.length);
      }
      values = Variable.ensureArray(values);
      options.mode = utils.getOption(options.mode, Object.keys(Variable.modes)) ||
                     inferMode(values);
      ret = new Variable.modes[options.mode](values, options);
      ret._names = utils.missing;
      ret.label = options.label || '';
      return ret;
   }

   Variable.prototype = Object.create({});

   Variable.Vector      = require('linalg-panthr').Vector;
   Vector = Variable.Vector;
   Variable.Matrix      = require('linalg-panthr').Matrix;
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

   /**
    * Create a scalar variable. `label` is optional.
    */
   Variable.scalar = function scalar(values, label) {
      return new Variable(values, { mode: 'scalar', label: label });
   };

   /**
    * Create a logical variable. `label` is optional.
    */
   Variable.logical = function logical(values, label) {
      return new Variable(values, { mode: 'logical', label: label });
   };

   /**
    * Create a string variable. `label` is optional.
    */
   Variable.string = function string(values, label) {
      return new Variable(values, { mode: 'string', label: label });
   };

   /**
    * Create a factor variable. `label` is optional.
    */
   Variable.factor = function factor(values, label) {
      return new Variable(values, { mode: 'factor', label: label });
   };

   /**
    * Create an ordinal variable. `levels` and `label` are optional. If `levels`
    * is omitted, an alphabetical ordering of the levels will be used.
    */
   Variable.ordinal = function ordinal(values, levels, label) {
      return new Variable(values,
         Array.isArray(levels) ? { mode: 'ordinal', levels: levels, label: label }
                               : { mode: 'ordinal', label: levels }
      );
   };

   /**
    * Create a date-time variable. `label` is optional.
    */
   Variable.dateTime = function dateTime(values, label) {
      return new Variable(values, { mode: 'date', label: label });
   };

   /**
    * Create a new variable with values `f(from), f(from+1), ..., f(to)`.
    * The `options` parameter is passed to the `Variable` constructor.
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
    * Can be called as:
    * - `seq(to[, options])` where `from` equals 1
    * - `seq(from, to[, options])` where `step` equals -1 or +1
    * - `seq(from, to, step[, options])`
    * `step` must have the same sign as `to - from`.
    * `options` parameter is an optional options object that is passed to the
    * `Variable` constructor
    *
    *     seq(5)            // [1, 2, 3, 4, 5]
    *     seq(5, 7.5)       // [5, 6, 7]
    *     seq(4, 1.2)       // [4, 3, 2]
    *     seq(5.1, 6.1, .5) // [5.1, 5.6, 6.1]
    *     seq(4, 1.2, -2)   // [4, 2]
    */
   Variable.seq = function seq(from, to, step, options) {
      var args, v;
      args = Array.prototype.slice.call(arguments);
      if (typeof args[args.length - 1] === 'object') {
         options = args.pop();
      }
      v = Vector.seq.apply(null, args);
      return new Variable(v, options);
   };

   /**
    * Concatenate the inputs into a single variable. All inputs must be variables,
    * and a common mode will be inferred based on the variable modes:
    *   - Variables of mode ordinal are treated as having mode factor
    *   - If one of the variables is of mode string, the result is of mode string
    *   - If all variables have the same mode, the result is of that mode
    *   - Otherwise the result is of mode scalar
    */
   Variable.concat = function concat(vars) {
      var commonMode, converters, names;
      if (arguments.length === 0) { return Variable.scalar([]); }
      if (arguments.length === 1) { return arguments[0]; }
      vars = [].slice.call(arguments);  // at least 2 variables
      commonMode = vars.map(function(v) { return v.mode(); }).reduce(_lcMode);
      converters = {
         'scalar': function(v) { return v.asScalar(); },
         'string': function(v) { return v.asString(); },
         'factor': function(v) { return v.asString(); }
      };
      // make all vars the same type & concatenate their values and names
      names = utils.missing;
      if (!vars.every(function(v) {
         return utils.isMissing(v.names());
      })) {
         names = [].concat.apply([], vars.map(function(v) {
            return utils.getDefault(v.names(),
              Vector.const(utils.missing, v.length())
            ).toArray();
         }));
      }
      if (converters[commonMode]) { vars = vars.map(converters[commonMode]); }
      vars = vars.map(function(v) { return v.get(); });  // array of arrays
      return (new Variable([].concat.apply([], vars), { mode: commonMode }))
                             .names(names);
   };

   // The following methods used to simplify other methods

   /**
    * Convert `val` into a (Javascript) array, with "missing values"
    * replaced by `utils.missing`. The argument may be:
    *   - A single number
    *   - A value that is `utils.isMissing`  (`NaN`, `null`, `undefined`)
    *   - An array, `Vector` or `Variable`
    */
   Variable.ensureArray = function ensureArray(val) {
      val = Variable.oneDimToArray(val);
      if (!Array.isArray(val)) { val = [val]; }
      return normalizeValue(val);
   };

   /**
    * Convert `val` into an array, if `val` is "one-dimensional"
    * (`Variable`, `Vector`, array).
    * Non-one-dimensional arguments are returned unchanged.
    */
   Variable.oneDimToArray = function oneDimToArray(val) {
      return utils.isOfType(val, [Variable, Vector]) ? val.get() : val;
   };
   /**
    * Convert `val` into a `Vector`, if `val` is "one-dimensional"
    * (`Variable`, `Vector`, array).
    * Non-one-dimensional arguments are returned unchanged.
    */
   Variable.oneDimToVector = function oneDimToVector(val) {
      if (val instanceof Variable) { val = val.get(); }
      return Array.isArray(val) ? new Vector(val) : val;
   };
   /**
    * Convert `val` into a `Variable`, if `val` is "one-dimensional"
    * (`Variable`, `Vector`, array).
    * Non-one-dimensional arguments are returned unchanged.
    */
   Variable.oneDimToVariable = function oneDimToVariable(val) {
      if (Array.isArray(val)) { return new Variable(val); }
      return val instanceof Vector ? new Variable(val) : val;
   };

   /**
    * Convert the variable to scalar mode.
    *
    * For factor variables, the codes are used.
    */
   Variable.prototype.asScalar = function asScalar() {
      return new Variable(this.values);
   };

   /**
    * Convert the variable to string mode.
    *
    * For factor variables, the values are used.
    */
   Variable.prototype.asString = function asString() {
      return Variable.string(this.values.map(utils.makePreserveMissing(
         function(val) { return '' + val; }
      )));
   };

   /**
    * Return the values(s) indicated by `i`.  (Keep in mind that variables
    * are indexed starting from 1.)
    *
    * - If `i` is a positive integer, return the value at index `i`.
    * - If `i` is an array of non-negative integers, return an array of
    * the corresponding values (skipping indices of value 0).
    * - If `i` is an array of non-positive integers, return an array of
    * all values of the variable except those indicated by the negative indices.
    * - If `i` is a scalar variable, it is converted into an array.
    * - If `i` is a logical variable, it must have the same length as the original
    * variable, in which case, return an array of the values which correspond to the
    * `true` values in `i`.
    *
    * For factor variables, the values are returned, not the codes.
    */
   Variable.prototype.get = function get(i) {
      return this._get(normalizeIndices(this, i));
   };

   Variable.prototype._get = function _get(i) {
      return utils.isMissing(i) ? this.values.toArray() : this.values.get(i);
   };

   /**
    * Return a Javascript array of the values of the variable.
    *
    * For factor variables, the values are returned.
    */
   Variable.prototype.toArray = function toArray() {
      return this.get();
   };

   /**
    * Return a `Vector` of the values of the variable.
    *
    * For factor variables, the codes are returned.
    */
   Variable.prototype.toVector = function toVector() {
      return this.values;
   };

   /**
     * Set the entries indicated by `i` to the values indicated by `val`.
     * (Keep in mind that Variables are indexed starting from 1.)
     *
     * `val` may be a single value, or a `Variable` or array of values of
     * the appropriate length.
     *
     * - If `i` is a positive integer, set the value at index `i`.
     * - If `i` is an array of non-negative integers, set
     * the corresponding values (skipping indices of value 0).
     * - If `i` is an array of non-positive integers, set
     * all values of the variable except those indicated by the negative indices.
     * - If `i` is a scalar variable, it is converted into an array.
     * - If `i` is a logical variable, it must have the same length as the original
     * variable, in which case set the values which correspond to the `true`
     * values in `i`.
     *
     * In all cases, if there are any null/undefined/NaN indices, an error occurs.
     *
     * This method cannot be used to append values. To set values out of bounds,
     * call `Variable#resize` first.
     */
   Variable.prototype.set = function set(i, val) {
      i = normalizeIndices(this, i);
      val = val instanceof Variable ? val.get() : normalizeValue(val, i);
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

   /** Return the length of the variable. */
   Variable.prototype.length = function length() {
      return this.values.length;
   };

   /**
    * Called with no arguments, return the names associated with the variable's
    * entries.
    *
    * Otherwise `newNames` is passed to the `Variable` constructor to create a
    * string variable of the new names.
    *
    * If the provided names do not have the correct length, `Variable#resize`
    * will be used on the names.
    */
   Variable.prototype.names = function names(newNames) {
      var len = this.length();
      if (arguments.length === 0) { return this._names; }
      this._names = utils.optionMap(newNames,
         function(names) { return Variable.string(names).resize(len); }
      );
      return this;
   };

   /**
    * Clone the variable, creating a new variable with the same values and mode.
    */
   Variable.prototype.clone = function clone() {
      return this.select(Vector.seq(this.length()));
   };

   /*
    * Only usable for factor and ordinal variables.
    *
    * When called with no argument, return an array of the levels.
    * When called with an array `arr` as the argument, use `arr`
    * to set the levels.
    *
    * Duplicates in `arr` are ignored.
    */
   Variable.prototype.levels = function levels(arr) {
      throw new Error('"levels" only applicable for factor/ordinal variables');
   };

   /*
    * Only usable for factor and ordinal variables.
    *
    * Given an array of string `values`, return the
    * corresponding array of numerical codes.
    */
   Variable.prototype.getCodes = function getCodes(values) {
      throw new Error('"getCodes" only applicable for factor/ordinal variables');
   };

   /*
    * Only usable for logical variables.
    *
    * Return a scalar variable of the indices that correspond to `true` entries.
    */
   Variable.prototype.which = function which() {
      throw new Error('"which" only applicable for logical variables');
   };

   /**
    * Return a new variable with all the same settings as the original
    * but with values taken from `newValues`, which may be
    * a `Vector` or an array.
    *
    * Note: If the variable is a factor or an ordinal variable, it is
    * assumed that the new values are codes which are in agreement
    * with the codes used by the variable.
    *
    * If `newNames` is provided, it must be one-dimensional (`Variable`, `Vector`
    * or array) and it is used to set names for the new variable.
    */
   Variable.prototype.reproduce = function reproduce(newValues, newNames) {
      var newVar;
      newVar = new Variable(newValues, {
         mode: this.mode(), label: this.label
      });
      return newNames ? newVar.names(newNames) : newVar;
   };

   /**
    * From a given array or `Vector` of indices, create a new variable based on the
    * values of the original variable corresponding to those indices.
    */
   Variable.prototype.select = function select(indices) {
      indices = Variable.oneDimToArray(indices);
      return !utils.isMissing(this._names) ?
         this.reproduce(this.values.get(indices), this.names().get(indices)) :
         this.reproduce(this.values.get(indices));
   };

   /**
    * Repeat a variable according to a pattern to make a new variable.
    * `times` can be used in several different ways, depending on its type:
    * - If `times` is a number, repeat the variable that many times.
    * - If `times` is a variable or array, use the values as frequencies for
    * corresponding entries. `times` must have same length as the original variable.
    * - If `times` is an object with a `length` property, cycle the values in the
    * variable up to the specified length.
    * - If `times` is an object with an `each` property, repeat each value that
    * many times (before going on to the next value).
    */
   Variable.prototype.rep = function rep(times) {
      if (times instanceof Variable) { times = times.values; }
      return this.select(Vector.seq(this.length()).rep(times));
   };

   /**
    * Resize the variable.
    * If fill is `true`, recycle the values to reach the specified length.
    * If fill is `false` or omitted, the new values will be filled with `utils.missing`.
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

   /**
    * Apply the function `f(val, i)` to each value in the variable.
    * If `skipMissing` is set to `true` (default is `false`), it will only apply
    * `f` to non-missing values (as determined by `utils.isNotMissing`).
    */
   Variable.prototype.each = function each(f, skipMissing) {
      var f2;
      f2 = skipMissing !== true ? f :
               function(val, i) { if (utils.isNotMissing(val)) { f(val, i); } };
      this.values.each(f2);
   };

   /**
    * Apply the function `f(acc, val, i)` to each value in the variable, accumulating
    * the result to be returned.
    * If `skipMissing` is set to `true` (default is `false`), it will only apply
    * `f` to non-missing values (as determined by `utils.isNotMissing`).
    *
    * Similar to Javascript's `Array.prototype.reduce`.
    */
   Variable.prototype.reduce = function reduce(f, initial, skipMissing) {
      var f2;
      f2 = skipMissing !== true ? f :
            function(acc, val, i) { return utils.isMissing(val) ? acc : f(acc, val, i); };
      return utils.singleMissing(this.values.reduce(f2, initial));
   };

   /**
    * Create a new variable from the results of applying the function `f(val, i)` to the
    * values of the original variable. If `skipMissing` is set to `true` (default is `false`),
    * then missing values will be preserved, and `f` will only be applied to the non-missing
    * values. The optional parameter `mode` specifies the desired mode of the new variable.
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
    * Given a predicate `pred(val, i)`, return a new variable containing
    * those values from the original variable that satisfy the predicate.
    */
   Variable.prototype.filter = function filter(pred) {
      var arr;
      arr = [];
      this.values.each(function(val, i) {
         if (pred(val, i)) { arr.push(i); }
      });
      return this.select(arr);
   };

   /**
    * Return a new variable containing the non-missing values from the original
    * variable as indicated by `utils.isNotMissing`.
    */
   Variable.prototype.nonMissing = function nonMissing() {
      return this.filter(utils.isNotMissing);
   };

   /**
    * Return a boolean indicating whether the variable contains missing values
    * as indicated by `utils.isMissing`.
    */
   Variable.prototype.hasMissing = function hasMissing() {
      return utils.hasMissing(this.toArray());
   };

   /**
    * Return a boolean indicating whether the variable has the same length
    * as the variable `other`.
    */
   Variable.prototype.sameLength = function sameLength(other) {
      return this.values.length === other.values.length;
   };

   // Helper methods

   /*
    * Helper method to standardize values. All nan/missing/undefined turns to null.
    * `val` can be an array or a single value or a function of `i`.
    */
   function normalizeValue(val, ind) {
      var i;
      if (typeof val === 'function') {
         return Array.isArray(ind) ? ind.map(val) : val(ind);
      }
      if (!Array.isArray(val)) { return utils.singleMissing(val); }
      for (i = 0; i < val.length; i += 1) { val[i] = utils.singleMissing(val[i]); }
      return val;
   }

   /*
    * `v` is the Variable that these indices are meant to index.
    * `ind` can be: single value, array, vector, logical variable,
    * scalar variable (other variables turned scalar). Returns the indices as an array of
    * the positions we are interested in, with `NaN`s in for any "missing" indices.
    */
   function normalizeIndices(v, ind) {
      var allNonPos, allNonNeg;
      if (ind instanceof Variable && ind.mode() === 'logical') {
         if (!v.sameLength(ind)) { throw new Error('incompatible lengths'); }
         ind = ind.which();    // to scalar variable
      }
      ind = normalizeValue(Variable.oneDimToArray(ind));
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
