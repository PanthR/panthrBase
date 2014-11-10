/**
 * Representation of "statistics" Datasets
 * @module Dataset
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 * Bill Altermatt <altermattw@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var List, Variable, utils;

   List     = require('./list');
   Variable = require('./variable');
   utils    = require('./utils');
   /**
    * See `List` for options for `values`.
    * An extra requirement is that all "variables" should have same length.
    * If `values` is a `List`,`Vector`, or `Matrix`, it will be
    * 'unpacked' to create the columns of the `Dataset`.
    * If multiple arguments are provided, they are wrapped in an array.
    */
   function Dataset(values) {
      if (arguments.length > 1 ||
          utils.isOfType(values, [List, Variable, Variable.Vector, Variable.Matrix])) {
         values = [].slice.call(arguments);
      }
      List.call(this, values);
      normalizeList(this).unnest(Infinity);
      // clone each variable
      this.each(function(val, i) {
         List.prototype.set.call(this, i, new Variable(val));
      }.bind(this));
      validateLengths(this);
      this.ncol = this.length();
      this.nrow = this.ncol === 0 ? 0 : this.values[1].length();
      return this;
   }

   Dataset.prototype = Object.create(List.prototype);

   /**
    * Used to get a single column (variable).
    */
   Dataset.prototype.getVar = function getVar(col) {
      return List.prototype.get.call(this, col).clone();
   };

   /**
    * Can be called with two arguments, or no arguments.
    * `cols` can be:
    *    - A string/number or array/variable/vector of strings/numbers/bools
    *    - A predicate that has form `pred(colName, j)`, and must return true for
    *      those columns that are to be included in the get.
    *    - The boolean `true`, indicating all columns should be used.
    * `rows` can be:
    *    - A number or array/variable/vector of numbers/bools
    *    - A predicate that has form `pred(row, i)`, where `row` is a function such
    *      that `row(j)` returns the entry in the i-th row and the j-th column, while
    *      `row(colName)` returns the entry in the i-th row and the column named `colName`.
    *    - The boolean `true`, indicating all rows should be used.
    * If given two single values, returns the corresponding single value at the i-th row/j-th column.
    * Otherwise the function returns a dataset that contains copies of the appropriate entries.
    * Called with no arguments, the function returns an array of arrays representing the columns.
    */
   Dataset.prototype.get = function get(rows, cols) {
      var that = this;
      if (arguments.length === 0) { return that.toArray(); }
      // return single value
      if (typeof cols === 'string' || typeof cols === 'number') {
         if (typeof rows === 'number') {
            return that.getVar(cols).get(rows);
         }
         return that.getVar(cols).select(getRows(rows, that));
      }
      cols = getColumns(cols, that);
      rows = getRows(rows, that);
      // At this point: cols and rows are both arrays of the ones to be
      // gotten.
      return (new Dataset(cols.map(function(col) {
         return List.prototype.get.call(that, col).select(rows);
      }))).names(cols.map(function(col) {
         return typeof col === 'string' ? col : that.names(col);
      }));
   };

   /** Used to replace a single variable */
   Dataset.prototype.setVar = function setVar(col, val) {
      val = Variable.oneDimToVariable(val);
      if (!(val instanceof Variable)) {
         throw new Error('Can only setVar with one-dimensional value');
      }
      if (val.length() !== this.nrow) {
         throw new Error('Attempting to setVar with variable of wrong length');
      }
      return List.prototype.set.call(this, col, val.clone());
   };

   /**
    * See `Dataset#get` for how to use `rows` and `cols` to specify the positions to
    * be set. You are required to provide all 3 arguments.
    * `vals` is used to specify new values in one of the following ways:
    *   - a single value (to be used in all specified positions)
    *   - a `Variable` / `Vector` / array (only works within one row or one column)
    *   - a `Dataset` / `Matrix` (whose dims match those of the selected region)
    *   - a function `f(i, j, name)` where `i` is a row number, `j` is a column number,
    *     and `name` is a column name.
    */
   Dataset.prototype.set = function set(rows, cols, vals) {
      var that = this;
      cols = getColumns(cols, this);
      rows = getRows(rows, this);
      vals = getValsFunction(vals, this, rows, cols);
      // From this point on, `vals` is a function: `vals(i, j, name)`.
      cols.forEach(function(j) {
         var myVar = List.prototype.get.call(that, j);
         myVar.set(rows, function(i) {
            return vals(i, j, that.names(j));
         });
      });
      return this;
   };

   /**
    * Called with one argument: It needs to be a (2-dimensional) matrix/dataset or
    * a (1-dimensional) array/vector, and then number rows will be inferred.
    * Called with two arguments: The first is the number of rows to add. The second is
    * a single value or a function.
    * function form: `f(i, j, colName)`
    */
   Dataset.prototype.appendRows = function appendRows(rows, values) {
      var oldnrow;
      if (arguments.length === 1) {
         values = rows;
         rows = values.nrow == null ? 1 : values.nrow;
      }
      values = this === values ? values.clone()
                               : Variable.oneDimToVector(values);
      if (values instanceof Variable.Vector) {
         values = new Variable.Matrix(values.get(), { byRow: true, nrow: 1 });
      }
      if (values.ncol != null && values.ncol !== this.ncol) {
         throw new Error('Incompatible dimensions for appendRows.');
      }
      oldnrow = this.nrow;
      if (typeof values === 'function') {
         values = (function(oldValues) {
            return function (i, j, colName) {
               return oldValues(i - oldnrow, j, colName);
            };
         }(values));
      }
      this.nrow += rows;
      this.each(function(val, j) { val.resize(oldnrow + rows, false); });
      return this.set(function(row, i) { return i > oldnrow; }, true, values);
   };

   /** Clone the dataset */
   Dataset.prototype.clone = function clone() {
      return new Dataset(this);
   };

   /**
    * Return an array of arrays representing the columns.
    */
   Dataset.prototype.toArray = function toArray() {
      return this.values.slice(1).map(function(val) {
         return val.get();
      });
   };

   // Throw error if there are variables of unequal length
   function validateLengths(dSet) {
      dSet.reduce(function(acc, val) {
         if (acc === null) { return val.length(); }
         if (acc !== val.length()) {
            throw new Error('Dataset columns have unequal length.');
         }
         return acc;
      }, null);
      return dSet;
   }

   function normalizeList(list) {
      var listSet;
      listSet = List.prototype.set;
      list.each(function(val, i, name) {
         if (val instanceof List) {
            normalizeList(val);
         } else if (val instanceof Variable.Matrix) {
            listSet.call(list, i, normalizeList(List.call({}, val.toArray())));
         } else if (! (val instanceof Variable)) {
            listSet.call(list, i, new Variable(val));
         }
      });
      return list;
   }

   /*
    * Given a columns specification, and a dataset `that`, returns the
    * corresponding array of column indices. See `Dataset#get`.
    *
    * getColumns will assume it is not given a single number/string.
    * Its callers must have handled that case earlier.
    */
   function getColumns(cols, that) {
      if (cols === true) { return utils.seq(that.length()); }
      if (typeof cols === 'number' || typeof cols === 'string') { return [cols]; }
      if (typeof cols === 'function') {
         return utils.seq(that.length()).filter(function(j) {
            return cols(that._names[j], j);
         });
      }
      cols = Variable.oneDimToVariable(cols);
      if (cols.mode() === 'logical') {
         if (that.ncol !== cols.length()) {
            throw new Error('Logical vector does not match nCol');
         }
         cols = cols.which();    // to scalar variable
      }
      return cols.get();         // to array
   }

   /*
    * Given a row specification, and a dataset `that`, returns the
    * corresponding array of row indices. See `Dataset#get`.
    *
    * getRows may be given a single number, and should be able to handle it
    */
   function getRows(rows, that) {
      if (rows === true) { return utils.seq(that.nrow); }
      if (typeof rows === 'function') {
         return utils.seq(that.nrow).filter(function(i) {
            // rows here meant to be rows(row, i)
            return rows(function(j) {
               return that.getVar(j).get(i);
            }, i);
         });
      }
      if (typeof rows === 'number') { return [rows]; }
      rows = Variable.oneDimToVariable(rows);
      if (rows.mode() === 'logical') {
         if (that.nrow !== rows.length()) {
            throw new Error('Logical vector does not match nRow');
         }
         rows = rows.which();    // to scalar variable
      }
      return rows.get();
   }

   // Given a vals specification (for #set), returns a function
   // Also validates dimensions for the region and the values
   // Both rows and cols are arrays at this point.
   function getValsFunction(vals, that, rows, cols) {
      if (typeof vals === 'function') { return vals; }
      vals = Variable.oneDimToArray(vals);
      if (Array.isArray(vals)) {
         vals = new Variable.Matrix(vals,
            rows.length === 1 ? { nrow: 1 } : { ncol: 1 }
         );
      }
      if (utils.isOfType(vals, [Variable.Matrix, Dataset])) {
         if (rows.length !== vals.nrow || cols.length !== vals.ncol) {
            throw new Error('incompatible dims in two-dimensional Dataset set');
         } else {
            rows = utils.arrayToObject(rows);
            cols = utils.arrayToObject(cols);
            return function(i, j) { return vals.get(rows[i], cols[j]); };
         }
      }
      return function() { return vals; };
   }

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
