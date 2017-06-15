/**
 * Representation of "statistics" Datasets
 * @module Dataset
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {
'use strict';
define(function(require) {

   var List, Variable, utils;

   List = require('./list');
   Variable = require('./variable');
   utils = require('./utils');
   /**
    * Create a dataset out of the provided `values`. A dataset is a `List` whose items
    * are variables of the same length. Unlike lists, datasets are required to have names
    * for all their "columns", and those names are unique.
    *
    * `values` is one more more arguments of the following types:
    * - An object, a `List`, or `Matrix`; in this case it will be 'unpacked' to create
    * the columns of the dataset.
    * - A `Variable` or `Vector`.
    *
    * Properties:
    *   - `nrow`: The number of rows in the dataset (the length of each variable)
    *   - `ncol`: The number of columns in the dataset (the number of variables)
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
      return sanitizeNames(this);
   }

   Dataset.prototype = Object.create(List.prototype);

   /**
    * Get or set the names of the dataset's columns. See `List#names` for
    * details. This method enforces uniqueness of names.
    */
   Dataset.prototype.names = function names(i, newNames) {
      var res;

      res = List.prototype.names.apply(this, [].slice.call(arguments));
      if (res !== this) { return res; }
      return sanitizeNames(this);
   };

   /**
    * Returns a single column, without cloning
    */
   Dataset.prototype.getCol = function getCol(col) {
      return List.prototype.get.call(this, col);
   };
   /**
    * Get a single column (variable). `col` is a positive number or string name.
    */
   Dataset.prototype.getVar = function getVar(col) {
      return this.getCol(col).clone();
   };

   /**
    * Given a row index `i`, return a function `f(col)` which "simulates" row `i`.
    *
    *     l.rowFun(2)('a') // Returns the second value in column 'a'.
    *     l.rowFun(2)(2)   // Returns the second value in the second column.
    */
   Dataset.prototype.rowFun = function rowFun(i) {
      var that;

      that = this;
      return function(j) { return that.getVar(j).get(i); };
   };

   /**
    * Apply the function `f(row, i)` to each row successively. The first argument
    * `row` is a function as provided by `Dataset#rowFun`.
    */
   Dataset.prototype.eachRow = function eachRow(f) {
      Variable.seq(this.nrow).each(function(i) {
         f(this.rowFun(i), i);
      }.bind(this));
   };

   Dataset.prototype.each = function each(f) {
      var i;

      for (i = 1; i <= this.length(); i += 1) {
         f(this.getCol(i), i, this.names(i));
      }
      return this;
   };
   /**
    * Wrapper for `List#each`.
    */
   Dataset.prototype.eachCol = Dataset.prototype.each;

   /**
    * Return a subset of the values in the dataset. This method may be called with
    * no arguments, in which case an array of arrays of the columns is returned.
    * Otherwise, the method requires two arguments, `rows` and `cols`, specifying
    * respectively the rows and columns to be used.
    * - `cols` can be:
    *    - A single number or string. In this case a single column is used.
    *    - The boolean `true`, indicating that all columns should be used.
    *    - A one-dimensional object (`Array`, `Variable`, `Vector`) of numbers, strings
    *      or booleans. In the case where the values are booleans, the length of the
    *      object must match `ncol`.
    *    - A predicate of the form `pred(colName, j)`, which returns true for
    *      those columns that are to be used.
    * - `rows` can be:
    *    - A single number. In this case a single row is used.
    *    - The boolean `true`, indicating all rows should be used.
    *    - An `Array`, `Variable` or `Vector` of numbers or booleans (similar to `cols`)
    *    - A predicate that has form `pred(row, i)`, where `row` is a function as returned
    *      by `Dataset#rowFun`, giving access to the `i`-th row.
    * If given two single values, returns the corresponding single value at the
    * i-th row/j-th column. Otherwise returns a dataset that contains copies of the
    * appropriate entries.
    */
   Dataset.prototype.get = function get(rows, cols) {
      var that;

      that = this;
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

   /**
    * Replace the variable at column `col` with the variable `val`. The length
    * of `val` must match `nrow`.
    */
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
    * Set the values at specified rows and columns, using the values specified by
    * `vals`. See `Dataset#get` for how to use `rows` and `cols` to specify the
    * positions to be set. All 3 arguments are required.
    * `vals` is used to specify new values in one of the following ways:
    *   - A single value (to be used in all specified positions)
    *   - A `Variable`, `Vector` or `Array` (only valid when setting within a single
    *   row or column)
    *   - A `Dataset` or `Matrix` (whose dims match those of the selected region)
    *   - A function `f(i, j, name)` where `i` is a row number, `j` is a column number,
    *     and `name` is a column name.
    */
   Dataset.prototype.set = function set(rows, cols, vals) {
      var that;

      that = this;
      cols = getColumns(cols, this);
      rows = getRows(rows, this);
      vals = getValsFunction(vals, rows, cols);
      // From this point on, `vals` is a function: `vals(i, j, name)`.
      cols.forEach(function(j) {
         var myVar;

         myVar = List.prototype.get.call(that, j);
         myVar.set(rows, function(i) {
            return vals(i, j, that.names(j));
         });
      });
      validateLengths(this, true);

      return this;
   };

   /**
    * Append to the rows of the dataset.
    * When called with one argument, the argument needs to be 2-dimensional
    * (`Matrix` or dataset) or 1-dimensional (`Array`, `Variable` or `Vector`) and then
    * the number rows to be appended will be inferred.
    * When called with two arguments, `rows` is the number of rows to append, and `values`
    * is a single value or a function `f(i, j, colName)` to be used for filling the rows.
    * In the case of a function, the index `i` is relative to the new rows to be added
    * (so `i` is 1 for the first row to be added, 2 for the second row to be added, etc.).
    *
    *     // dSet assumed to be a 2x3 dataset
    *     dSet.appendRows([1, 2, 3]) // Add a single row at row index 3
    *     dSet.appendRows(dSet)      // Add duplicates of the 3 rows
    *     dSet.appendRows(2, function(i, j) { return i + j }); // Adds rows [2,3,4], [3,4,5]
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
            return function(i, j, colName) {
               return oldValues(i - oldnrow, j, colName);
            };
         }(values));
      }
      this.nrow += rows;
      this.each(function(val, j) { val.resize(oldnrow + rows, false); });
      return this.set(function(row, i) { return i > oldnrow; }, true, values);
   };

   /**
    * Append to the columns of the dataset.
    * If called with two arguments, then the first argument is the names for the
    * new columns. If called with only one argument, names will be generated
    * automatically.
    *
    * The `values` argument needs to be one of the following:
    *  - A 2-dimensional object (`Matrix` or `Dataset`).
    *  - A 1-dimensional object (`Array`, `Vector` or `Variable`).
    *  - A `List` of columns to be appended. Corresponding names will be copied over.
    *    In this case, the provided list will be fed into the dataset constructor in
    *    order to deduce the new variables to be appended.
    *  - A function `f(i)` for computing the values in the new column.
    */
   Dataset.prototype.appendCols = function appendCols(names, values) {
      var that, len;

      that = this;
      len = that.length();
      if (arguments.length === 1) {
         values = names;
         names = utils.missing;
      }
      if (typeof values === 'function') {
         values = new Variable(values, { length: that.nrow });
      }
      values = new Dataset(Variable.oneDimToVariable(values));
      if (values.nrow !== this.nrow) {
         throw new Error('mismatch -- Dataset.nrow and num rows in new columns');
      }
      values.eachCol(function(val, i, name) {
         List.prototype.set.call(that, len + i, val).names(len + i, name);
      });
      that.ncol += values.ncol;
      if (!utils.isMissing(names)) {
         Variable.ensureArray(names).forEach(function(name, i) {
            if (len + i + 1 <= that.length()) {
               that.names(len + i + 1, name);
            }
         });
      }
      return sanitizeNames(that);
   };

   /**
    * Given a predicate `pred(row, i)`, return a `Variable` of the row numbers of the
    * rows for which the predicate is `true`.
    */
   Dataset.prototype.which = function which(pred) {
      return new Variable(getRows(pred, this));
   };

   /**
    * Delete the specified rows from the dataset. `rows` may be:
    * - A single number.
    * - A 1-dimensional object.
    * - A predicate function `f(row, i)`.
    */
   Dataset.prototype.deleteRows = function deleteRows(rows) {
      var that, indices;

      that = this;
      if (typeof rows === 'function') { rows = that.which(rows); }
      rows = Variable.ensureArray(rows);
      indices = that.which(function(row, i) { return rows.indexOf(i) === -1; });
      that.nrow = indices.length();
      that.each(function(col, i) { List.prototype.set.call(that, i, col.select(indices)); });
      return that;
   };

   /**
    * Delete the specified columns from the dataset. `cols` may be:
    * - A single number or string name.
    * - A 1-dimensional object of single numbers or string names.
    */
   Dataset.prototype.deleteCols = function deleteCols(cols) {
      var del;

      del = List.prototype.delete.bind(this);
      cols = List.prototype.getIndexOf.call(this, cols);
      if (!Array.isArray(cols)) {
         del(cols);
      } else {
         cols.sort(function(a, b) { return a < b; }).forEach(del);
      }
      this.ncol = this.length();
      return this;
   };

   /**
    * Clone the dataset.
    */
   Dataset.prototype.clone = function clone() {
      return new Dataset(this);
   };

   /**
    * Return an array of arrays representing the columns of the dataset.
    */
   Dataset.prototype.toArray = function toArray() {
      return this.values.slice(1).map(function(val) {
         return val.get();
      });
   };

   // Throw error if there are variables of unequal length
   // If `fix` is true, resize the variables to max length
   function validateLengths(dSet, fix) {
      var equalLengths, maxLength;

      fix = fix === true; // default it to false
      equalLengths = true;
      maxLength = dSet.reduce(function(acc, val) {
         var length;

         length = val.length();
         if (acc === null) { return length; }
         if (acc === length) { return acc; }
         if (!fix) {
            throw new Error('Dataset columns have unequal length.');
         }
         equalLengths = false;

         return acc < length ? length : acc;
      }, null);

      if (!equalLengths && fix) {
         dSet.eachCol(function(col) {
            if (col.length() < maxLength) { col.resize(maxLength); }
         });
      }

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
         } else if (!(val instanceof Variable)) {
            listSet.call(list, i, new Variable(val));
         }
      });
      return list;
   }

   /*
    * Given a columns specification, and a dataset `dset`, returns the
    * corresponding array of column indices. See `Dataset#get`.
    *
    * getColumns will assume it is not given a single number/string.
    * Its callers must have handled that case earlier.
    */
   function getColumns(cols, dset) {
      if (cols === true) { return utils.seq(dset.length()); }
      if (typeof cols === 'number' || typeof cols === 'string') { return [cols]; }
      if (typeof cols === 'function') {
         return utils.seq(dset.length()).filter(function(j) {
            return cols(dset._names[j], j);
         });
      }
      cols = Variable.oneDimToVariable(cols);
      if (cols.mode() === 'logical') {
         if (dset.ncol !== cols.length()) {
            throw new Error('Logical vector does not match nCol');
         }
         cols = cols.which();    // to scalar variable
      }
      return cols.get();         // to array
   }

   /*
    * Given a row specification, and a dataset `dset`, returns the
    * corresponding array of row indices. See `Dataset#get`.
    *
    * getRows may be given a single number, and should be able to handle it
    */
   function getRows(rows, dset) {
      if (rows === true) { return utils.seq(dset.nrow); }
      if (typeof rows === 'function') {
         return utils.seq(dset.nrow).filter(function(i) {
            // rows here meant to be rows(row, i)
            return rows(dset.rowFun(i), i);
         });
      }
      if (typeof rows === 'number') { return [rows]; }
      rows = Variable.oneDimToVariable(rows);
      if (rows.mode() === 'logical') {
         if (dset.nrow !== rows.length()) {
            throw new Error('Logical vector does not match nRow');
         }
         rows = rows.which();    // to scalar variable
      }
      return rows.get();
   }

   // Given a vals specification (for #set), returns a function
   // Also validates dimensions for the region and the values
   // Both rows and cols are arrays at this point.
   function getValsFunction(vals, rows, cols) {
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

   // Ensures that names for all variables exist and are unique.
   // Will add a .1, .2 etc as needed, and an X1, X2, X3 as needed
   function sanitizeNames(dset) {
      var cache;

      cache = {};
      function ensureUnique(name) {
         var j;

         j = 1;
         if (cache[name]) {
            while (cache[name + '.' + j]) { j += 1; }
            name = name + '.' + j;
         }
         cache[name] = true;
         return name;
      }
      dset.values.forEach(function(val, i) {
         if (i > 0) {
            dset._names[i] = ensureUnique(utils.getDefault(dset._names[i], 'X' + i));
         }
      });
      return dset;
   }

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
