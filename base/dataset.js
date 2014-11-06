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
      return this;
   }

   Dataset.prototype = Object.create(List.prototype);

   /**
    * If only one argument, it is interpreted as columns
    * `cols` can be:
    *    - A string/number or array/variable/vector of strings/numbers
    *    - A predicate that has form `pred(colName, j)`, and must return true for
    *      those columns that are to be included in the get.
    *    - The boolean `true`, indicating all columns should be used.
    * `rows` can be:
    *    - A number or array of numbers
    *    - A predicate that has form `pred(row, i)`, where `row` is a function such
    *      that `row(j)` returns the entry in the i-th row and the j-th column, while
    *      `row(colName)` returns the entry in the i-th row and the column named `colName`.
    * If called with only a column specification, and that column being a single number or name
    * then the function returns a variable that is a clone of that column.
    * If given two single values, returns the corresponding single value at the i-th row/j-th column.
    * Otherwise the function returns a dataset that contains copies of the appropriate entries.
    * Called with no arguments, the function return an array of arrays representing the columns.
    */
   Dataset.prototype.get = function get(rows, cols) {
      var that = this;
      if (arguments.length === 0) { return this.toArray(); }
      if (arguments.length === 1) {
         cols = rows;
         rows = true;
      }
      cols = getColumns(cols, that);
      rows = getRows(rows, that);

      if (typeof cols === 'string' || typeof cols === 'number') {
         if (typeof rows === 'number') {
            return List.prototype.get.call(that, cols).get(rows);
         }
         return List.prototype.get.call(that, cols).select(rows);
      }
      // At this point: cols and rows are both arrays of the ones to be
      // gotten.
      return (new Dataset(cols.map(function(col) {
         return List.prototype.get.call(that, col).select(rows);
      }))).names(cols.map(function(col) {
         return typeof col === 'string' ? col : that.names(col);
      }));
   };

   /**
    * Return an array of arrays representing the columns.
    */
   Dataset.prototype.toArray = function toArray() {
      return this.values.slice(1).map(function(val) {
         return val.get();
      });
   };

   /**
    * Get the number of rows
    */
   Dataset.prototype.nRow = function nRow() {
      return this.length() === 0 ? 0 : this.values[1].length();
   };

   /**
    * Get the number of columns
    */
   Dataset.prototype.nCol = function nCol() {
      return this.length();
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
      if (cols instanceof Variable) {
         if (cols.mode() === 'logical') {
            if (that.nCol() !== cols.length()) {
               throw new Error('Logical vector does not match nCol');
            }
            cols = cols.which();    // to scalar variable
         }
         return cols.get();
      }
      if (cols instanceof Variable.Vector) { return cols.get(); }
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
      if (rows instanceof Variable) {
         if (rows.mode() === 'logical') {
            if (that.nRow() !== rows.length()) {
               throw new Error('Logical vector does not match nRow');
            }
            rows = rows.which();    // to scalar variable
         }
         return rows.get();
      }
      if (rows instanceof Variable.Vector) { return rows.get(); }
      if (rows === true) { return utils.seq(that.nRow()); }
      if (typeof rows === 'function') {
         return utils.seq(that.nRow()).filter(function(i) {
            // rows here meant to be rows(row, i)
            return rows(function(j) {
               return that.get(j).get(i);
            }, i);
         });
      }
      return rows;
   }
   /* eslint-enable complexity */

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
