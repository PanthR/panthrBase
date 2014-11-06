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
          isOfType(values, [List, Variable, Variable.Vector, Variable.Matrix])) {
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
    * If only one argument, it is interpreted as columns
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
    * If called with only a column specification, and that column being a single number or name
    * then the function returns a variable that is a clone of that column.
    * If given two single values, returns the corresponding single value at the i-th row/j-th column.
    * Otherwise the function returns a dataset that contains copies of the appropriate entries.
    * Called with no arguments, the function returns an array of arrays representing the columns.
    */
   Dataset.prototype.get = function get(rows, cols) {
      var that = this;
      if (arguments.length === 0) { return this.toArray(); }
      if (arguments.length === 1) {
         cols = rows;
         rows = true;
      }
      // return single value
      if (typeof cols === 'string' || typeof cols === 'number') {
         if (typeof rows === 'number') {
            return List.prototype.get.call(that, cols).get(rows);
         }
         return List.prototype.get.call(that, cols).select(getRows(rows, that));
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

   /**
    * See `Dataset#get` for how to use `rows` and `cols` to specify the positions to
    * be set.  If only two arguments are provided, `rows` defaults to true.
    * `vals` is used to specify new values in one of the following ways:
    *   - a single value (to be used in all specified positions)
    *   - a `Variable` / `Vector` / array (can only be used to set in a single column)
    *   - a `Dataset` / `Matrix` (whose dims match those of the selected region)
    *   - a function `f(i, j, name)` where `i` is a row number, `j` is a column number,
    *     and `name` is a column name.
    * This method should be called with at least 2 arguments.
    * Note: If called with 2 arguments where the first is a number and the
    * second is a variable, `set` with replace the old column variable with the
    * one being provided.
    */
   Dataset.prototype.set = function set(rows, cols, vals) {
      var that = this;
      if (arguments.length === 2) {
         vals = cols;
         cols = rows;
         rows = true;
         if (vals instanceof Variable &&
            (typeof cols === 'number' || typeof cols === 'string') &&
            vals.length() === this.nrow) {
            List.prototype.set.call(that, cols, vals.clone());
         }
      }
      cols = getColumns(cols, that);
      rows = getRows(rows, that);
      vals = getValsFunction(vals, that, rows, cols);
      // From this point on, `vals` is a function: `vals(i, j, name)`.
      (Array.isArray(cols) ? cols : [cols]).forEach(function(j) {
         List.prototype.get.call(that, j).set(rows, function(i) {
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
      if (this === values) { values = values.clone(); }
      if (Array.isArray(values)) { values = new Variable.Vector(values); }
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
      this.each(function(val, j) {
         val.resize(oldnrow + rows, false);
      });
      return this.set(function(row, i) { return i > oldnrow; }, true, values);
   };

   /**
   /** Clone the dataset */
   Dataset.prototype.clone = function clone() {
      return new Dataset(this);
   };

    * Return an array of arrays representing the columns.
    */
   Dataset.prototype.toArray = function toArray() {
      return this.values.slice(1).map(function(val) {
         return val.get();
      });
   };

   // test if v is one of some list of types (an array)
   function isOfType(v, types) {
      return types.some(function(t) { return v instanceof t; });
   }
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

   /* eslint-disable complexity */
   /**
    * Given a columns specification, and a dataset `that`, returns the
    * corresponding array of column indices. See `Dataset#get`.
    */
   function getColumns(cols, that) {
      if (cols instanceof Variable.Vector) { cols = cols.get(); }
      if (Array.isArray(cols)) { cols = new Variable(cols); }
      if (cols instanceof Variable) {
         if (cols.mode() === 'logical') {
            if (that.ncol !== cols.length()) {
               throw new Error('Logical vector does not match nCol');
            }
            cols = cols.which();    // to scalar variable
         }
         return cols.get();         // to array
      }
      if (cols === true) { return utils.seq(that.length()); }
      if (typeof cols === 'function') {
         return utils.seq(that.length()).filter(function(j) {
            return cols(that._names[j], j);
         });
      }
      return cols;
   }

   /**
    * Given a row specification, and a dataset `that`, returns the
    * corresponding array of row indices. See `Dataset#get`.
    */
   function getRows(rows, that) {
      if (rows instanceof Variable.Vector) { rows = rows.get(); }
      if (Array.isArray(rows)) { rows = new Variable(rows); }
      if (rows instanceof Variable) {
         if (rows.mode() === 'logical') {
            if (that.nrow !== rows.length()) {
               throw new Error('Logical vector does not match nRow');
            }
            rows = rows.which();    // to scalar variable
         }
         return rows.get();
      }
      if (rows === true) { return utils.seq(that.nrow); }
      if (typeof rows === 'function') {
         return utils.seq(that.nrow).filter(function(i) {
            // rows here meant to be rows(row, i)
            return rows(function(j) {
               return that.get(j).get(i);
            }, i);
         });
      }
      return [rows];
   }

   // Given a vals specification (for #set), returns a function
   // Also validates dimensions for the region and the values
   function getValsFunction(vals, that, rows, cols) {
      if (typeof vals === 'function') { return vals; }
      if (vals instanceof Variable.Matrix || vals instanceof Dataset) {
         if (!Array.isArray(cols)) {
            throw new Error('two-dimensional set requires multiple columns');
         }
         if (rows.length !== vals.nrow || cols.length !== vals.ncol) {
            throw new Error('incompatible dims in two-dimensional Dataset set');
         }
         rows = utils.arrayToObject(rows);
         cols = utils.arrayToObject(cols);
         return function(i, j) {
            return vals.get(rows[i], cols[j]);
         };
      }
      if (Array.isArray(vals)) { vals = new Variable.Vector(vals); }
      if (vals instanceof Variable) { vals = vals.toVector(); }
      if (vals instanceof Variable.Vector) {
         if (Array.isArray(cols)) {
            throw new Error('one-dimensional set requires single column');
         }
         if (rows.length !== vals.length) {
            throw new Error('incompatible lengths in one-dimensional Dataset set');
         }
         rows = utils.arrayToObject(rows);
         return function(i) {
            return vals.get(rows[i]);
         };
      }
      // single value
      return function() { return vals; };
   }
   /* eslint-enable complexity */

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
