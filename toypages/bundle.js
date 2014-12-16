(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(loader) {
   // create and populate the stats module
   loader.addModule('base', {});
   loader.loadModule(require('./base/restructure'));
   loader.loadModule(require('./base/read-write'));
   loader.loadModule(require('./base/format'));
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./base/format":2,"./base/read-write":3,"./base/restructure":4}],2:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

// Module that contains methods for displaying and formatting variables/datasets
return function(loader) {
   var utils;
   utils    = require('../utils');

   /**
    * Lay out the variable's values in rows. Return an array with one entry for
    * each row. Each row entry is an array of objects representing the values.
    * The objects have the form `{ index: i, value: val, name: s }`.
    *
    * The parameter `ncol` specifies how many entries will be in each row (default
    * is 1). If the variable length is not an exact multiple of `ncol`, then the
    * last row will contain fewer entries.
    *
    * Mostly intended as an internal method for use in `Variable#toHTML`.
    */
   loader.addInstanceMethod('Variable', 'layOut', function layOut(ncol) {
      var rows, currentRow, i, stringVar, names;
      names = this.names();
      stringVar = this.asString();
      ncol = Math.floor(ncol);
      if (!(ncol >= 1)) { ncol = 1; }
      rows = [];
      currentRow = [];
      for (i = 1; i <= this.length(); i += 1) {
         currentRow.push({
            index: i,
            value: utils.getDefault(stringVar.get(i), ''),
            name:  utils.isMissing(names) ? '' : names.get(i)
         });
         if (currentRow.length >= ncol) {
            rows.push(currentRow);
            currentRow = [];
         }
      }
      // if we have an unfinished row, include it before returning
      if (currentRow.length > 0) { rows.push(currentRow); }
      return rows;
   });

   /**
    * Return an HTML string displaying the variable. Each value is wrapped in
    * a tag, and that tag may be preceded by a tagged name. Each row is further
    * wrapped in a tag. The default format can be used as the contents of a
    * `table` tag.
    *
    * The `options` object may include:
    *  - `ncol`: The number of "columns" (default is 1).
    *  - `withNames`: Whether names should be included (default is `false`).
    *  - `value`: An object with properties `tag` and `class` for specifying the
    *      html tag and the class attributes to be used for the values.
    *  - `name`:  A similar object to be used for the names.
    *  - `row`:   A similar object to be used for wrapping around each row.
    *  All three of these objects are optional, and their individual parts are
    *  optional as well. The defaults are `<td>` or `<tr>` for the tag and
    *  `var-value`, `var-name` or `var-row` for the class.
    */
   loader.addInstanceMethod('Variable', 'toHTML', function toHTML(options) {
      var arr, defaults, makeRow;
      function wrap(params) {
         return function(str, others) {
            return '<' + params.tag + ' class="' + params.class + '" ' +
                  (others || '') + '>' + str +
                  '</' + params.tag + '>';
         };
      }
      defaults = {
         ncol: 1,
         withNames: false,
         value: { tag: 'td', class: 'var-value' },
         name:  { tag: 'td', class: 'var-name' },
         row:   { tag: 'tr', class: 'var-row' }
      };
      options = utils.mixin({}, options, defaults);
      options.value = utils.mixin(options.value, defaults.value);
      options.name  = utils.mixin(options.name, defaults.name);
      options.row   = utils.mixin(options.row, defaults.row);
      makeRow = options.withNames ?
         function(row) {
            // entries include names and values
            return row.map(function(obj) {
               return wrap(options.name)(obj.name  , 'data-relIndex="' + obj.index + '"') +
                      wrap(options.value)(obj.value, 'data-relIndex="' + obj.index + '"');
            }).join('');
         } :
         function(row) {
            return row.map(function(obj) {
               return wrap(options.value)(obj.value, 'data-relIndex="' + obj.index + '"');
            }).join('');
         };
      arr = this.layOut(options.ncol);
      return arr.map(function(row) {
         // row is an array of objects with properties `value` and `name`
         return makeRow(row);
      }).map(wrap(options.row)).join('\n');
   });

   /**
    * Return a string variable for displaying the given variable with a
    * specified numerical formatting. The `options` object may include:
    *  - `type`: A string value, either 'scientific' or 'fixed'.
    *  - `decimals`: The number of decimal digits to be displayed to the right of
    * the decimal point. Defaults to 4 for 'scientific' format and to 2 for 'fixed'
    * format.
    */
   loader.addInstanceMethod('Variable', 'format', function format(options) {
      var v, maxDigits;
      v = this.asScalar().names(this.names());
      function nDigits(x) {
         return x === 0 ? 1 : Math.abs(Math.log(Math.abs(x)) / Math.LN10);
      }
      options = utils.mixin({}, options);
      if (!options.type) {
         maxDigits = Math.floor(v.map(nDigits).max());
         options.type = maxDigits > 4 ? 'scientific' : 'fixed';
      }
      if (!(options.decimals >= 0)) {
         options.decimals = options.type === 'scientific' ? 4 : 2;
      }
      return v.map(utils.format[options.type](options.decimals), false, 'string');
   });

// boilerplate below here
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"../utils":10}],3:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

// Module that contains methods for reading and writing datasets and variables.
return function(loader) {
   var Variable, List, Dataset, reString, regexp, quoteUnescape, utils, writeDefaults;

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');
   Dataset  = loader.getClass('Dataset');

   utils    = require('../utils');

   writeDefaults = {
      sep: ',',
      header: true,
      quote: false,
      qescape: false
   };

   /* eslint-disable quotes */
   /* Strings for regular expressions used by the various functions */
   reString = {};
   reString.doubleQuoteContent = '(?:""|\\\\"|\\\\\\\\|[^"])*';
   reString.singleQuoteContent = "(?:''|\\\\'|\\\\\\\\|[^'])*";
   reString.variableSeparators = '(?:^|[\\s\\n;,]+)';
   reString.datasetSeparators = '[\\t;,]| +';  // tab, semicolon, comma, or spaces
   reString.regularTerm = '[^\\s\\n;,]+';
   reString.variableTerm = reString.variableSeparators + '(?:' +
                           '"(' + reString.doubleQuoteContent + ')"' + '|' +
                           "'(" + reString.singleQuoteContent + ")'" + '|' +
                           '(' + reString.regularTerm + ')' +
                         ')';
   reString.datasetTerm  = '(?:' +
                           '"(' + reString.doubleQuoteContent + ')"' + '|' +
                           "'(" + reString.singleQuoteContent + ")'" + '|' +
                           '(' + reString.regularTerm + ')' +
                         ')';
   reString.numberlike = '^\\s*[+-]?(?:\\d+\\.?|\\.\\d+)\\d*(?:[eE][+-]?\\d+)?\\s*$';
   /* eslint-enable quotes */
   regexp = {};

   ['variableTerm', 'datasetTerm', 'datasetSeparators', 'numberlike']
   .forEach(function(key) {
      regexp[key] = new RegExp(reString[key], 'g');
   });

   /**
    * Read values from a string (e.g., text file) into a `Variable`.
    *
    * `Variable#read` makes a sequence of tokens by breaking the string at any sequence
    * of newlines, spaces, commas and semicolons.
    * - If a token starts with a double quote, then it must also end with a
    * double-quote, and its contents are interpreted as follows:
    *    - Consecutive double-quotes (`""`) are interpreted as a double-quote (`"`).
    *    - Escaped (backslashed) characters (`\c`) are interpreted as the character (`c`).
    *    - No unescaped un-doubled double-quotes are allowed in the term.
    * - Analogous conditions apply for a term starting with a single quote (`'`).
    * - If the token does not start with a quote, then it is interpreted literally.
    *
    * If the mode is not specified, it will be inferred as `scalar` if all the tokens
    * can be interpreted as numbers, or as `factor` otherwise.
    */
   loader.addClassMethod('Variable', 'read', function read(vals, mode) {
      return makeVariable(tokenize(regexp.variableTerm, vals, cleanMatch), mode);
   });

   /**
    * Write the variable to a string.
    *
    * `options` is an object that can include:
    *   - `sep`: A character or string to use as separator. Defaults to `','`.
    *   - `quote`: A boolean value specifying whether to quote string values/names. Defaults
    *      to `false`.
    *   - `qescape`: A boolean value specifying whether to escape embedded quotes via a
    *      backslash. Defaults to `false`, meaning escape via an extra double-quote.
    */
   loader.addInstanceMethod('Variable', 'write', function write(options) {
      options = utils.mixin({}, options, writeDefaults);
      return prepareVar(this, options).join(options.sep);
   });

   /**
    * Read a dataset from a string `vals` which is the contents of a delimited file.
    *
    * Quote-escaping rules are similar to `Variable#read`.
    *
    * `options` is an object that can include:
    *   - `sep`: A character or string specifying the separator. If not provided, an attempt
    *   to infer the separator will be made. Typical separators include `','`, `';'`, `'\t'`,
    *   and `' '`. In this last case, any sequence of whitespace, including tabs, will be
    *   treated as a single separator.
    *   - `header`: A boolean value specifying whether headers are included. Defaults to `false`.
    */
   loader.addClassMethod('Dataset', 'read', function read(vals, options) {
      var terms, headings;
      options = options || {};
      vals = vals.replace(/\r/g, '').split('\n');
      if (!options.sep) {
         terms = vals.map(tokenizeDatasetLine);
         options.sep = inferSep(terms); // terms is array of obj
      }
      terms = vals.map(makeLineTokenizer(options.sep));
      terms = terms.filter(function(arr) { return arr.length > 0; });
      terms = columnize(terms);
      if (options.header == null) { // can add logic here for inferring headers
         options.header = false;
      }
      function makeVar(row) { return makeVariable(row); }
      if (options.header === true) {
         headings = [];
         terms.forEach(function(row) { headings.push(row.shift()); });
         return new Dataset(terms.map(makeVar)).names(headings);
      }
      return new Dataset(terms.map(makeVar));
   });

   /**
    * Write the dataset to a string.
    *
    * `options` is an object that can include:
    *   - `sep`: A character or string to use as separator. Defaults to `','`.
    *   - `header`: A boolean value specifying whether to include headers. Defaults to `true`.
    *   - `quote`: A boolean value specifying whether to quote string values/names. Defaults
    *      to `false`.
    *   - `qescape`: A boolean value specifying whether to escape embedded quotes via a
    *      backslash. Defaults to `false`, meaning escape via an extra double-quote.
    */
   loader.addInstanceMethod('Dataset', 'write', function write(options) {
      var i, rows, row, cols;
      options = utils.mixin({}, options, writeDefaults);
      function addHeader(arr, name) {
         if (options.header) { arr.unshift(quote(options)(name)); }
         return arr;
      }
      function prepVar(v, i, name) {
         return addHeader(prepareVar(v, options), name);
      }
      cols = this.map(prepVar); // cols is a list of string arrays, one for each column
      rows = [];
      cols.get(1).forEach(function(col, i) {
         row = [];
         cols.each(function(col) { row.push(col[i]); });
         rows.push(row.join(options.sep));
      });
      return rows.join('\n') + '\n';
   });

   // helper methods
   function quote(options) {
      var replacements;
      // Underscores added because of @name bug in JsDoc
      replacements = {
         '_\\' : '\\\\',
         '_\t' : '\\t',
         '_\n' : '\\n',
         '_\r' : '\\r'
      };
      return function(str) {
         str = str.replace(/[\\\t\n\r]/g, function(m) { return replacements['_' + m]; });
         if (!options.quote) { return str; }
         return '"' + str.replace(/"/g, options.qescape ? '\\"' : '""') + '"';
      };
   }

   function prepareVar(v, options) {
      function killMissing(v) {
         return v.map(function(str) { return utils.getDefault(str, ''); });
      }
      if (v.mode === 'scalar') {
         return killMissing(v.asString()).toArray();
      }
      return killMissing(v.asString()).toArray().map(quote(options));
   }

   // `terms` is an array of strings (tokens)
   function variableInferMode(terms) {
      return terms.filter(utils.isNotMissing).every(function(s) {
         return s.match(regexp.numberlike) !== null;
      }) ? 'scalar' : 'factor';
   }

   // terms is an array of string tokens, mode is optional
   function makeVariable(terms, mode) {
      terms = terms.map(function(val) { return val === '' ? NaN : val; });
      if (!mode) { mode = variableInferMode(terms); }
      if (mode === 'scalar') { terms = terms.map(parseFloat); }
      return new Variable(terms, { mode: mode });
   }

   // Returns the separator type:
   // - tab ('\t')
   // - semicolon (';')
   // - comma (',')
   // - spaces (' ')
   function inferSep(terms) {
      var sepCounts, seps;
      // Underscores added because of @name bug in JsDoc
      sepCounts = { '_\t': [], '_,': [], '_;': [], '_ ': [] };
      seps = Object.keys(sepCounts);
      terms.forEach(function(term) {
         seps.forEach(function(sep) {
            sepCounts[sep].push(term.separators[sep]);
         });
      });
      sepCounts = new List(sepCounts).reduce(function(acc, arr, i, sep) {
         arr = Variable.scalar(arr).table().sort(true);

         if (arr.names().get(1) !== '0' && arr.get(1) > acc.freq) {
            return { freq: arr.get(1), sep: sep };
         }
         return acc;
      }, { freq: -1 });
      return sepCounts.sep;
   }

   /*
    * Helper method. Given a regexp `re`, and a string `s`, it repeatedly matches
    * the regexp against s, returning an array of all matches. Like `String.prototype.match`
    * but returns all subgroups as well. If a function `f` is provided, it will be called
    * on each match array before appending to the results.
    */
   function tokenize(re, s, f) {
      var m, arr = [];
      if (typeof f === 'undefined') { f = function(x) { return x; }; }
      re.lastIndex = 0;  // resets the reg exp
      while ((m = re.exec(s)) !== null && m[0] !== '') { arr.push(f(m)); }
      return arr;
   }

   // for inferring separator type
   function tokenizeDatasetLine(line) {
      var obj;
      // Underscores added because of @name bug in JsDoc
      obj = { tokens: [], separators: { '_\t': 0, '_,': 0, '_;': 0, '_ ': 0 } };
      obj.line = line.replace(regexp.datasetTerm, function(m, p1, p2, p3) {
         obj.tokens.push(cleanMatch([m, p1, p2, p3]));
         return obj.tokens.length;
      });
      // scan line and count separators
      (obj.line.match(regexp.datasetSeparators) || []).forEach(function(sep) {
         obj.separators['_' + (sep.length === 1 ? sep : ' ')] += 1;
      });
      return obj;
   }

   // Given the known separator `str`, creates the function for
   // tokenizing one line of a dataset
   function makeLineTokenizer(str) {
      var obj, pattern, pattern2;
      function preprocess(line) {
         return line.replace(pattern2, function(m, s) {
            return s ? s : '';
         });
      }
      // Underscores added because of @name bug in JsDoc
      obj = {
         '_\t': { term: '([^\\t\\n]*)', sep: '\\t', junk: ' *' },
         '_,':  { term: '([^,\\n]*)', sep: ',', junk: '[\\t ]*' },
         '_;':  { term: '([^;\\n]*)', sep: ';', junk: '[\\t ]*' },
         '_ ':  { term: '([^\\s]*)', sep: '[ \\t]+', junk: '' }
      };
      pattern = '(?:' +
                     '"(' + reString.doubleQuoteContent + ')"' + '|' +
                     '\'(' + reString.singleQuoteContent + ')\'' + '|' +
                     obj[str].term +
                     ')' + '(?:' + obj[str].sep +
                ')?';
      pattern = new RegExp(pattern, 'g');
      pattern2 = obj[str].junk + '(' + obj[str].sep + ')' + obj[str].junk + '|' +
                 '^' + obj[str].junk + '|' +
                 obj[str].junk + '$';
      pattern2 = new RegExp(pattern2, 'g');
      return function(line) {
         return tokenize(pattern, preprocess(line), cleanMatch);
      };
   }

   // takes array of row arrays, maybe not all same length, and returns
   // corresponding and uniform array of column arrays
   function columnize(rows) {
      var numCol, i, cols;
      cols = [];
      numCol = rows.reduce(function(maxLen, row) {
         return Math.max(row.length, maxLen);
      }, 0);
      for (i = 0; i < numCol; i += 1) {
         cols.push([]);
      }
      rows.forEach(function(row) {
         cols.forEach(function(col, j) {
            col.push(utils.getDefault(row[j], utils.missing));
         });
      });
      return cols;
   }

   // m is the match
   function cleanMatch(m) {
      if (typeof m[1] !== 'undefined') {
         return quoteUnescape(m[1], '"');
      } else if (typeof m[2] !== 'undefined') {
         return quoteUnescape(m[2], '\'');
      }
      return quoteUnescape(m[3], '');
   }

   /*
    * Cleans up contents of quoted string.  `q` is the quote type.
    * If `q` is a single-quote, replace '' with ' and \' with '
    * If `q` is a double-quote, replace "" with " and \" with "
    */
   quoteUnescape = (function(dict) {
      var obj;
      obj = { '\\n': '\n',
              '\\t': '\t',
              '\\r': '\r',
              '""' : '"',
              '\'\'' : '\''
            };
      function lookup(c) { return obj[c] || c[1]; }
      return function(s, q) {
         return s.replace(dict[q], lookup);
      };
   }({ '"': /\\.|""/g, '\'': /\\.|''/g, '': /\\./g }));

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"../utils":10}],4:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var Variable, List, utils;

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');

   utils    = require('../utils');

   /**
    * Split a `Dataset` into a `List` of sub-datasets, based on the specified
    * subsets of the rows.  `select` can be:
    *  - A `List` whose elements are one-dimensional collections of row indices
    *  - A factor `Variable` of length `nrow`.  Rows with the same corresponding
    *  factor value will be grouped together.
    *  - A function `f(row, i)`.  Rows with the same function value will be grouped
    *  together.
    *
    * If an empty group of rows is created by `select`, it will generate an empty `Dataset`.
    */
   loader.addInstanceMethod('Dataset', 'split', function split(select) {
      var that = this;
      if (typeof select === 'function') {
         select = Variable.tabulate(function(i) {
            return select(that.rowFun(i), i);
         }, 1, that.nrow, {mode: 'factor'});
      }
      if (select instanceof Variable) { select = select.groupIndices(); }
      return select.map(function(val) { return that.get(val, true); });
   });

   /**
    * Return a `List` of arrays of indices corresponding to the distribution
    * of the factor variable. If the variable is not factor or ordinal, it will
    * be treated as a factor variable.
    *
    * If missing values are present, an extra (unnamed) list item to hold those
    * indices will be created at the end of the list.
    *
    *     Variable.factor(['a','a','b']).groupIndices(); // { a: [1, 2], b: [3] }
    */
   loader.addInstanceMethod('Variable', 'groupIndices', function groupIndices() {
      var that = this, arr, levels;
      if (that.mode !== 'factor' && that.mode !== 'ordinal') {
         that = Variable.factor(that.toArray());
      }
      levels = that.levels();
      arr = new Variable.Vector(function() { return []; }, levels.length).get();
      that.values.each(function(c, i) {
         if (utils.isMissing(c)) {
            arr[levels.length] = arr[levels.length] || [];
            arr[levels.length].push(i);
         } else {
            arr[c - 1].push(i);
         }
      });
      if (arr.length !== levels.length) { levels.push(utils.missing); }
      return new List(arr).names(levels);
   });
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"../utils":10}],5:[function(require,module,exports){
/**
 * Representation of "statistics" Datasets
 * @module Dataset
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var List, Variable, utils;

   List     = require('./list');
   Variable = require('./variable');
   utils    = require('./utils');
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
    * Get a single column (variable). `col` is a positive number or string name.
    */
   Dataset.prototype.getVar = function getVar(col) {
      return List.prototype.get.call(this, col).clone();
   };

   /**
    * Given a row index `i`, return a function `f(col)` which "simulates" row `i`.
    *
    *     l.rowFun(2)('a') // Returns the second value in column 'a'.
    *     l.rowFun(2)(2)   // Returns the second value in the second column.
    */
   Dataset.prototype.rowFun = function rowFun(i) {
      var that = this;
      return function(j) { return that.getVar(j).get(i); };
   };

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
            return function (i, j, colName) {
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
      var that = this;
      var len = that.length();
      if (arguments.length === 1) {
         values = names;
         names = utils.missing;
      }
      if (typeof values === 'function') {
         values = new Variable(values, {length: that.nrow});
      }
      values = new Dataset(Variable.oneDimToVariable(values));
      if (values.nrow !== this.nrow) {
         throw new Error('mismatch -- Dataset.nrow and num rows in new columns');
      }
      List.prototype.each.call(values, function(val, i, name) {
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
      var that = this;
      var indices;
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
         cols.sort(function (a, b) { return a < b; }).forEach(del);
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
            return rows(that.rowFun(i), i);
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

   // Ensures that names for all variables exist and are unique.
   // Will add a .1, .2 etc as needed, and an X1, X2, X3 as needed
   function sanitizeNames(that) {
      var cache = {};
      function ensureUnique(name) {
         var j = 1;
         if (cache[name]) {
            while (cache[name + '.' + j]) { j += 1; }
            name = name + '.' + j;
         }
         cache[name] = true;
         return name;
      }
      that.values.forEach(function(val, i) {
         if (i > 0) {
            that._names[i] = ensureUnique(utils.getDefault(that._names[i], 'X' + i));
         }
      });
      return that;
   }

   return Dataset;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./list":7,"./utils":10,"./variable":11}],6:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils;

   utils = require('./utils');

   loader.addModule('fun', {});

   /**
    * Return a function g(x) whose graph is piecewise linear with vertices
    * specified by the pairs created by the vectors/arrays/variables `xs`, `ys`.
    * The `xs` will be assumed to be in increasing order.
    * The result of `g(x)` for `x` outside the range of `xs` is unspecified.
    *
    * Example: `fun.interpolate([1, 3, 4], [0, 1, 2])` has as graph the line segments
    * joining `(1, 0)` to `(3, 1)` and then to `(4, 2)`.
    */
   loader.addModuleMethod('fun.interpolate', function interpolate(xs, ys) {
      xs = xs.hasOwnProperty('toArray') ? xs.toArray() : xs;
      ys = ys.hasOwnProperty('toArray') ? ys.toArray() : ys;
      if (xs.length !== ys.length) {
         throw new Error('fun.interpolate: lengths must agree.');
      }
      return function(x) {
         var i, gamma;
         if (x < xs[0] || x > xs[xs.length - 1]) { return utils.missing; }
         if (x === xs[xs.length - 1]) { return ys[xs.length - 1]; }
         i = -1;
         while (xs[i + 1] <= x) { i += 1; }
         gamma = (x - xs[i]) / (xs[i + 1] - xs[i]);
         return (1 - gamma) * ys[i] + gamma * ys[i + 1];
      };
   });
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./utils":10}],7:[function(require,module,exports){
/**
 * Representation of "Lists"
 * @module List
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var Variable, utils;

   utils = require('./utils');
   Variable = require('./variable');

   /**
    * A list is a collection of Javascript entities that can be accessed by index
    * or by name. One can remove an item from a list, which results in the other
    * items shifting place. One can also insert at the end of a list, or alter the
    * contents of the list.
    *
    * Indexing starts at 1.
    *
    * We can create a list by providing:
    * - an object containing the items to be placed in the list along with their names
    * - an array of items to be placed in the list, without names
    * - no arguments, resulting in an empty list
    */
   function List(values) {
      if (!(this instanceof List)) { return new List(values); }
      if (Array.isArray(values)) {
         this.values = [utils.missing].concat(values);
         this._names = this.values.map(function() { return utils.missing; });
      } else {
         // Given an object. Need to populate array based on it
         this._names = [utils.missing].concat(Object.keys(values || {}));
         this.values = this._names.map(function(key) {
            return utils.optionMap(key, function(key) { return values[key]; });
         });
      }
   }

   List.prototype = Object.create({});

   /* eslint-disable complexity */
   /**
    * Get or set the item names.
    *
    * - When called with no arguments, return a string `Variable` of all the names,
    * with `utils.missing` in place of any missing names. If no names exist,
    * returns `utils.missing`.
    * - When called with a single numeric argument `i`, return the name at the
    * given index.
    * - When called with a single array or `Variable` argument, set the names of the
    * list using the array/variable's elements.
    * - When called with a single `null` or `utils.missing` argument, set the names
    * to `utils.missing`.
    * - When called with two arguments `i`, `newName`, set the name of the `i`-th item
    * to `newName`.
    *
    *     var l = new List({ a: [1, 2], b: 3 });
    *     l.names();           // Variable(['a', 'b'])
    *     l.names(2);          // 'b'
    *     l.names(2, 'c');     // `l` is now { a: [1,2], c: 3 }
    *     l.names(['d', 'e']); // `l` is now { d: [1,2], e: 3 }
    *     l.names(null);       // `l` now has no names
    */
   List.prototype.names = function names(i, newNames) {
      if (arguments.length === 0) {
         return utils.allMissing(this._names) ? utils.missing
                                              : Variable.string(this._names.slice(1));
      }
      if (arguments.length > 1) {
         this._names[i] = newNames;
      } else { // one argument, `i`
         if (utils.isMissing(i)) {
            this._names = this.values.map(function() { return utils.missing; });
            return this;
         }
         if (i instanceof Variable) { i = i.asString().toArray(); }
         if (!Array.isArray(i)) { return this._names[i]; }
         if (i.length !== this.length()) {
            throw new Error('Incompatible names length');
         }
         this._names = [utils.missing].concat(i);
      }
      return this;
   };
   /* eslint-enable */

   /**
    * Return the length of the list (number of items)
    */
   List.prototype.length = function length() {
      return this.values.length - 1;
   };

   /**
    * Given a name, return the index of the item with that name
    * or utils.missing if there isn't one.
    * You may also instead pass a single number, or an array of names
    * and numbers, in which case an array of indices is returned.
    * Mostly meant as an internal method.
    */
   List.prototype.getIndexOf = function getIndexOf(name) {
      var names;
      names = this._names;
      function tester(n) {
         if (typeof n === 'number') { return n; }
         n = names.indexOf(n);
         return n === -1 ? utils.missing : n;
      }
      return Array.isArray(name) ? name.map(tester) : tester(name);
   };

   /**
    * Return a list item by index. The index `i` can be:
    * - a positive number
    * - a string name
    * - `null` or `utils.missing`; in this case, an array of all the items
    * is returned.
    */
   List.prototype.get = function get(i) {
      if (utils.isMissing(i)) { return this.values.slice(1); }
      return this.values[this.getIndexOf(i)];
   };

   /**
    * Called with two arguments `i`, `val`. Set the list item at a given index `i`.
    * `i` can be:
    * - a positive number. If `i` is greater than the length of the list,
    * create a new item at index `i` and fill the resulting gap with `utils.missing`.
    * - a string name:  If the name `i` is not already a name in the list, append a
    * new item with name `i`. Otherwise, update the existing item with the new value.
    * - an object of name-value pairs, causing a series of updates or appends, one for
    * each pair.
    * - an array of values, causing a series of appends of these (unnamed) items.
    *
    * `val` can be any Javascript entity. If `i` is an object or array, then `val` is
    * omitted.
    */
   List.prototype.set = function set(i, val) {
      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number' || typeof i === 'string') {
         return this._set(i, val);
      }
      if (Array.isArray(i)) {
         i.forEach(function(v) {
            this._set(this.length() + 1, v);
         }.bind(this));
      } else {
         // i is an object
         Object.keys(i).forEach(function(key) {
            this._set(key, i[key]);
         }.bind(this));
      }
      return this;
   };

   /**
    * Internal method used to set one item value. Requires two arguments,
    * an integer or string name `i` and a value `val`.
    */
   List.prototype._set = function _set(i, val) {
      var name;
      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number') {
         i = Math.floor(i);
         if (i < 1) { throw new Error('cannot set at negative index: ' + i); }
         this.values[i] = val;
      } else {
         name = i;
         i = this._names.indexOf(name);
         if (i === -1) { // append
            i = this.length() + 1;
            this._names[i] = name;
         }
         this.values[i] = val;
      }
      return this;
   };

   /**
    * Delete the item at index/name `i`. `i` may be a positive integer or string name.
    */
   List.prototype.delete = function _delete(i) {
    if (utils.isMissing(i)) { return this; }
    i = this.getIndexOf(i);
    if (i >= 1) {
      this.values.splice(i, 1);
      this._names.splice(i, 1);
    }
    return this;
   };

   /**
   * Apply the function `f(val, i, name)` to each item in the list.  For any
   * items with no associated name, `name` will be `utils.missing`.
   */
   List.prototype.each = function each(f) {
      var i;
      for (i = 1; i <= this.length(); i += 1) {
         f(this.values[i], i, this._names[i]);
      }
      return this;
   };

   /**
    * Apply the function `f(acc, val, i, name)` to each item in the list,
    * accumulating the result to be returned.
    *
    * For any values with no associated name, `name` will be supplied as
    * `utils.missing`.
    *
    * Similar to Javascript's `Array.prototype.reduce`.
    */
   List.prototype.reduce = function reduce(f, initial) {
      var i, acc;
      acc = initial;
      for (i = 1; i <= this.length(); i += 1) {
         acc = f(acc, this.values[i], i, this._names[i]);
      }
      return acc;
   };

   /**
    * Create a new list from the results of applying the function `f(val, i, name)`
    * to the items of the original list. For any values with no associated name,
    * `name` will be supplied as `utils.missing`.
    */
   List.prototype.map = function map(f) {
      var arr;
      arr = [];
      this.each(function(val, i, name) {
         arr.push(f(val, i, name));
      });
      return (new List(arr)).names(
         utils.optionMap(this.names(), function(nms) { return nms.toArray(); })
      );
   };

   /**
    * Clone the list. This method will attempt to make a deep clone by calling `clone`
    * on any top-level items in the list that have a clone method.
    */
   List.prototype.clone = function clone() {
      return this.map(function(val) { return val.clone ? val.clone() : val; });
   };

   /**
    * Return a `Variable` by concatenating the values from the list's items.
    * Works with items of any of the following types:
    * - single value
    * - Array, `Vector`, `Variable`
    * - `List`
    *
    * Names are generated for the new Variable base on the items' names in the list
    * as well as their names (if any) as PanthR objects. The idea is to preserve any
    * names in the list and/or in the values of the list in some reasonable way,
    * wherever they exist.
    * - If the item is a variable with names, and it is a named list item, join the names
    * - If the item is a variable with names, and it is an unnamed list item,
    * use the variable names
    * - If the item is a variable without names, and it is a named list item, provide
    * names of the form `itemName.1, itemName.2, ...`
    */
   List.prototype.toVariable = function toVariable() {
      var resolvedEntries;
      resolvedEntries = this.get().map(function(val, i) {
         if (val instanceof List) { return val.toVariable(); }
         if (val instanceof Variable) { return val.clone(); }
         val = Variable.oneDimToVariable(val);
         return val instanceof Variable ? val : new Variable([val]);
      });
      resolvedEntries.forEach(function(val, i) {
         val.names(joinNames(this.names(i + 1),
                             val.names(),
                             val.length()));
      }.bind(this));
      return Variable.concat.apply(null, resolvedEntries);
   };

   /**
    * Unnest a number of levels out of a nested list, starting at the
    * top level. `levels` is the number of levels it will attempt to unnest.
    * Level 0 indicates no change. Default is 1.
    * Level `Infinity` indicates complete unnesting.
    *
    * This method will only attempt to resolve nesting formed via `List` constructs,
    * and will not recurse into Javascript Objects or Arrays.
    *
    * BEWARE: This operation changes the list(s) _in place_.
    */
   List.prototype.unnest = function unnest(levels) {
      var i;
      if (arguments.length === 0) { levels = 1; }
      if (levels === 0) { return this; }
      if (levels > 1) {
         this.each(function(e) {
            if (e instanceof List) { e.unnest(levels - 1); }
         });
      }
      for (i = this.length(); i > 0; i -= 1) {
         if (this.values[i] instanceof List) {
            [].splice.apply(this._names,
               [i, 1].concat(
                  joinNames(this._names[i],
                            this.values[i].names(),
                            this.values[i].length()
                  )
               )
            );
            [].splice.apply(this.values,
               [i, 1].concat(this.values[i].get())
            );
         }
      }
      return this;
   };


   /* Helper methods */
   function joinNames(itemName, valueNames, length) {
      if (utils.isMissing(itemName)) {
         return Variable.ensureArray(valueNames);
      }
      if (utils.isMissing(valueNames)) {
         if (length === 1) { return [itemName]; }
         valueNames = Variable.Vector.seq(length);
      }
      return Variable.ensureArray(valueNames)
                     .map(function(s) { return itemName + '.' + s; });
   }

   return List;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./utils":10,"./variable":11}],8:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(loader) {
   /**
    * create and populate the stats module. FIXME later
    * @module stats
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    */
   loader.addModule('stats', {});
   loader.loadModule(require('./stats/basic'));
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./stats/basic":9}],9:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(loader) {
   var utils, Variable, List;

   utils = require('../utils');

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');

   /**
    * Return the sum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'sum', function sum(skipMissing) {
      return this.asScalar().reduce(utils.op.add, 0, skipMissing);
   });

   /**
    * Return the mean of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'mean', function mean(skipMissing) {
     var v;  // the variable whose mean we will return
     v = filterMissing(this.asScalar(), skipMissing);
     return utils.singleMissing(v.sum() / v.length());
   });

   /**
    * Return the variance of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'var', function variance(skipMissing) {
      var res, K;
      res = this.reduce(function(acc, val) {
         if (K == null) { K = val; } // Center around first value for stability
         val = val - K;
         acc.sum += val;
         acc.sumSquares += val * val;
         acc.length += 1;
         return acc;
      }, { sum: 0, sumSquares: 0, length: 0 }, skipMissing);
      return utils.singleMissing( (res.sumSquares - res.sum * res.sum / res.length) /
                                  (res.length - 1)
      );
   });

   /**
    * Return the standard deviation of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'sd', function sd(skipMissing) {
      return utils.singleMissing(Math.sqrt(this.var(skipMissing)));
   });

   /**
    * Return the minimum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'min', function min(skipMissing) {
      return this.asScalar().reduce(utils.op.min2, Infinity, skipMissing);
   });

   /**
    * Return the maximum of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'max', function max(skipMissing) {
      return this.asScalar().reduce(utils.op.max2, -Infinity, skipMissing);
   });

   /**
    * Return a `Variable` representing the permutation that sorts the values of the
    * original variable according to the order specified by `desc`.
    * - If `desc` is a boolean value, then `false` indicates ascending order, `true`
    * indicates descending order.
    * - If `desc` is a function `f(a, b)`, then it is interpreted as the comparator
    * for sorting, and must return `-1` if `a` precedes `b`, `0` if `a` and `b` are "equal"
    * in order, and `1` if `b` precedes `a`.
    * - If `desc` is omitted, it defaults to `false` (ascending order).
    */
   loader.addInstanceMethod('Variable', 'order', function order(desc) {
      return Variable.scalar(this.toVector().order(desc));
   });

   /**
    * Return a new `Variable` with the values sorted in the order specified by `desc`.
    * See `Variable#order`.
    */
   loader.addInstanceMethod('Variable', 'sort', function sort(desc) {
      return this.select(this.toVector().order(desc).toArray());
   });

   /**
    * Return a 'named' scalar variable of the requested quantiles for the values
    * of the variable.
    *
    * `probs` can be a single number or a one-dimensional object (`Array`,
    * `Vector` or `Variable`) and is used to specify the desired quantiles.
    * Each value in `probs` should be in the range [0, 1].  If a value in `probs`
    * is 'utils.isMissing' then the corresponding quantile will be recorded as
    * `utils.missing`.
    *
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and the variable
    * has missing values, an error is thrown.
    */
   loader.addInstanceMethod('Variable', 'quantile',
   function quantile(probs, skipMissing) {
      var getQuant, quantiles, names;
      if (skipMissing === true) {
         return this.nonMissing().quantile(probs);
      } else if (this.hasMissing()) {
         throw new Error(
            'missing values in variable and skipMissing not set to true'
         );
      }
      probs = Variable.ensureArray(probs);
      probs.forEach(function(p) { if (p < 0 || p > 1) {
         throw new Error('"probs" outside [0, 1]');
      }});
      getQuant = function(p) {
         var g, k;
         p = p * (this.length() - 1) + 1;
         k = Math.floor(p);
         g = p - k; // fractional part of scaled prob
         // interpolate: (1-g)*x[k] + g*x[k+1]
         return (1 - g) * this.get(k) + g * this.get(k + 1);
      }.bind(this.asScalar().sort());
      quantiles = probs.map(utils.makePreserveMissing(getQuant));
      names = probs.map(function(p) {
         return utils.optionMap(p, function(p) { return p * 100 + '%'; });
      });
      return Variable.scalar(quantiles).names(names);
   });

   /**
    * Return the median of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'median', function median(skipMissing) {
      return this.hasMissing() && skipMissing !== true ? utils.missing
         : this.quantile(0.5, true).get(1);
   });

   /**
    * Return a 'named' scalar variable of the five-number of the values of the variable.
    * `skipMissing` defaults to `false`.  If `skipMissing` is `false` and
    * the variable has missing values, return `utils.missing`.
    */
   loader.addInstanceMethod('Variable', 'fiveNum', function fiveNum(skipMissing) {
      return this.quantile([0, 0.25, 0.5, 0.75, 1], skipMissing)
         .names(['Min', 'Q1', 'Median', 'Q3', 'Max']);
   });

   /**
    * Return a frequency table for the variable, in the form of a 'named' scalar
    * variable.  The variable is treated as a factor variable in order to
    * accumulate the frequencies.
    */
   loader.addInstanceMethod('Variable', 'table', function table() {
      var factor, freqs, missing, names;
      factor = Variable.factor(this.toArray()).sort();
      freqs = [];
      missing = 0;
      factor.each(function(val) {
         if (utils.isMissing(val)) {
            missing += 1;
         } else {
            freqs[val - 1] = freqs[val - 1] ? freqs[val - 1] + 1 : 1;
         }
      });
      names = factor.levels();
      if (missing > 0) { freqs.push(missing); names.push(utils.missing); }
      return Variable.scalar(freqs).names(names);
   });

   /**
    * Rescale the variable based on the provided `center` and `scale`.
    * Return a `List` holding three items:
    *  - `center`
    *  - `scale`
    *  - `values` (a `Variable` holding the rescaled values).
    *
    * Must be called with two arguments.
    */
   loader.addInstanceMethod('Variable', 'scale', function scale(center, scale) {
      return new List({
         center: center,
         scale: scale,
         values: this.map(function(x) { return (x - center) / scale; })
      });
   });

   /**
    * Return the standardized values using `Variable#rescale` where `center` is the
    * mean of the variable and `scale` is the standard deviation.
    *
    * Missing values are preserved, but are ignored in the computation.
    */
   loader.addInstanceMethod('Variable', 'zscore', function zscore() {
      return this.scale(this.mean(true), this.sd(true));
   });

   /**
    * Return the Pearson correlation coefficient between two variables, `xs` and `ys`.
    * By default, uses all the values of both variables.  If `skipMissing` is not set
    * to `true` and missing values exist, return `utils.missing`.
    *
    * The two variables must have the same length.
    */
   loader.addModuleMethod('stats', 'correlate', function correlate(xs, ys, skipMissing) {
      var M, MTM, V, validIndices; // V is vector [sumX, sumY]
      // calculate M, the cleaned-up 2-col matrix of xs & ys
      if (!xs.sameLength(ys)) {
         throw new Error('correlate requires same-length variables');
      }
      validIndices = Variable.seq(xs.length())
         .filter(function(i) {
            return utils.isNotMissing(xs.get(i)) && utils.isNotMissing(ys.get(i));
         });
      if (validIndices.length() !== xs.length()) {
         if (skipMissing !== true) { return utils.missing; }
         xs = xs.get(validIndices);
         ys = ys.get(validIndices);
      }
      M = new Variable.Matrix([Variable.ensureArray(xs), Variable.ensureArray(ys)]);
      MTM = M.transpose().mult(M);
      V = M.mapCol(function(col) { return col.reduce(utils.op.add, 0); });
      M = MTM.pAdd(V.outer(V).sMult(-1 / M.nrow));  // really, -VVT / n
      return M.get(1, 2) / Math.sqrt(M.get(1, 1) * M.get(2, 2));
   });

   // helper methods

   // Takes a variable `v` and a boolean `skipMissing`.
   // If `skipMissing` is true, filters out those missing values.
   // skipMissing defaults to false.
   function filterMissing(v, skipMissing) {
      return skipMissing === true ? v.nonMissing() : v;
   }
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"../utils":10}],10:[function(require,module,exports){
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
(function(define) {'use strict';
define(function(require) {

   var utils = {};

   /**
    * Mixes into the first object the key-value pairs from the other objects.
    * Shallow copy.
    */
   utils.mixin = function(target) {
      var rest = [].slice.call(arguments, 1);
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
         return utils.isMissing(val) ? utils.missing :
               utils.singleMissing(f.apply(null, [].slice.call(arguments)));
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

   return utils;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],11:[function(require,module,exports){
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

},{"./utils":10,"./variable/datetime":12,"./variable/factor":13,"./variable/logical":14,"./variable/ordinal":15,"./variable/scalar":16,"./variable/string":17,"linalg-panthr":20}],12:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var moment,utils;       // date-time module
   moment = require('moment');
   utils = require('./../utils');

   /*
    * Need to know (or infer) how to read the values.
    * Use options.format to specify input mode.
    * If values are numbers, they're assumed to be millisec.
    * since 1-1-1970 (midnight UTC).
    * If values are date-time strings, choose a format (or throw yourself
    * on the mercy of moment.  See momentjs.com/docs for standard formats.)
    * Example:
    * "MM-DD-YYYY" would interpret "07-10-1985" as July 10, 1985.
    *
    * Need to know how to display the values.
    * Use options.displayFormat to control display formatting?
    */
   function DateTimeVar(values, options) {
      if (options.format == null) {
         if (values.length === 0 || typeof values[0] === 'number') {
            this.values = values.slice();
         } else {
            this.values = values.map(utils.makePreserveMissing(
               function(val) { return moment(val).valueOf(); }
            ));
         }
      } else {
         this.values = values.map(utils.makePreserveMissing(
            function(val) { return moment(val, options.format).valueOf(); }
         ));
      }
      this.values = new Variable.Vector(this.values).mutable(true);
   }

   DateTimeVar.prototype = Object.create(Variable.prototype);

   // `i` should be required here.
   // `val` is single string or number or array thereof
   DateTimeVar.prototype._set = function _set(i, val, format) {
      var f = format == null ? function(s) { return moment(s); }
                             : function(s) { return moment(s, format); };
      function getMillis(val) {
         if (Array.isArray(val)) { return val.map(getMillis); }
         return utils.singleMissing(typeof val === 'string' ? f(val) : val);
      }
      this.values.set(i, getMillis(val));
   };

   DateTimeVar.prototype.asString = function asString() {
      return this.map(function(val) { return moment(val).format(); }, true, 'string');
   };

   return DateTimeVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":10,"moment":51}],13:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var utils;

   utils = require('./../utils');
   // values _will_ be an array
   function FactorVar(values, options) {
      this.levels(values.slice().sort());
      // the values of a factor "are" the corresponding codes
      this.values = new Variable.Vector(this.getCodes(values)).mutable(true);
   }

   FactorVar.prototype = Object.create(Variable.prototype);

   // When called with no argument, returns an array of the levels.
   // When called with an array `arr` as the argument, uses `arr`
   // to set the levels.
   // Duplicates in `arr` are ignored.
   FactorVar.prototype.levels = function levels(arr) {
      var i;
      if (arguments.length === 0) { return this.c2v.slice(1); }
      // build this.v2c and this.c2v from arr
      this.c2v = [utils.missing];     // codes for levels begin from 1, not 0.
      this.v2c = {};
      for (i = 0; i < arr.length; i += 1) {
         if (utils.isNotMissing(arr[i]) && !this.v2c.hasOwnProperty(arr[i])) {
            this.v2c[arr[i]] = this.c2v.length;
            this.c2v.push(arr[i].toString());
         }
      }
      return this;
   };

   // Given an array of string values, `values`, returns the
   // corresponding array of numerical codes.
   FactorVar.prototype.getCodes = function getCodes(values) {
      var v2c = this.v2c;
      return values.map(utils.makePreserveMissing(
         function(val) { return v2c[val]; }
      ));
   };

   FactorVar.prototype._get = function _get(i) {
      var c2v = this.c2v;
      if (utils.isMissing(i)) { i = null; } // Want to pass null, not NaN, to Vector#get
      if (typeof i === 'number') { return utils.singleMissing(c2v[ this.values.get(i) ]); }
      return this.values.get(i).map(utils.makePreserveMissing(
         function(code) { return c2v[code]; }
      ));
   };

   // Val can be an array of values or a single value.
   // Those values can be the numeric codes or the string labels.
   FactorVar.prototype._set = function _set(i, val) {
      var c2v = this.c2v;
      var v2c = this.v2c;
      /* eslint-disable complexity */
      function getCode(val) {
         if (Array.isArray(val)) { return val.map(getCode); }
         if (utils.isMissing(val)) { return utils.missing; }
         if (typeof val === 'string') {
            if (!v2c.hasOwnProperty(val)) {
               throw new Error('Invalid value for factor');
            }
            return v2c[val];
         }
         if (isNaN(val) || val < 1 || val >= c2v.length) {
            throw new Error('Invalid value for factor');
         }
         return Math.floor(val);
      }
      /* eslint-enable */
      if (arguments.length === 1) {
         this.values.set(getCode(i));
      } else {
         this.values.set(i, getCode(val));
      }
      return this;
   };

   FactorVar.prototype.reproduce = function reproduce(newValues, newNames) {
      var newVar;
      newValues = newValues.map(function(code) { return this.c2v[code]; }.bind(this));
      newVar = new Variable(newValues, {
         mode: this.mode(), label: this.label, levels: this.levels()
      });
      return newNames ? newVar.names(newNames) : newVar;
   };

   FactorVar.prototype.asString = function asString() {
      return Variable.string(this.get());
   };

   return FactorVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":10}],14:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var utils;

   utils = require('./../utils');

   function LogicalVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   LogicalVar.prototype = Object.create(Variable.prototype);

   LogicalVar.prototype.asScalar = function asScalar() {
      return new Variable(this.values.map(utils.makePreserveMissing(
         function(val) { return val === true ? 1 : 0; }
      )));
   };

   LogicalVar.prototype.which = function which() {
      // `false` -> goes away; `true` -> the array index plus 1; and missing -> missing
      var arr;
      arr = [];
      this.values.forEach(function(v, i) {
         if (v !== false) { arr.push(v === true ? i : utils.missing); }
      });
      return new Variable(arr);
   };

   return LogicalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":10}],15:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   /*
    * Constructs a factor variable with ordered levels.
    * `options.levels` can be an array of the levels, indicating the
    * desired ordering.
    * If `options.levels` is not provided, alphabetical ordering of
    * the values will be used.
    * _Caution_:  If `options.levels` is provided, then any values strings
    * which are not in the levels list will be treated as missing values.
    */
   function OrdinalVar(values, options) {
      this.levels(options.levels || values.slice().sort());
      // the values of a factor "are" the corresponding codes
      this.values = new Variable.Vector(this.getCodes(values)).mutable(true);
   }

   OrdinalVar.prototype = Object.create(Variable.FactorVar.prototype);

   return OrdinalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],16:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function ScalarVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   ScalarVar.prototype = Object.create(Variable.prototype);

   return ScalarVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],17:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function StringVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   StringVar.prototype = Object.create(Variable.prototype);

   StringVar.prototype.asScalar = function asScalar() {
      return this.map(parseFloat, true, 'scalar');
   };

   return StringVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],18:[function(require,module,exports){
// Run: browserify bundlePre.js -o bundle.js
// Optionally:  browserify bundlePre.js | uglifyjs -c > panthrBase.js
window.Base = require('./index.js');

},{"./index.js":19}],19:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

   /*
    * Use this as the top-level file for stand-alone testing of Base.
    */
   var Base, loader;

   Base = {};

   loader = new (require('panthrLoader'))(Base);

   loader.loadModule(require('./panthrBase'));

   return Base;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./panthrBase":53,"panthrLoader":52}],20:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

   /**
    * Javascript implementation of Linear Algebra Concepts.
    * @module LinAlg
    * @version 0.0.1
    * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
    */
   var LinAlg;
   
   /**
    * Linear Algebra module offers a framework for Linear Algebra computations
    * with a goal to making those operations reasonably efficient for large sizes.
    * If you will only be using small matrices and/or vectors, but require a huge
    * number of them, you might find this library unsuitable.
    */
   LinAlg = {};
   
   /** Implementation of fixed-length vectors. */
   LinAlg.Vector = require('./linAlg/vector');
   /** Implementation of 2-dimensional matrices. */
   LinAlg.Matrix = require('./linAlg/matrix');

   return LinAlg;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./linAlg/matrix":21,"./linAlg/vector":45}],21:[function(require,module,exports){
/**
 * Javascript implementation of Linear Algebra Matrices.
 * @module Matrix
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var op;

   op = require('./utils').op;
   /**
    * The `Matrix` class is a representation of 2-dimensional algebraic matrices
    * with real entries. Their values are internally represented as `Vector`s.
    * One can access the matrix dimensions via the properties `nrow` and `ncol`.
    *
    * New `Matrix` objects are created via the `Matrix` constructor, which accepts
    * a number of options for its first argument, `arr`:
    *
    * 1. Called with another `Matrix`, simply returns the matrix itself.
    * 2. Called with a single array of values, constructs a matrix based on these values.
    * The dimensions and other properties of this array are determined by the second
    * argument, which is an object `options` containg one or more of the keys
    * `nrow`, `ncol`, `byRow`.
    * 3. Called with an array of arrays of values, it constructs a matrix with columns
    * based on those arrays. The number of arrays (length of `arr`) becomes `ncol`. The
    * arrays in `arr` are expected to have the same length, and that becomes `nrow`.
    * The options object is optional, but may contain a "byRow" entry, which if `true`
    * indicates that the roles of `column` and `row` would be interchanged, i.e.
    * the arrays in `arr` would become rows instead of columns.
    * 4. Called with a function `f(i,j)`, it uses that function to determine the `Matrix`'s
    * values. In that case an `options` second argument specifying `nrow` and `ncol` is needed.
    *
    * Examples:
    *
    *     // All these create:
    *     //        0 1 1
    *     //        2 0 1
    *     //
    *     new Matrix([0, 2, 1, 0, 1, 1], { nrow : 2 }); // by column default
    *     new Matrix([0, 1, 1, 2, 0, 1], { nrow : 2, byRow: true });
    *     new Matrix([[0, 1, 1], [2, 0, 1]], { byRow : true });
    *     new Matrix([[0, 2], [1, 0], [1, 1]]);
    *     // Sparse matrix:
    *     new Matrix({ 1: { 2: 1, 3: 1}, 2: { 1: 2, 3: 1 }}, { nrow : 2, ncol: 3 });
    *
    *     // The following produces in rows: [[1, 2, 3], [2, 4, 6]]
    *     new Matrix(function(i, j) { return i * j; }, { nrow: 2, ncol: 3 });
    */
   function Matrix(arr, options) {
      if (arr instanceof Matrix) { return arr; }
      return new Matrix.DenseM(arr, options);
   }

   /* The class `Vector` as it is accessed from `Matrix`. */
   Matrix.Vector   = require('./vector');
   /**
    * Subclass of `Matrix` representing "dense" matrices.
    * Dense matrices are internally stored simply as Javascript Arrays.
    * Users should not need to access this subclass directly.
    */
   Matrix.DenseM   = require('./matrix/dense')(Matrix);
   /**
    * Subclass of `Matrix` representing "sparse" matrices.
    * Sparse matrices are stored as objects, whose keys represent the indices
    * that have non-zero values.
    * Users should not need to access this subclass directly.
    */
   Matrix.SparseM  = Matrix.DenseM.SparseM;
   /**
    * Subclass of `Matrix` representing matrices whose values are specified via
    * a function `f(i)` of the index.
    * The values of the matrix are computed lazily, only when they are accessed.
    * Users should not need to access this subclass directly.
    */
   Matrix.TabularM = Matrix.DenseM.TabularM;
   /**
    * Subclass of `Matrix` acting as a superclass for classes of matrices
    * with extra structure. Users should not need to access this subclass
    * directly.
    */
   Matrix.StructuredM = require('./matrix/structured')(Matrix);
   /**
    * Subclass of `StructuredM` representing "Lower triangular" matrices.
    *
    * The constructor expects two arguments:
    * - The first argument,`values`, cam be:
    *     1. A full square matrix, in which case its lower triangular part is used.
    *     See also `Matrix.prototype.lower`. If the passed matrix is already of class
    *     `Matrix.LowerTriM`, it is simply returned by the constructor.
    *     2. A function `f(i, j)`. The second argument `nrow` is then needed to specify the
    *     number of rows/columns of the resulting matrix. The `nrow` argument may be either a
    *     number or an object with an `nrow` property.
    *     3. A single value, to be used for all entries. The second argument `nrow` is needed.
    */
   Matrix.LowerTriM   = Matrix.StructuredM.LowerTriM;
   /**
    * Subclass of `StructuredM` representing "Upper triangular" matrices.
    *
    * See `Matrix.LowerTriM` for the constructor parameters. See `Matrix.prototype.upper` for
    * obtaining the upper triangle of a given square matrix.
    */
   Matrix.UpperTriM   = Matrix.StructuredM.UpperTriM;
   /**
    * Subclass of `StructuredM` representing symmetric matrices.
    *
    * A symmetric matrix behaves exactly like a `Matrix.LowerTriM` matrix reflected across the
    * main diagonal.
    */
   Matrix.SymmetricM  = Matrix.StructuredM.SymmetricM;
   /**
     * Subclass of `Matrix` representing outer products of vectors (i.e., rank-1
     * matrices).  Users should not need to access this subclass directly.
    */
   Matrix.OuterM      = Matrix.StructuredM.OuterM;
   /**
     * Subclass of `Matrix` representing sums (A + k * B) of matrices.
     * Users should not need to access this subclass directly.
    */
   Matrix.SumM        = Matrix.StructuredM.SumM;
   /**
     * Subclass of `Matrix` representing products of matrices.
     * Users should not need to access this subclass directly.
    */
   Matrix.ProdM       = Matrix.StructuredM.ProdM;
   /**
    * Subclass of `Matrix` representing diagonal matrices.
    * Users should not need to access this subclass directly. Use `Matrix.diag` instead.
    *
    * One can only set values on the diagonal of a DiagM matrix.
    * Trying to set outside the diagonal will result in error.
    * In order to set values outside the diagonal, would need to
    * "unstructure" the matrix.
    *
    * Using rowView/colView on diagonal matrices may be quite inefficient,
    * as it does not recognize the sparse nature of those vectors.
    */
   Matrix.DiagM       = Matrix.StructuredM.DiagM;
   /**
    * Subclass of `Matrix` representing matrices that are constant multiples of
    * the identity. The constructor expects two arguments: `val` with the value to be
    * used, and `nrow`, which is either a number indicating the number of rows or
    * an object with an `nrow` property.
    *
    * CDiagM matrices are immutable.
    */
   Matrix.CDiagM      = Matrix.StructuredM.CDiagM;
   /**
    * Subclass of `Matrix` representing permutation matrices. The constructor expects two
    * arguments, a `perm` object that determines a `Permutation`, and an `nrow` number/object
    * specifying the matrix dimensions.
    *
    * Multiplying a non-permutation matrix m by a permutation matrix p
    * returns an appropriate view (`Matrix.ViewM`) into m.  Multiplying two permutation
    * matrices returns the matrix for the composed permutation (`Matrix.PermM`).
    */
   Matrix.PermM       = Matrix.StructuredM.PermM;
   /**
    * Subclass of `Matrix` representing submatrix views into another matrix. Changes
    * to the view are reflected on the original matrix and vice-versa. Use
    * `Matrix.prototype.view` to create these.
    *
    * See also: `Matrix.prototype.rowView`, `Matrix.prototype.colView`,
    * `Matrix.prototype.diagView`.
    */
   Matrix.ViewM    = require('./matrix/view')(Matrix);

   /**
    * Subclass of Vector that is used internally by `Matrix` for representing
    * the rows/columns/diagonals of a matrix as vectors.
    *
    * For creating these, see: `Matrix.prototype.rowView`, `Matrix.prototype.colView`,
    * `Matrix.prototype.diagView`.
    */
   Matrix.ViewMV    = require('./matrix/viewmv')(Matrix);

   /**
    * Class containing solvers for various linear systems. TODO: Add Solver module docs
    */
   Matrix.Solver    = require('./solver')(Matrix);
   // Static methods

   /**
    * Return a square diagonal matrix with values given by `diagonal`. The argument
    * `diagonal` may be an array, a `Vector`, or a function `f(i)`. In the latter case,
    * a second argument `len` is required to provide the length of the resulting diagonal.
    * `len` may also be an object with an `nrow` property.
    *
    * This method takes ownership of the `diagonal` vector and may
    * change its values when it itself is changed. Clone the
    * array/vector before passing it to avoid this.
    *
    * To obtain a diagonal of an arbitrary matrix, see `Matrix.prototype.diagView`.
    */
   Matrix.diag = function diag(diagonal, len) {
      return new Matrix.DiagM(diagonal, len);
   };

   /**
    * Return a constant multiple of the identity matrix. These matrices cannot become mutable.
    * They should be treated as constants.
    * The second argument, `nrow` can be the number of rows, or an object with an `nrow`
    * argument. For instance to create an identity matrix with size same as the matrix `A`
    * one would do:
    *
    *     Matrix.const(1, A);  // Identity matrix with dimension same as A.
    */
   Matrix.const = function constant(val, nrow) {
      return new Matrix.CDiagM(val, nrow);
   };

   /**
    * Return a permutation matrix based on the permutation indicated by `perm`. `perm` can be
    * a `Permutation` object, or anything that can be turned to one (see `Permutation`).
    */
   Matrix.perm = function perm(perm, nrow) {
      return new Matrix.PermM(perm, nrow);
   };
   /**
    * Bind the arguments row-wise into a matrix. The arguments may be a
    * mixture of matrices and vectors, but their `ncol/length` must all be the same.
    */
   Matrix.rowBind = function rowBind(matrices) {
      var ncol;
      matrices = [].concat.apply([], // byRow = true
         [].map.call(arguments, function(m) {
            return m instanceof Matrix ? m.toArray(true) : [m.toArray()];
         })
      );
      ncol = matrices[0].length;
      if (!matrices.every(function(m) { return m.length === ncol; })) {
         throw new Error('Trying to rowBind rows of unequal length.');
      }
      return new Matrix(matrices, true); // byRow = true
   };
   /** See `Matrix.rowBind` */
   Matrix.prototype.rowBind = function rowBind(matrices) {
      matrices = Array.prototype.slice.call(arguments);
      matrices.unshift(this);
      return Matrix.rowBind.apply(null, matrices);
   };
   /** See `Matrix.rowBind` */
   Matrix.Vector.rowBind = Matrix.rowBind;
   /** See `Matrix.rowBind` */
   Matrix.Vector.prototype.rowBind = Matrix.prototype.rowBind;

   /**
    * Bind the arguments column-wise into a matrix. The arguments may be a
    * mixture of matrices and vectors, but their `nrow/length` must all be the same.
    */
   Matrix.colBind = function colBind(matrices) {
      var nrow;
      matrices = [].concat.apply([], // byRow = false
         [].map.call(arguments, function(m) {
            return m instanceof Matrix ? m.toArray() : [m.toArray()];
         })
      );
      nrow = matrices[0].length;
      if (!matrices.every(function(m) { return m.length === nrow; })) {
         throw new Error('Trying to colBind columns of unequal length.');
      }
      return new Matrix(matrices, false); // byRow = false
   };
   /** See `Matrix.colBind` */
   Matrix.prototype.colBind = function colBind(matrices) {
      matrices = Array.prototype.slice.call(arguments);
      matrices.unshift(this);
      return Matrix.colBind.apply(null, matrices);
   };
   /** See `Matrix.colBind` */
   Matrix.Vector.colBind = Matrix.colBind;
   /** See `Matrix.colBind` */
   Matrix.Vector.prototype.colBind = Matrix.prototype.colBind;

   /**
    * The array of constructors for this type and its supertypes, in order from
    * most specific to most general.
    */
   Matrix.prototype.classes = [ Matrix ];

   /**
    * Return whether `constr` is in the list of class constructors produced by
    * `Matrix.prototype.classes`.
    */
   Matrix.prototype.isA = function(constr) {
      return this.classes.reduce(function(acc, con2) {
         return acc || constr === con2;
      }, false);
   };

   /**
    * Return a common constructor for `A` and `B`, from the lists provided by
    * `Matrix.prototype.classes`.
    */
   Matrix.commonConstr = function(A, B) {
      var i;
      for (i = 0; i < A.classes.length; i += 1) {
         if (B.isA(A.classes[i])) {
            return A.classes[i];
         }
      }
      throw new Error('Matrix is not a common ancestor for these BAD guys.');
   };

   /**
    * Return the value at location `(i, j)`. Returns `0` if accessing a location out
    * of bounds.
    *
    * Called with 0 or 1 arguments, it is an alias for `Matrix.prototype.toArray`.
    */
   Matrix.prototype.get = function get(i, j) {
      if (arguments.length <= 1) {
         return this.toArray(i || false);
      }
      return this._get(i, j);
   };

   /**
    * Internally used by `Matrix.prototype.get`. May be used in place of
    * `Matrix.prototype.get` if both arguments are always present.
    */
   Matrix.prototype._get = function _get(i, j) {
      if (!this.validIndices(i, j)) { return null; } // Out of matrix bounds fetch
      if (!this.validate(i, j)) { return 0; }        // Out of structure fetch
      return this.compute(i, j);
   };

   /**
    * Computes the value at the (i, j) location. _Internal method_. Use `Matrix.prototype.get`
    * instead.
    */
   Matrix.prototype.compute = function compute(i, j) {
      return this.values.get(this.toIndex(i, j));
   };

   /**
    * Set the value of the matrix at the `(i, j)` location to `val`. Requires that
    * the matrix be set to be mutable.
    *
    * If called with only one argument, then that argument may be a function `f(i, j)`, or
    * a single value, or a `Matrix` with the same dimensions. That argument will then be used
    * to set all the values of the Matrix.
    *
    *     var A1 = new Matrix([1, 2, 3, 4, 5, 6], { nrow: 2, byRow: true });
    *     A1.set(1, 1, 42);    // Throws an exception
    *     A1.mutable(true);    // Set matrix to mutable
    *     A1.set(2, 2, 42);    // Changes 5 to 42
    *     A1.set(Math.random); // Fills A1 with random values
    *     A1.set(5);           // Sets all entries to 5
    *     var A2 = new Matrix([1, 2, 3, 4, 5, 6], { nrow: 2, byRow: true });
    *     A1.set(A2);          // Sets all values of A1 based on those from A2
    *     A1.set(1, 1, 42);    // Only changes A1, not A2
    *
    * Trying to set at an out-of-bounds location results in an exception. If the matrix is
    * "structured", trying to set at a location outside the structure (e.g. an off-diagonal
    * entry of a diagonal matrix) also results in an exception.
    *
    * __NOTE__: In order to avoid unnecessary computations, many matrix operations avoid
    * computing their values until those values are called for. If you have used a matrix or
    * vector in the construction of other matrices/vectors, then you should avoid changing
    * that matrice's values, as the effects of those changes on the dependent objects are
    * unpredictable. In general, you should treat a matrix that has been used in the creation
    * of other matrices as an immutable object, unless `Matrix.prototype.force` has been called
    * on those other matrices.
    */
   Matrix.prototype.set = function set(i, j, val) {
      function changeAll(target, vals) {
         var row, col;
         function makeLookup(vals) {
            if (typeof vals === 'function') { return vals; }
            if (vals instanceof Matrix) {
               Matrix.ensureSameDims(target, vals);
               return vals.get.bind(vals);
            }
            return function(i, j) { return vals; };
         }
         vals = makeLookup(vals);
         target.each(function(val, i, j) { target._set(i, j, vals(i, j)); });
      }
      if (arguments.length === 1) {
         changeAll(this, i);
      } else {
         this._set(i, j, val);
      }
      return this;
   };

   /**
    * Internally used by `Matrix.prototype.set`. _Internal method_. May be used
    * instead of `Matrix.prototype._set` if all three arguments are always present.
    */
   Matrix.prototype._set = function _set(i, j, val) {
      if (!this.validate(i, j, val) || !this.validIndices(i, j)) {
         throw new Error('Setting out of Matrix bounds');
      }
      return this.change(i, j, val);
   };

   /**
    * Internal method used by `Matrix.prototype._set` to change the value of the
    * matrix at a particular location. _Internal method_. This method bypasses
    * various checks and should only be used with extreme care.
    */
   Matrix.prototype.change = function change(i, j, val) {
      this.values._set(this.toIndex(i, j), val);
      return this;
   };

   /**
    * Overriden by subclasses that need special index/value validation.
    *
    * This method will be called from `Matrix.prototype._get` with two arguments `(i, j)`.
    * It should return whether the pair `(i, j)` is valid for that array's structure, without
    * worrying about being out of bounds (which is checked separately).
    *
    * This method is also called from `Matrix.prototype._set` with three arguments
    * `(i, j, val)`, where `val` is the value that is to be set in those coordinates.
    * It should either return `false ` or throw an error if the assignment should not
    * happen, and return true if it should be allowed to happen.
    */
   Matrix.prototype.validate = function validate(i, j, val) {
      return true;
   };
   /**
    * Return an array of arrays representing the matrix. This representation is
    * as an array of columns (or an array of rows if `byRow` is `true`).
    *
    *     var A = new Matrix([1, 2, 3, 4, 5, 6], { byRow: true, nrow: 3 });
    *     A.toArray(true);  // [[1, 2], [3, 4], [5, 6]]
    *     A.toArray(false); // [[1, 3, 5], [2, 4, 6]]
    */
   Matrix.prototype.toArray = function toArray(byRow) {
      var arr = [];
      if (byRow) {
         this.eachRow(function(row) {
            arr.push(row.toArray());
         });
      } else {
         this.eachCol(function(col) {
            arr.push(col.toArray());
         });
      }
      return arr;
   };

   /**
    * Return a flat vector of the matrix values by concatenating its
    * columns (or its rows if `byRow` is true). This is not a view into
    * the matrix, and cannot be used to change the matrix values.
    */
   Matrix.prototype.toVector = function toVector(byRow) {
      var obj;
      byRow = byRow || false;
      obj = { nrow: this.nrow, ncol: this.ncol, byRow: byRow };
      return new Matrix.Vector(function(n) {
         return this.get(this.rowFromIndex.call(obj, n),
                         this.colFromIndex.call(obj, n));
      }.bind(this), this.nrow * this.ncol);
   };

   /** Force unresolved computations for the matrix. */
   Matrix.prototype.force = function force() {
      return this;
   };

   /**
    * Return the constructor method to be used for creating new objects of
    * this type.
    *
    * Each of these constructors will accept the parameter list `(f, obj)`
    * where `f(i, j)` is a function for generating matrix values, and `obj`
    * has properties `nrow` and `ncol`.
    */
   Matrix.prototype.constr = function constr() {
      return Matrix;
   };

   /**
    * Create a clone of the matrix. The clone inherits the values that the matrix
    * has at the time of cloning. If `faithful` is `true` (default), then the clone
    * also inherits any structure (e.g. being diagonal) when possible.
    *
    * Unfaithful clones are useful if you want to set values of a structured matrix
    * outside of the structure (e.g. setting off-diagonal elements on a diagonal matrix).
    * In general, `Matrix.prototype.set` respects any imposed structure the matrix has
    * on its creation.
    */
   Matrix.prototype.clone = function clone(faithful) {
      if (faithful === false) { // Want faithful to default to true
         return this._clone();
      }
      return this._faithfulClone();
   };
   /* Unfaithful clone. Returns a dense matrix. */
   Matrix.prototype._clone = function _clone() {
      return new Matrix(this.toArray());
   };
   /* Faithful clone. Goes through Matrix#map. */
   Matrix.prototype._faithfulClone = function _faithfulClone() {
      return this.map(function(x) { return x; }).force();
   };

   /** Return the solution to `Ax = b`, where `A` is `this` and  `b` is a `Matrix` or `Vector`.
    * Only works for square non-singular matrices `A` at the moment. */
   Matrix.prototype.solve = function solve(b) {
      if (this._solver == null) { this._solver = this.getSolver(); }
      if (this._solver.isSingular()) { throw new Error('System not solvable'); }
      return this._solver.solve(b);
   };

   /** Internally used to obtain a solver for systems. */
   Matrix.prototype.getSolver = function getSolver() {
      return new Matrix.Solver(this);
   };

   /** Return the inverse of `this`, if `this` is a square non-singular matrix. */
   Matrix.prototype.inverse = function inverse() {
      return this.solve(Matrix.const(1, this));
   };

   /*
    * Return the vector index that would correspond to the i-th row and j-th column.
    * This is used to access the appropriate location in the vector that represents
    * the matrix's values. _This is an internal method_.
    */
   Matrix.prototype.toIndex = function toIndex(i, j) {
      return this.byRow ? (i - 1) * this.ncol + j : (j - 1) * this.nrow + i;
   };
   /*
    * Return the row corresponding to the vector index `n`. This is a partial
    * inverse to `Matrix.prototype.toIndex`. _This is an internal method_.
    */
   Matrix.prototype.rowFromIndex = function rowFromIndex(n) {
      if (this.byRow) {
         return Math.floor((n - 1) / this.ncol) + 1;
      }
      return (n - 1) % this.nrow + 1;
   };
   /*
    * Return the column corresponding to the vector index `n`. This is a partial
    * inverse to `Matrix.prototype.toIndex`. _This is an internal method_.
    */
   Matrix.prototype.colFromIndex = function colFromIndex(n) {
      if (this.byRow) {
         return (n - 1) % this.ncol + 1;
      }
      return Math.floor((n - 1) / this.nrow) + 1;
   };
   /**
    * Return the outer product matrix of two vectors. If a function
    * `f(val1, val2, i, j)` is provided as the second argument, it will be used.
    * If no second argument is provided, the usual multiplication of numbers is
    * used resulting in the standard outer product.
    *
    * TODO: Include helpful examples.
    *
    * TODO: Find a way to add this the Vector docs
    * @memberof Vector
    */
   Matrix.Vector.prototype.outer = function outer(v2, f) {
      var tabf;
      if (f == null) { return new Matrix.OuterM(this, v2); }
      f = op[f] != null ? op[f] : f;
      tabf = function(i, j) { return f(this.get(i), v2.get(j), i, j); }.bind(this);
      return new Matrix(tabf, { nrow: this.length, ncol: v2.length });
   };

   /**
    * Return `this + k * other`, where `this` and `other` are matrices of the
    * same dimensions, and `k` is a scalar.
    */
   Matrix.prototype.pAdd = function pAdd(other, k) {
      return new Matrix.SumM(this, other, k);
   };

   /**
    * Return `k * this`, where `k` is a scalar (required numerical argument).
    */
   Matrix.prototype.sMult = function sMult(k) {
      return this.map(function(val) { return k * val; });
   };

   /**
    * Return the matrix product `this * other`, where `this` and `other` have
    * compatible dimensions.
    */
   Matrix.prototype.mult = function mult(other) {
      return new Matrix.ProdM(this, other);
   };
   /** TODO: Find a way to add to Vector docs */
   Matrix.Vector.prototype.mult = function mult(other) {
      return new Matrix.ProdM(this, other);
   };
   /**
    * Multiply the matrix on the left with a vector `vec`. `vec.length` must equal `this.nrow`.
    * Returns a vector of length `this.ncol`. This is an _internal method_ and bypasses certain tests.
    */
   Matrix.prototype.lvMult = function lvMult(vec) {
      return new Matrix.Vector(function(j) {
         return vec.dot(this.colView(j));
      }.bind(this), this.ncol);
   };
   /**
    * Multiply on the right with a vector `vec`. `vec.length` must equal `this.ncol`.
    * Returns a vector of length `this.nrow`. This is an _internal method_ and bypasses certain tests.
    */
   Matrix.prototype.rvMult = function rvMult(vec) {
      return new Matrix.Vector(function(i) {
         return vec.dot(this.rowView(i));
      }.bind(this), this.nrow);
   };
   /**
    * Return a view into a submatrix of `this`.
    *
    * The parameters `rowIndex`, `colIndex`
    * may be either arrays or functions `f(i)` used to obtain the indices.
    * In the latter case, a third argument `dims` is required.
    *
    * `dims` is an object with properties `nrow` or `ncol` as needed, specifying the
    * dimensions of the resulting matrix.
    *
    *     // A 2x3 matrix
    *     var A1 = new Matrix([2, 3, 4, 5, 6, 7], { nrow: 2 });
    *     // Both return a view into the 2nd & 3rd columns as a 2x2 matrix
    *     var A2 = A1.view([1, 2], [2, 3]);
    *     var A2 = A1.view([1, 2], function(j) { return 1 + j; }, { ncol: 2 });
    *
    * The View matrix (vector) is linked to the original matrix.
    * The mutable state of the view is that of the original
    * matrix. Changing the values in the view also changes the values in the matrix,
    * and vice versa. Use `Matrix.prototype.clone` on the view matrix to break the link.
    */
   Matrix.prototype.view = function view(rowIndex, colIndex, dims) {
      return new Matrix.ViewM(this, rowIndex, colIndex, dims);
   };
   /** Return a `Vector` view of the `i`-th row of the matrix. */
   Matrix.prototype.rowView = function rowView(i) {
      return new Matrix.ViewMV(this, i, 'row');
   };
   /** Return a `Vector` view of the `j`-th column of the matrix. */
   Matrix.prototype.colView = function colView(j) {
      return new Matrix.ViewMV(this, j, 'col');
   };
   /** Return an array of all matrix rows as rowViews */
   Matrix.prototype.rows = function rows() {
      var res, i;
      res = [];
      for (i = 1; i <= this.nrow; i += 1) { res.push(this.rowView(i)); }
      return res;
   };
   /** Return an array of all matrix columns as colViews */
   Matrix.prototype.cols = function cols() {
      var res, j;
      res = [];
      for (j = 1; j <= this.ncol; j += 1) { res.push(this.colView(j)); }
      return res;
   };
   /**
    * Return a `Vector` view of the diagonal of the matrix specified by
    * the given `offset` (defaults to 0). The main diagonal has offset 0, the diagonal
    * above it has offset 1, while the one below the main diagonal has offset -1.
    * Asking for a diagonal beyond the matrix bounds results in an error.
    *
    *     var A1 = new Matrix([2, 3, 4, 5, 6, 7], { nrow: 2 });
    *     A1.diagView();    // [2, 5];
    *     A1.diagView(-1);  // [3];
    *     A1.diagView(1);   // [4, 7];
    *     A1.diagView(2);   // [6];
    *     A1.diagView(3);   // Error;
    */
   Matrix.prototype.diagView = function diagView(offset) {
      return new Matrix.ViewMV(this, offset || 0, 'diag');
   };

   /** Permute the rows of the matrix. */
   Matrix.prototype.rowPermute = function rowPermute(perm) {
      return Matrix.perm(perm, this.nrow).mult(this);
   };

   /** Permute the columns of the matrix. */
   Matrix.prototype.colPermute = function colPermute(perm) {
      return this.mult(Matrix.perm(perm, this.ncol).transpose());
   };

   /**
    * With no arguments, returns the mutable state of the matrix.
    *
    * With a boolean argument, sets the mutable state of the matrix and returns
    * the matrix.
    */
   Matrix.prototype.mutable = function mutable(newSetting) {
      if (newSetting != null) {
         this.values.mutable(newSetting);
         return this;
      }
      return this.values.mutable();
   };

   /**
    * Apply the given function to each entry in the matrix. The signature of the
    * function is `f(val, i, j)`.
    *
    * `Each` respects the "structure" of the matrix. For instance
    * on a `SparseM` matrix, it will only be called on the non-zero entries, on a
    * `DiagM` matrix it will only be called on the diagonal entries, on a `SymmetricM`
    * matrix it will be called on only roughly one half of the entries and so on.
    *
    * If you really need the function to be called on _each_ matrix entry, regardless of
    * structure, then you should use `Matrix.prototype.clone` first to create an
    * "unfaithful clone".
    */
   Matrix.prototype.each = function each(f) {
      var i, j;
      for (i = 1; i <= this.nrow; i += 1) {
         for (j = 1; j <= this.ncol; j += 1) {
            f(this.compute(i, j), i, j);
         }
      }
   };
   /** Alias for `Matrix.prototype.each` */
   Matrix.prototype.forEach = function(f) { return this.each(f); };

   /**
    * Apply the function `f` to each row in the matrix. The signature of `f` is
    * `f(row, i)` where `row` is a `Vector` object representing the `i`-th row.
    */
   Matrix.prototype.eachRow = function eachRow(f) {
      var i;
      for (i = 1; i <= this.nrow; i += 1) {
         f(this.rowView(i), i);
      }
      return this;
   };

   /**
    * Apply the function `f` to each column in the matrix. The signature of `f` is
    * `f(col, j)` where `col` is a `Vector` object representing the `j`-th col.
    */
   Matrix.prototype.eachCol = function eachCol(f) {
      var j;
      for (j = 1; j <= this.ncol; j += 1) {
         f(this.colView(j), j);
      }
      return this;
   };

   /**
    * Return the accumulated value of the calls of `f(acc, val, i, j)` over the entries
    * of the matrix, with `acc` starting with value `initial`.
    *
    * `Matrix.prototype.reduce` is similar to `Matrix.prototype.each` in how it deals
    * with structured matrices.
    *
    * Compare with `Vector.prototype.reduce`.
    *
    *     var A = new Matrix(Math.random, { nrow: 3, ncol: 2 });
    *     // Counts the number of entries in A which exceed 0.5
    *     A.reduce(function(acc, val, i, j) {
    *       return acc + (val > 0.5 ? 1 : 0);
    *     }, 0);
    */
   Matrix.prototype.reduce = function reduce(f, initial) {
      this.each(function(val, i, j) {
         initial = f(initial, val, i, j);
      });
      return initial;
   };

   /**
    * Return the accumulated value of the calls of `f(acc, row, i, j)` over the rows
    * of the matrix, with `acc` starting with value `initial`.
    *
    *     // Add the rows in A with 2-norm >= 1
    *     A.reduce(function(acc, row, i, j) {
    *       if (row.norm() >= 1) { return acc.pAdd(row); }
    *       return acc;
    *     }, Vector.const(0, A.ncol));
    */
   Matrix.prototype.reduceRow = function reduceRow(f, initial) {
      var i;
      for (i = 1; i <= this.nrow; i += 1) {
         initial = f(initial, this.rowView(i), i);
      }
      return initial;
   };

   /**
   * Return the accumulated value of the calls of `f(acc, col, i, j)` over the columns
   * of the matrix, with `acc` starting with value `initial`.
    */
   Matrix.prototype.reduceCol = function reduceCol(f, initial) {
      var j;
      for (j = 1; j <= this.ncol; j += 1) {
         initial = f(initial, this.colView(j), j);
      }
      return initial;
   };

   // WE ARE HERE!
   /**
    * Apply the function `f(val, i, j)` to every entry of the matrix, and assemble the
    * returned values into a new matrix. Just like `Matrix.prototype.each`, this method
    * respects the structure of the input matrix, and will return a matrix with the
    * same structure, only applying `f` on the values pertinent to the structure.
    *
    * If you really need the function to be called on _each_ matrix entry, regardless of
    * structure, then you should use `Matrix.prototype.clone` first to create an
    * "unfaithful clone".
    *
    *     // Create a matrix containing the absolute values of the values in A.
    *     A.map(Math.abs);
    */
   Matrix.prototype.map = function map(f) {
      return new (this.constr())(function(i, j) {
         return f(this.get(i, j), i, j);
      }.bind(this), this);
   };

   /**
    * Apply the function `f(row, i)` to each row in the matrix, and assemble the resulting
    * values.
    *
    * If the return values of `f` are numbers, they are assembled into a `Vector`. If they
    * are arrays or `Vector`s, then they must be of the same length, and they are assembled
    * into a matrix with `nrow` equal to the original matrix's `nrow`, and `ncol` equal to
    * the value's length.
    *
    *     // Create an n x 3 array of the index, 1-norm and 2-norm of each row.
    *     A.mapRow(function(row, i) { return [i, row.norm(1), row.norm(2) ]; });
    */
   Matrix.prototype.mapRow = function mapRow(f) {
      var newRows = [];
      this.eachRow(function(row, i) { newRows.push(f(row, i)); });
      if (newRows[0] instanceof Matrix.Vector) {
         return new Matrix(newRows.map(function(row) {
            return row.toArray();
         }), true);
      }
      if (Array.isArray(newRows[0])) {
         return new Matrix(newRows, true);
      }
      // values of f are numbers
      return new Matrix.Vector(newRows);
   };

   /**
    * Similar to `Matrix.prototype.mapRow`, but operating on the columns of the matrix
    * instead.
    */
   Matrix.prototype.mapCol = function mapCol(f) {
      var newCols = [];
      this.eachCol(function(col, j) { newCols.push(f(col, j)); });
      if (newCols[0] instanceof Matrix.Vector) {
         return new Matrix(newCols.map(function(col) {
            return col.toArray();
         }));
      }
      if (Array.isArray(newCols[0])) {
         return new Matrix(newCols);
      }
      // values of f are numbers
      return new Matrix.Vector(newCols);
   };

   /**
    * Apply function `f(val1, val2, i, j)` to all pairwise entries of `this` and `other`.
    * The matrices must have the same dimensions. No promises are made about the order of
    * iteration.
    */
   Matrix.prototype.eachPair = function eachPair(other, f) {
      var i, j;
      Matrix.ensureSameDims(this, other);
      for (i = 1; i <= this.nrow; i += 1) {
         for (j = 1; j <= this.ncol; j += 1) {
            f(this.get(i, j), other.get(i, j), i, j);
         }
      }
   };

   /**
    * Reduce on the pair of matrices `this` and `other` using the function
    * `f(acc, val1, val2, i, j)`, with an `initial` value.
    * The matrices must have the same dimensions. No promises are made about the order of
    * iteration.
    */
   Matrix.prototype.reducePair = function reducePair(other, f, initial) {
      var i, j;
      Matrix.ensureSameDims(this, other);
      for (i = 1; i <= this.nrow; i += 1) {
         for (j = 1; j <= this.ncol; j += 1) {
            initial = f(initial, this.get(i, j), other.get(i, j), i, j);
         }
      }
      return initial;
   };

   /**
    * Create a new matrix by applying the function `f(val1, val2, i, j)` to all pairwise entries
    * of `this` and `other`. No matrix structure is preserved.
    * The matrices must have the same dimensions.
    */
   Matrix.prototype.mapPair = function mapPair(other, f) {
      Matrix.ensureSameDims(this, other);
      return new Matrix(function(i, j) {
         return f(this.get(i, j), other.get(i, j), i, j);
      }.bind(this), this);
   };

   /**
    * Return true, if the predicate `pred(val, i, j)` is true for at least one entry,
    * false otherwise.
    */
   Matrix.prototype.any = function any(pred) {
      var i, j;
      for (i = 1; i <= this.nrow; i += 1) {
         for (j = 1; j <= this.ncol; j += 1) {
            if (pred(this.get(i, j), i, j)) { return true; }
         }
      }
      return false;
   };

   /** Return true, if the predicate `pred(val, i, j)` is true for all entries, false otherwise. */
   Matrix.prototype.all = function all(pred) {
      var i, j;
      for (i = 1; i <= this.nrow; i += 1) {
         for (j = 1; j <= this.ncol; j += 1) {
            if (!pred(this.get(i, j), i, j)) { return false; }
         }
      }
      return true;
   };

   /** Return the transpose of the matrix, preserving any appropriate structure. */
   Matrix.prototype.transpose = function transpose() {
      return new Matrix(function(i, j) {
         return this.get(j, i);
      }.bind(this), { nrow: this.ncol, ncol: this.nrow });
   };

   /**
    * Return a lower-triangular matrix created by the lower triangle of `this`.
    */
   Matrix.prototype.lower = function lower() {
      return new Matrix.LowerTriM(this);
   };
   /**
    * Return a upper-triangular matrix created by the upper triangle of `this`.
    */
   Matrix.prototype.upper = function upper() {
      return new Matrix.UpperTriM(this);
   };

   Matrix.prototype.isSymmetric = function isSymmetric() {
      return this.equals(this.transpose());
   };

   Matrix.prototype.isLower = function isLower() {
      return this.equals(this.lower());
   };

   Matrix.prototype.isUpper = function isUpper() {
      return this.equals(this.upper());
   };

   /** Test if `this` pointwise equals `m2`, within a given pointwise `tolerance`
    * (defaults to `Vector.tolerance`). */
   Matrix.prototype.equals = function equals(m2, tolerance) {
      var i;
      if (!Matrix.sameDims(this, m2)) { return false; }
      for (i = 1; i <= this.nrow; i += 1) {
         if (!this.rowView(i).equals(m2.rowView(i), tolerance)) {
            return false;
         }
      }
      return true;
   };

   /** Return whether the matrix `A` has the same dimensions as the matrix `B`. */
   Matrix.sameDims = function sameDims(A, B) {
      return A.nrow === B.nrow && A.ncol === B.ncol;
   };

   /** Throw error if `A`, `B` don't have same dimensions. */
   Matrix.ensureSameDims = function ensureSameDims(A, B) {
      if (!Matrix.sameDims(A, B)) {
         throw new Error('Expected matrices of same dimensions.');
      }
   };

   /**
    * Return whether `A` and `B` have compatible dimensions for
    * forming the product `A * B`.  If `A` and; `B` are not both matrices, then
    * one of them is a matrix and the other is a vector.
    */
   Matrix.compatibleDims = function compatibleDims(A, B) {
      if (A instanceof Matrix.Vector) { return A.length === B.nrow; }
      if (B instanceof Matrix.Vector) { return A.ncol === B.length; }
      return A.ncol === B.nrow;
   };

   /**
    * Return whether the (i, j) pair is within the matrix's bounds. Matrices with extra
    * extra structure do further checks via `Matrix.prototype.validate`.
    */
   Matrix.prototype.validIndices = function validIndices(i, j) {
      return i >= 1 && i <= this.nrow && j >= 1 && j <= this.ncol;
   };

   return Matrix;
});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./matrix/dense":22,"./matrix/structured":25,"./matrix/view":35,"./matrix/viewmv":36,"./solver":38,"./utils":44,"./vector":45}],22:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Matrix constructor and
 * creates the subclass DenseM of Matrix
 */
return function(Matrix) {

   /* eslint-disable complexity */
   // Subclass of `Matrix` representing 'dense' matrices.
   function DenseM(arr, options) {
      if (!Array.isArray(arr)) {
         if (typeof arr === 'function') {
            return new DenseM.TabularM(arr, options);
         }
         return new DenseM.SparseM(arr, options);
      }
      if (arr.length === 0) { throw new Error('Cannot create empty matrix yet.'); }
      if (typeof options === 'boolean') { options = { byRow: options }; }
      if (options == null) { options = {}; }
      this.byRow = options.byRow === true;  // byRow defaults to false
      if (Array.isArray(arr[0])) {
         // If array of arrays, set an options parameter and flatten the array
         // The other dimension can be deduced from overall length
         // Assumes arrays are equal length.
         options[this.byRow ? 'nrow' : 'ncol'] = arr.length;
         arr = [].concat.apply([], arr);
      }
      this.values = new Matrix.Vector(arr);
      this.nrow = options.nrow || Math.floor(arr.length / options.ncol);
      this.ncol = options.ncol || Math.floor(arr.length / this.nrow);
      if (this.ncol * this.nrow !== this.values.length) {
         throw new Error('Declared matrix dimensions invalid');
      }
      return this;
   }
   /* eslint-enable */

   DenseM.prototype = Object.create(Matrix.prototype);

   DenseM.SparseM  = require('./dense/sparse')(Matrix, DenseM);
   DenseM.TabularM = require('./dense/tabular')(Matrix, DenseM);

   DenseM.prototype.each = function each(f) {
      var f2 = function f2(val, n) {
         return f(val, this.rowFromIndex(n), this.colFromIndex(n));
      }.bind(this);
      this.values.each(f2, true);
      return this;
   };

   return DenseM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./dense/sparse":23,"./dense/tabular":24}],23:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Matrix constructor and
 * creates the subclass SparseM of Matrix
 */
return function(Matrix, DenseM) {

   // Subclass of `Matrix` representing "Sparse" matrices.
   // Sparse matrices are "by row". TODO: Think about it.
   function SparseM(arr, options) {
      var values = {}, i, j;
      this.byRow = true;
      this.nrow = options && options.nrow;
      this.ncol = options && options.ncol;
      for (i in arr) {
         if (arr.hasOwnProperty(i) && !isNaN(parseInt(i))) {
            for (j in arr[i]) {
               if (arr[i].hasOwnProperty(j) && !isNaN(parseInt(j))) {
                  values[this.toIndex(parseInt(i), parseInt(j))] = arr[i][j];
               }
            }
         }
      }
      this.values = new Matrix.Vector(values, this.nrow * this.ncol);
   }

   SparseM.prototype = Object.create(DenseM.prototype);

   // A, B are matrices (any subclass) of the same dimensions
   // returns the A + kB as a Sparse matrix
   SparseM.add = function add(A, B, k) {
      var res;
      res = {};
      function addValue(val, i, j) {
         if (val === 0) { return; }
         if (res[i] == null) { res[i] = {}; }
         res[i][j] = (res[i][j] || 0) + val;
      }
      A.forEach(addValue);
      B.forEach(function(val, i, j) {
         addValue(k * val, i, j);
      });
      return new SparseM(res, A);
   };

   SparseM.mult = function mult(A, B) {
      var res;
      res = {};
      function addValue(val, i, j) {
         if (val === 0) { return; }
         if (res[i] == null) { res[i] = {}; }
         res[i][j] = (res[i][j] || 0) + val;
      }
      A.forEach(function(Aval, i, k) {
         Object.keys(B.values[k] || {}).forEach(function(j) {
            addValue(Aval * B.values[k][j], i, j);
         });
      });
      return new SparseM(res, { nrow: A.nrow, ncol: B.ncol });
   };

   SparseM.prototype.classes = [SparseM, Matrix];

   SparseM.prototype.map = function map(f) {
      var newValues = {};
      this.each(function(val, i, j) {
         newValues[i] = newValues[i] || {};
         newValues[i][j] = f(val, i, j);
      }, true);
      return new Matrix(newValues, { nrow: this.nrow, ncol: this.ncol });
   };

   SparseM.prototype.transpose = function transpose() {
      var newValues = {};
      this.each(function(val, i, j) {
         newValues[j] = newValues[j] || {};
         newValues[j][i] = val;
      }, true);
      return new Matrix(newValues, { nrow: this.ncol, ncol: this.nrow });
   };

   return SparseM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],24:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Matrix constructor and
 * creates the subclass TabularM of Matrix
 */
return function(Matrix, DenseM) {

   // Subclass of `Matrix` representing "Tabular" matrices.
   function TabularM(f, options) {
      this.byRow = true;
      this.nrow = options && options.nrow;
      this.ncol = options && options.ncol;
      function f2(n) {
         return f(this.rowFromIndex(n), this.colFromIndex(n));
      }
      this.values = new Matrix.Vector(f2.bind(this), this.nrow * this.ncol);
   }

   TabularM.prototype = Object.create(DenseM.prototype);

   TabularM.prototype.force = function force() {
      this.values.force();
      return this;
   };

   return TabularM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],25:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix) {

   // Subclass of `DenseM` acting as a superclass for classes of matrices
   // with some extra structure.
   function StructuredM() {
      // This should never be called directly
      throw new Error('Not meant to call StructuredM');
   }

   StructuredM.prototype = Object.create(Matrix.DenseM.prototype);

   /**
    * Subclass of `Matrix` representing diagonal matrices.
    * Users should not need to access this subclass directly.
    */
   StructuredM.LowerTriM  = require('./structured/lowerTri')(Matrix, StructuredM);
   StructuredM.UpperTriM  = require('./structured/upperTri')(Matrix, StructuredM);
   StructuredM.SymmetricM = require('./structured/symmetric')(Matrix, StructuredM);
   StructuredM.OuterM     = require('./structured/outer')(Matrix, StructuredM);
   StructuredM.SumM       = require('./structured/sum')(Matrix, StructuredM);
   StructuredM.ProdM      = require('./structured/prod')(Matrix, StructuredM);
   StructuredM.DiagM      = require('./structured/diag')(Matrix, StructuredM);
   StructuredM.CDiagM     = require('./structured/cDiag')(Matrix, StructuredM);
   StructuredM.PermM      = require('./structured/perm')(Matrix, StructuredM);

   return StructuredM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./structured/cDiag":26,"./structured/diag":27,"./structured/lowerTri":28,"./structured/outer":29,"./structured/perm":30,"./structured/prod":31,"./structured/sum":32,"./structured/symmetric":33,"./structured/upperTri":34}],26:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Matrix constructor and
 * creates the subclass DiagM of Matrix
 */
return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing matrices that are constant multiples of
   // identity.
   //
   // `nrow` needs to be an object with an `nrow` property, or a number.
   //
   // CDiagM matrices are immutable.
   //
   // Using rowView/colView on diagonal matrices may be quite inefficient,
   // as it does not recognize the sparse nature of those vectors.
   function CDiagM(val, nrow) {
      nrow = nrow && nrow.nrow || nrow;
      if (nrow == null) { throw new Error('Must specify matrix dimensions'); }
      this.val = val;
      this.byRow = false;
      this.nrow = nrow;
      this.ncol = nrow;
   }

   CDiagM.prototype = Object.create(StructuredM.DiagM.prototype);

   CDiagM.add = function add(A, B, k) {
      return new CDiagM(A.val + k * B.val, A);
   };

   CDiagM.prototype.classes = [
      CDiagM, StructuredM.DiagM, StructuredM.LowerTriM,
      StructuredM.UpperTriM, StructuredM.SymmetricM,
      Matrix
   ];

   CDiagM.prototype.mutable = function mutable(newSetting) {
      if (newSetting == null) { return false; }
      throw new Error('Cannot set constant to be mutable');
   };

   CDiagM.prototype.change = function(i, j, val) {
      throw new Error('Trying to set entry in constant matrix');
   };

   CDiagM.prototype.compute = function(i, j) {
      return i === j ? this.val : 0;
   };

   // constructor to use for applying map
   CDiagM.prototype.constr = function constr() {
      return StructuredM.DiagM;
   };

   CDiagM.prototype.each = function each(f) {
      var i;
      for (i = 1; i <= this.nrow; i += 1) {
         f(this.val, i, i);
      }
      return this;
   };

   CDiagM.prototype.inverse = function inverse() {
      if (this.val === 0) { throw new Error('Cannot invert zero matrix.'); }
      return new CDiagM(1 / this.val, this);
   };

   CDiagM.prototype.sMult = function sMult(k) {
      return new CDiagM(k * this.val, this);
   };

   return CDiagM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],27:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Matrix constructor and
 * creates the subclass DiagM of Matrix
 */
return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Diagonal" matrices.
   // DiagM takes ownership of the diagonal vector and may
   // change its values when it itself is changed. Clone the
   // array/vector before passing it to avoid this.
   //
   // `diagonal` needs to be a `Vector`, an array, a function, or a number.
   //
   // `nrow` needs to be an object with an `nrow` property, or a number.
   //
   // One can only set values on the diagonal of a DiagM matrix.
   // Trying to set outside the diagonal will result in error.
   // In order to set values outside the diagonal, would need to
   // "unstructure" the matrix.
   //
   // Using rowView/colView on diagonal matrices may be quite inefficient,
   // as it does not recognize the sparse nature of those vectors.
   function DiagM(diagonal, nrow) {
      if (!(diagonal instanceof Matrix.Vector)) {
         if (typeof diagonal === 'function') {
            diagonal = function(i) {
               return this(i, i);
            }.bind(diagonal);
         }
         diagonal = new Matrix.Vector(diagonal, nrow && nrow.nrow || nrow);
      }
      this.byRow = false;
      this.values = diagonal;
      this.nrow = this.values.length;
      this.ncol = this.values.length;
   }

   DiagM.prototype = Object.create(StructuredM.prototype);

   DiagM.prototype.classes = [
      DiagM, StructuredM.LowerTriM,
      StructuredM.UpperTriM, StructuredM.SymmetricM,
      Matrix
   ];

   DiagM.prototype.validate = function(i, j, val) {
      if (i === j) { return true; }
      if (arguments.length > 2 && val !== 0) {
         throw new Error('Trying to set non-diagonal entry in diagonal matrix');
      }
      return false;
   };

   DiagM.prototype.toIndex = function toIndex(i, j) {
      return i;
   };
   DiagM.prototype.rowFromIndex = function rowFromIndex(n) {
      return n;
   };
   DiagM.prototype.colFromIndex = function colFromIndex(n) {
      return n;
   };

   DiagM.prototype.constr = function constr() {
      return DiagM;
   };

   DiagM.prototype.transpose = function transpose() {
      return this;
   };

   DiagM.prototype.isSymmetric =
   DiagM.prototype.isLower =
   DiagM.prototype.isUpper = function() { return true; };

   DiagM.prototype.inverse = function inverse() {
      return Matrix.diag(Matrix.prototype.inverse.call(this).diagView());
   };

   // Multiply on the left with B
   DiagM.prototype.lMult = function lMult(B) {
      return B.map(function(val, i, j) {
         return val * this.get(j, j);
      }.bind(this));
   };

   // Multiply on the right with B
   DiagM.prototype.rMult = function rMult(B) {
      return B.map(function(val, i, j) {
         return val * this.get(i, i);
      }.bind(this));
   };

   return DiagM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],28:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Lower triangular" matrices.
   //
   // Possible ways to specify:
   // 1. A full square matrix, and we grab the lower triangular part. If the
   // matrix is already `LowerTriM`, returns the matrix itself.
   // 2. A function. Second argument would then be the nrow = ncol, or an
   // object with an `nrow` property.
   // 3. A single value, to be used for all entries. Second argument nrow needed.
   function LowerTriM(values, nrow) {
      var getValue;
      if (values instanceof LowerTriM) { return values; }
      this.byRow = true;
      this.nrow = nrow && nrow.nrow || nrow; // nrow is object or number
      if (values instanceof Matrix) {
         this.nrow = Math.min(values.nrow, values.ncol);
         getValue = values._get.bind(values);
      } else {
         getValue = typeof values === 'function' ? values : function() { return values; };
      }
      this.ncol = this.nrow;
      this.values = new Matrix.Vector(function(n) {
         return getValue(this.rowFromIndex(n), this.colFromIndex(n));
      }.bind(this), this.toIndex(this.nrow, this.ncol));
   }

   LowerTriM.prototype = Object.create(StructuredM.prototype);

   LowerTriM.prototype.classes = [ LowerTriM, Matrix ];

   LowerTriM.prototype.toIndex = function toIndex(i, j) {
      return i * (i - 1) / 2 + j;
   };
   LowerTriM.prototype.rowFromIndex = function rowFromIndex(n) {
      return Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
   };
   LowerTriM.prototype.colFromIndex = function colFromIndex(n) {
      var i = Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
      return n - i * (i - 1) / 2;
   };

   LowerTriM.prototype.validate = function(i, j, val) {
      if (i >= j) { return true; }
      if (arguments.length > 2 && val !== 0) {
         throw new Error('Trying to set upper entry in Lower triangular matrix');
      }
      return false;
   };

   LowerTriM.prototype.constr = function constr() {
      return LowerTriM;
   };

   LowerTriM.prototype.transpose = function transpose() {
      return new StructuredM.UpperTriM(function(i, j) {
         return this.get(j, i);
      }.bind(this), { nrow: this.ncol, ncol: this.nrow });
   };

   LowerTriM.prototype.inverse = function inverse() {
      return Matrix.prototype.inverse.call(this).lower();
   };

   LowerTriM.prototype.isLower = function() { return true; };

   return LowerTriM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],29:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Outer Product" matrices.
   // v1, v2 are vectors
   function OuterM(v1, v2) {
      this.v1 = new Matrix.Vector(v1);
      this.v2 = new Matrix.Vector(v2);
      this.byRow = false;
      this.nrow = this.v1.length;
      this.ncol = this.v2.length;
   }

   OuterM.prototype = Object.create(StructuredM.prototype);

   OuterM.prototype.classes = [ OuterM, Matrix ];

   OuterM.prototype.mutable = function mutable(newSetting) {
      if (newSetting == null) { return false; }
      throw new Error('Cannot set outer product matrix to be mutable');
   };

   OuterM.prototype.change = function(i, j, val) {
      throw new Error('Trying to set entry in outer product matrix');
   };

   OuterM.prototype.compute = function(i, j) {
      return this.v1.get(i) * this.v2.get(j);
   };

   // constructor to use for applying map
   OuterM.prototype.constr = function constr() {
      return Matrix;
   };

   OuterM.prototype.lvMult = function lvMult(v) {
      return this.v2.sMult(v.dot(this.v1));
   };

   OuterM.prototype.rvMult = function rvMult(v) {
      return this.v1.sMult(v.dot(this.v2));
   };

   OuterM.prototype.lMult = function lMult(m) {
      return new OuterM(m.mult(this.v1), this.v2);
   };

   OuterM.prototype.rMult = function rMult(m) {
      return new OuterM(this.v1, this.v2.mult(m));
   };

   OuterM.prototype.sMult = function sMult(k) {
      return new OuterM(this.v1.sMult(k), this.v2);
   };

   OuterM.prototype.transpose = function transpose() {
      return new OuterM(this.v2, this.v1);
   };

   return OuterM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],30:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

var Permutation = require('./../../permutation.js');

return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Permutation" matrices.
   // perm is a Perm or something that can turned into a Perm
   function PermM(perm, nrow) {
      this.perm     = new Permutation(perm);
      this.invPerm  = this.perm.inverse();
      this.nrow     = nrow && nrow.nrow || nrow;
      this.ncol     = this.nrow;
      this.byRow    = false;
   }

   PermM.mult = function(A, B) {
      return new PermM(B.perm.compose(A.perm), A);
   };

   PermM.prototype = Object.create(StructuredM.prototype);

   PermM.prototype.classes = [ PermM, StructuredM, Matrix ];

   PermM.prototype.mutable = function mutable(newSetting) {
      if (newSetting == null) { return false; }
      throw new Error('Cannot set permutation matrix to be mutable');
   };

   PermM.prototype.change = function(i, j, val) {
      throw new Error('Trying to set entry in permutation matrix');
   };

   PermM.prototype.compute = function(i, j) {
      return i === this.perm.get(j) ? 1 : 0;
   };

   // constructor to use for applying map
   PermM.prototype.constr = function constr() {
      return Matrix;
   };

   PermM.prototype.lvMult = function lvMult(v) {
      return v.permute(this.invPerm);
   };

   PermM.prototype.rvMult = function rvMult(v) {
      return v.permute(this.perm);
   };

   // Solvers may depend on the fact that lMult & mMult
   // return a ViewM.
   PermM.prototype.lMult = function lMult(m) {
      if (m.isA(PermM)) { return PermM.mult(m, this); }
      return m.view(ident, this.perm.get.bind(this.perm), m);
   };

   PermM.prototype.rMult = function rMult(m) {
      if (m.isA(PermM)) { return PermM.mult(this, m); }
      return m.view(this.invPerm.get.bind(this.invPerm), ident, m);
   };

   PermM.prototype.sMult = function sMult(k) {
      return sparsify(this).sMult(k);
   };

   PermM.prototype.map = function map(f) {
      return sparsify(this).map(f);
   };

   PermM.prototype.each = function each(f) {
      sparsify(this).each(f);
      return this;
   };

   PermM.prototype.inverse =
   PermM.prototype.transpose = function transpose() {
      return new PermM(this.invPerm, this);
   };

   function ident(i) { return i; }

   function sparsify(m) {
      var obj, i;
      obj = {};
      for (i = 1; i <= m.nrow; i += 1) {
         obj[m.perm.get(i)] = { };
         obj[m.perm.get(i)][i] = 1;
      }
      return new Matrix.SparseM(obj, m);
   }

   return PermM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../../permutation.js":37}],31:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {
   // return A * B
   function ProdM(A, B) {
      if (!Matrix.compatibleDims(A, B)) {
         throw new Error('Cannot multiply matrices/vectors with incompatible dimensions.');
      }
      return computeProd(A, B);
   }

   ProdM.prototype = Object.create(StructuredM.prototype);

   /* eslint-disable complexity */
   function computeProd(A, B) {
      var Constr, rowsA, colsB;
      // A or B Vector
      if (A instanceof Matrix.Vector) { return B.lvMult(A); }
      if (B instanceof Matrix.Vector) { return A.rvMult(B); }
      // A, B both Matrices
      // if both sparse, return a sparse
      if (A.isA(Matrix.PermM)) { return A.rMult(B); }
      if (B.isA(Matrix.PermM)) { return B.lMult(A); }
      if (A.isA(Matrix.SparseM) && B.isA(Matrix.SparseM)) {
         return Matrix.SparseM.mult(A, B);
      }
      // if both cdiag, return a cdiag
      if (A.isA(Matrix.CDiagM)) { return B.sMult(A.val); }
      if (B.isA(Matrix.CDiagM)) { return A.sMult(B.val); }
      if (A.isA(Matrix.DiagM) || A.isA(Matrix.OuterM)) { return A.rMult(B); }
      if (B.isA(Matrix.DiagM) || B.isA(Matrix.OuterM)) { return B.lMult(A); }
      if (A.isA(Matrix.UpperTriM) && B.isA(Matrix.LowerTriM)) {
         return Matrix.diag(function(i) {
            return A.rowView(i).dot(B.colView(i));
         }, A);
      }
      // in every other case, use commonConstr (give constructor a function)
      // TODO: Optimize this later
      Constr = Matrix.commonConstr(A, B);
      if (Constr === Matrix.SymmetricM) { Constr = Matrix; }
      rowsA = A.rows();
      colsB = B.cols();
      return new Constr(function(i, j) {
         return rowsA[i - 1].dot(colsB[j - 1]);
      }, { nrow: A.nrow, ncol: B.ncol });
   }
   /* eslint-enable */

   return ProdM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],32:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {
   // return A + kB
   function SumM(A, B, k) {
      if (k == null) { k = 1; }
      Matrix.ensureSameDims(A, B);
      return computeSum(A, B, k);
   }

   SumM.prototype = Object.create(StructuredM.prototype);

   function computeSum(A, B, k) {
      // if both sparse, return a sparse (via SparseM.add??)
      if (A.isA(Matrix.SparseM) && B.isA(Matrix.SparseM)) {
         return Matrix.SparseM.add(A, B, k);
      }
      // if both cdiag, return a cdiag
      if (A.isA(Matrix.CDiagM) && B.isA(Matrix.CDiagM)) {
         return Matrix.CDiagM.add(A, B, k);
      }
      // in every other case, use commonConstr (give constructor a function)
      return new (Matrix.commonConstr(A, B))(function(i, j) {
         return A.get(i, j) + k * B.get(i, j);
      }, A);
   }

   return SumM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],33:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Symmetric" matrices.
   //
   // Possible ways to specify:
   // 1. A full square matrix (it better be symmetric to begin with). If the
   // matrix is already `SymmetricM`, returns the matrix itself.
   // 2. A function. Second argument would then be the nrow = ncol, or an
   // object with an `nrow` property. The function better be symmetric.
   // 3. A single value, to be used for all entries. Second argument nrow needed.
   function SymmetricM(values, nrow) {
      var getValue;
      if (values instanceof SymmetricM) { return values; }
      this.byRow = true;
      this.nrow = nrow && nrow.nrow || nrow; // nrow is object or number
      if (values instanceof Matrix) {
         this.nrow = Math.min(values.nrow, values.ncol);
         getValue = values._get.bind(values);
      } else {
         getValue = typeof values === 'function' ? values : function() { return values; };
      }
      this.ncol = this.nrow;
      this.values = new Matrix.Vector(function(n) {
         return getValue(this.rowFromIndex(n), this.colFromIndex(n));
      }.bind(this), this.toIndex(this.nrow, this.ncol));
   }

   SymmetricM.prototype = Object.create(StructuredM.prototype);

   SymmetricM.prototype.classes = [ SymmetricM, Matrix ];

   SymmetricM.prototype.toIndex = function toIndex(i, j) {
      if (j > i) { return j * (j - 1) / 2 + i; }
      return i * (i - 1) / 2 + j;
   };
   SymmetricM.prototype.rowFromIndex = function rowFromIndex(n) {
      return Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
   };
   SymmetricM.prototype.colFromIndex = function colFromIndex(n) {
      var i = Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
      return n - i * (i - 1) / 2;
   };

   SymmetricM.prototype.constr = function constr() {
      return Matrix;
   };

   SymmetricM.prototype.transpose = function transpose() {
      return this;
   };

   SymmetricM.prototype.isSymmetric = function() { return true; };

   SymmetricM.prototype.inverse = function inverse() {
      return new SymmetricM(Matrix.prototype.inverse.call(this));
   };

   // Needs its own sMult to ensure the result is still symmetric
   SymmetricM.prototype.sMult = function sMult(k) {
      return new SymmetricM(function(i, j) {
         return k * this.get(i, j);
      }.bind(this), this);
   };

   return SymmetricM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],34:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix, StructuredM) {

   // Subclass of `StructuredM` representing "Upper triangular" matrices.
   //
   // Possible ways to specify:
   // 1. A full square matrix, and we grab the Upper triangular part. If the
   // matrix is already `UpperTriM`, returns the matrix itself.
   // 2. A function. Second argument would then be the nrow = ncol, or an
   // object with an `ncol` property.
   // 3. A single value, to be used for all entries. Second argument ncol needed.
   function UpperTriM(values, ncol) {
      var getValue;
      if (values instanceof UpperTriM) { return values; }
      this.byRow = false;
      this.nrow = ncol && ncol.ncol || ncol;
      if (values instanceof Matrix) {
         this.nrow = Math.min(values.nrow, values.ncol);
         getValue = values._get.bind(values);
      } else {
         getValue = typeof values === 'function' ? values : function() { return values; };
      }
      this.ncol = this.nrow;
      this.values = new Matrix.Vector(function(n) {
         return getValue(this.rowFromIndex(n), this.colFromIndex(n));
      }.bind(this), this.toIndex(this.nrow, this.ncol));
   }

   UpperTriM.prototype = Object.create(StructuredM.prototype);

   UpperTriM.prototype.classes = [ UpperTriM, Matrix ];

   UpperTriM.prototype.toIndex = function toIndex(i, j) {
      return j * (j - 1) / 2 + i;
   };
   UpperTriM.prototype.rowFromIndex = function rowFromIndex(n) {
      var j = Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
      return n - j * (j - 1) / 2;
   };
   UpperTriM.prototype.colFromIndex = function colFromIndex(n) {
      return Math.floor((1 + Math.sqrt(1 + 8 * (n - 1))) / 2);
   };
   UpperTriM.prototype.constr = function constr() {
      return UpperTriM;
   };

   UpperTriM.prototype.validate = function(i, j, val) {
      if (i <= j) { return true; }
      if (arguments.length > 2 && val !== 0) {
         throw new Error('Trying to set lower entry in Upper triangular matrix');
      }
      return false;
   };

   UpperTriM.prototype.transpose = function transpose() {
      return new StructuredM.LowerTriM(function(i, j) {
         return this.get(j, i);
      }.bind(this), { nrow: this.ncol, ncol: this.nrow });
   };

   UpperTriM.prototype.inverse = function inverse() {
      return Matrix.prototype.inverse.call(this).upper();
   };

   UpperTriM.prototype.isUpper = function() { return true; };

   return UpperTriM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],35:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a ...
 */
return function(Matrix) {

   function ViewM(target, rowIndex, colIndex, dims) {
      this.target = target;
      function lookup(indices) {
         if (typeof indices === 'function') { return indices; }
         if (Array.isArray(indices)) {
            return function(i) { return indices[i - 1]; };
         }
         return function(i) { return indices; }; // constant
      }
      // this.i(i) is the row in target corresponding to the i-th row in view
      this.i = lookup(rowIndex);
      this.j = lookup(colIndex);
      this.nrow = Array.isArray(rowIndex) ? rowIndex.length : dims.nrow;
      this.ncol = Array.isArray(colIndex) ? colIndex.length : dims.ncol;
      this.byRow = false;
      return this;
   }

   ViewM.prototype = Object.create(Matrix.prototype);

   ViewM.prototype.compute = function compute(i, j) {
      return this.target._get(this.i(i), this.j(j));
   };

   ViewM.prototype.change = function change(i, j, val) {
      this.target._set(this.i(i), this.j(j), val);
      return this;
   };

   ViewM.prototype.mutable = function mutable(newSetting) {
      if (newSetting != null) {
         this.target.mutable(newSetting);
         return this;
      }
      return this.target.mutable();
   };

   return ViewM;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],36:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix) {

   /* Subclass of Vector for expressing a row or column of a matrix.
    */
   /* eslint-disable complexity */
   function ViewMV(target, index, direction) {
      var jEnd;
      if (direction == null) {
         throw new Error('`direction` is a required argument');
      }
      this.direction = direction; // row, col, or diag
      this.target = target;
      this.index = index;  // diag 0 is main diagonal
      if (this.direction === 'row') {
         if (index < 1 || index > target.nrow) {
            throw new Error('Row index out of bounds');
         }
         this.length = target.ncol;
      } else if (this.direction === 'col') {
         if (index < 1 || index > target.ncol) {
            throw new Error('Column index out of bounds');
         }
         this.length = target.nrow;
      } else {
         // only diagonals have offsets
         this.iOffset = Math.max(-index, 0); // start row is 1 + this
         this.jOffset = Math.max(index, 0);  // start col is 1 + this
         jEnd = Math.min(target.ncol, target.nrow + index);
         this.length = jEnd - this.jOffset;
         if (this.length <= 0) {
            throw new Error('Diagonal offset out of bounds');
         }
      }
      return this;
   }
   /* eslint-enable */
   ViewMV.prototype = Object.create(Matrix.Vector.ViewV.prototype);

   ViewMV.prototype.compute = function compute(i) {
      if (this.direction === 'row') {
         return this.target._get(this.index, i);
      } else if (this.direction === 'col') {
         return this.target._get(i, this.index);
      }
      // diagonal -- i already validated
      return this.target._get(i + this.iOffset, i + this.jOffset);
   };

   ViewMV.prototype.change = function change(i, val) {
      if (this.direction === 'row') {
         this.target._set(this.index, i, val);
      } else if (this.direction === 'col') {
         this.target._set(i, this.index, val);
      } else {
         // diagonal
         this.target._set(i + this.iOffset, i + this.jOffset, val);
      }
      return this;
   };

   return ViewMV;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],37:[function(require,module,exports){
/**
 * Algebraic Permutations on finite sets.
 * @module Permutation
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */

(function(define) {'use strict';
define(function(require) {

   /**
    * A class representing permutations on sets `{1, 2, ..., n}`. Permutations are
    * represented via a "function object" whose key-value pairs are non-fixed points of
    * the permutation. In other words, if `s(i) = j` and `j` is not equal to `i`, then
    * the object contains a key `i` with value `j`. If a key `i` does not appear in the
    * object then `s(i) = i`. For example the cycle `(2 4)` can be represented as the
    * object `{ 2: 4, 4: 2 }`.
    *
    * The size `n` is only implicit; permutations can be thought of as functions on any
    * set big enough to contain their non-fixed points.
    * The first argument, `relation`, needs to be either an array representing a cycle,
    * an array of arrays representing a product of cycles, or a "function object".
    *
    * It can also be called with another `Permutation` as first argument, in which case
    * it returns that permutation.
    */
   function Permutation(relation) {
      if (relation instanceof Permutation) { return relation; }
      if (!this instanceof Permutation) { return new Permutation(relation); }
      this.nonfixed = Permutation.cycleToObject(relation || {});
   }

   Permutation.prototype = Object.create({});

   Permutation.prototype.get = function get(i) {
      if (i < 1) { throw new Error('Permutations require positive arguments.'); }
      return this.nonfixed[i] || i;
   };

   /**
    * Return the composed permutation of `this` followed by `other`.
    * `other` may be a `Permutation`, a cycle, array of cycles, or a "function object".
    */
   Permutation.prototype.compose = function compose(other) {
      other = other instanceof Permutation ?
              other.nonfixed :
              Permutation.cycleToObject(other);
      return new Permutation(_compose(this.nonfixed, other));
   };
   // Helper methods

   /**
    * Return the inverse permutation
    */
   Permutation.prototype.inverse = function inverse() {
      var newNonfixed, oldNonfixed;
      oldNonfixed = this.nonfixed;
      newNonfixed = {};
      Object.keys(oldNonfixed).forEach(function (key) {
         newNonfixed[oldNonfixed[key]] = parseInt(key);
      });
      return new Permutation(newNonfixed);
   };

   /**
    * Return an array representing the cycle representation of the permutation.
    */
   Permutation.prototype.toCycles = function toCycles() {
      var cycles, cycle, visited, start, key, relation;

      cycles = [];
      visited = {};
      relation = this.nonfixed;
      for (key in relation) {
         if (relation.hasOwnProperty(key) && !visited[key]) {
            start = parseInt(key);
            cycle = [start];
            visited[key] = true;
            while (relation[key] !== start) {
               key = relation[key];
               visited[key] = true;
               cycle.push(key);
            }
            cycles.push(cycle);
         }
      }
      return cycles;
   };

   /**
    * Return the function object represented by the cycle. Helper method.
    * It also recognizes an array of cycles, or a "function object".
    */
   Permutation.cycleToObject = function cycleToObject(cycles) {
      var result;
      if (!Array.isArray(cycles)) { return cycles; }
      cycles = Array.isArray(cycles[0]) ? cycles : [cycles];
      result = {};
      cycles.forEach(function(cycle) {
         result = _compose(result, convert(cycle));
      });
      return result;
   };

   // Helper methods

   // Converts a single cycle to a function object
   function convert(cycle) {
      var result, i;
      result = {};
      for (i = 0; i < cycle.length; i += 1) {
         result[cycle[i]] = cycle[(i + 1) % cycle.length];
      }
      return result;
   }

   // Composes two "function objects"
   function _compose(first, second) {
      var keys, result;
      result = {};
      keys = Object.keys(first).concat(Object.keys(second));
      keys.forEach(function(key) {
         var value;
         key = parseInt(key);
         value = first[key] || key;
         value = second[value] || value;
         if (value !== key) { result[key] = value; }
      });
      return result;
   }

   return Permutation;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],38:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Matrix) {

   var Vector;

   Vector = Matrix.Vector;

   /**
    * Top level class for solving linear systems
    */
   function Solver(A) {
      /* Each subclass should define this.nrow */
      var ret;
      if (A.isUpper()) {
         return A.isLower() ? new Solver.DiagS(A.diagView()) : new Solver.UpperS(A);
      } else if (A.isLower()) { return new Solver.LowerS(A); }
      if (A.isSymmetric()) {
         ret = new Solver.CholeskyS(A);
         if (!ret.isSingular()) { return ret; }
      }
      return new Solver.PLUS(A);
   }

   Solver.Matrix = Matrix;
   Solver.prototype = Object.create({});

   Solver.DiagS     = require('./solver/diag')(Solver);
   Solver.LowerS    = require('./solver/lower')(Solver);
   Solver.UpperS    = require('./solver/upper')(Solver);
   Solver.PLUS      = require('./solver/plu')(Solver);
   Solver.CholeskyS = require('./solver/cholesky')(Solver);

   /** Expects b to be a Vector or Matrix (maybe array also?) */
   Solver.prototype.solve = function solve(b) {
      this.ensureCompatibleDims(b);
      if (b instanceof Vector) { return this._solve(b); }
      return new Matrix(b.mapCol(this._solve.bind(this)));
   };

   /**
    * Return whether the system that the solver solves is "singular". Overridden in
    * subclasses.
    * When `isSingular` returns true, you should not call `solve`.
    */
   Solver.prototype.isSingular = function isSingular() {
      return false;
   };

   Solver.prototype.ensureCompatibleDims = function ensureCompatibleDims(b) {
      if (this.nrow !== (b instanceof Vector ? b.length : b.nrow)) {
         throw new Error('Solver and RHS have incompatible dimensions.');
      }
      return;
   };

   return Solver;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./solver/cholesky":39,"./solver/diag":40,"./solver/lower":41,"./solver/plu":42,"./solver/upper":43}],39:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Solver) {

   /**
    * Solves the system Ax = b for a symmetric positive definite A by computing
    * a Cholesky decomposition. `A` is a square symmetric positive definite matrix.
    * "isSingular" returning true would indicate the matrix is not positive definite.
    */
   function CholeskyS(A) {
      this.A = A;
      computeCholesky.call(this); // sets G, G^T
      this.nrow = A.nrow;
   }

   CholeskyS.prototype = Object.create(Solver.prototype);

   CholeskyS.prototype._solve = function _solve(b) {
      return this.GT.solve(this.G.solve(b));
   };

   // local methods
   // computeCholesky sets the G, G^T solvers for `this` so that A = G*G^T.
   function computeCholesky() {
      var G, i, j, k, val;
      G = this.A.lower().mutable(true);
      for (j = 1; j <= G.ncol; j += 1) {
         for (k = 1; k < j; k += 1) {
            for (i = j; i <= G.nrow; i += 1) {
               G.set(i, j, G.get(i, j) - G.get(j, k) * G.get(i, k));
            }
         }
         val = Math.sqrt(G.get(j, j));
         for (i = j; i <= G.nrow; i += 1) {
            G.set(i, j, G.get(i, j) / val);
         }
      }
      this.G = new Solver.LowerS(G);
      this.GT = new Solver.UpperS(G.transpose());
      return;
   }

   CholeskyS.prototype.isSingular = function isSingular() {
      return this.G.isSingular();
   };

   return CholeskyS;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],40:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Solver) {

   var Vector, Matrix;

   Matrix = Solver.Matrix;
   Vector = Matrix.Vector;
   /**
    * diag is meant to be the diagonal of a diagonal matrix D.
    * Solves the system Dx = b.
    */
   function DiagS(diag) {
      this.diag = new Vector(diag);
      this.nrow = this.diag.length;
   }

   DiagS.prototype = Object.create(Solver.prototype);

   /** Expects b to be a vector. Returns a vector */
   DiagS.prototype._solve = function _solve(b) {
      return b.pDiv(this.diag);
   };

   DiagS.prototype.isSingular = function isSingular() {
      return this.diag.any(function(x) { return x === 0; });
   };

   return DiagS;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],41:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Solver) {

   var Vector, Matrix, utils;

   utils = require('./../utils');
   Matrix = Solver.Matrix;
   Vector = Matrix.Vector;
   /**
    * Expects a `LowerTriM` matrix for `A` (or full square matrix and it will use its lower triangle).
    * Solves by forward substitution.
    */
   function LowerS(A) {
      this.A = new Matrix.LowerTriM(A);
      this.nrow = this.A.nrow;
   }

   LowerS.prototype = Object.create(Solver.prototype);

   /** Expects b to be a vector. Returns a vector */
   LowerS.prototype._solve = function _solve(b) {
      var x, i, j, v;
      x = [];
      for (i = 1; i <= this.nrow; i += 1) {
         v = b.get(i);
         for (j = 1; j < i; j += 1) { v -= this.A.get(i, j) * x[j - 1]; }
         x.push(v / this.A.get(i, i));
      }
      return new Vector(x);
   };

   LowerS.prototype.isSingular = function isSingular() {
      return this.A.diagView().any(function(x) {
         return isNaN(x) || utils.veryClose(x, 0, Vector.tolerance);
      });
   };

   return LowerS;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":44}],42:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Solver) {

   var Matrix, utils;

   utils  = require('./../utils');
   Matrix = Solver.Matrix;

   /**
    * Solves the system Ax = b by computing a PLU decomposition.
    * `A` is a square matrix and `strategy` specifies the pivoting
    * strategy for the PLU solver ('partial' or 'complete').
    */
   function PLUS(A, strategy) {
      this.A = A;
      this.strategy = strategy || 'partial';
      computePLU.call(this); // sets P (perm), L (solver), U (solver)
      this.nrow = A.nrow;
   }

   PLUS.prototype = Object.create(Solver.prototype);

   PLUS.prototype._solve = function _solve(b) {
      // LUx = Pb
      return this.U.solve(this.L.solve(this.P.mult(b)));
   };

   // local methods
   // computePLU sets the P, L, U for this so that P*A = L*U.
   // TODO:  add the ability to handle 'complete' pivoting strategy
   function computePLU() {
      var A, origA, i, j, k, pivot;
      // returns the rowIndex of the maximum of the values |A(k, k)| through |A(n, k)|
      function getPivot(A, k) {
         var max, maxRow, r;
         max = -Infinity;
         for (r = k; r <= A.nrow; r += 1) {
            if (Math.abs(A.get(r, k)) > max) {
               max = Math.abs(A.get(r, k));
               maxRow = r;
            }
         }
         return maxRow;
      }
      A = origA = this.A.clone(false).mutable(true);
      this.P = Matrix.perm({}, A.nrow); // ID matrix as a PermM
      for (k = 1; k <= A.ncol; k += 1) {
         pivot = getPivot(A, k);
         if (utils.veryClose(A.get(pivot, k), 0, Matrix.Vector.tolerance)) {
            continue;
         }
         if (pivot !== k) {
            this.P = Matrix.perm([pivot, k], A.nrow).mult(this.P);
            A = this.P.mult(origA);
         }
         for (i = k + 1; i <= A.nrow; i += 1) {
            A.set(i, k, A.get(i, k) / A.get(k, k));
            for (j = k + 1; j <= A.ncol; j += 1) {
               A.set(i, j, A.get(i, j) - A.get(i, k) * A.get(k, j));
            }
         }
      }
      this.U = new Solver.UpperS(A.mutable(false).upper());
      function lowerLookup(i, j) {
         return i === j ? 1 : A.get(i, j);
      }
      this.L = new Solver.LowerS(new Matrix.LowerTriM(lowerLookup, A.nrow));
   }

   PLUS.prototype.isSingular = function isSingular() {
      return this.U.isSingular();
   };

   return PLUS;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":44}],43:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

return function(Solver) {

   var Vector, Matrix, utils;

   utils = require('./../utils');
   Matrix = Solver.Matrix;
   Vector = Matrix.Vector;
   /**
    * Expects a `UpperTriM` matrix for `A` (or full square matrix and it will use its Upper triangle).
    * Solves by back substitution.
    */
   function UpperS(A) {
      this.A = new Matrix.UpperTriM(A);
      this.nrow = this.A.nrow;
   }

   UpperS.prototype = Object.create(Solver.prototype);

   /** Expects b to be a vector. Returns a vector */
   UpperS.prototype._solve = function _solve(b) {
      var x, i, j, v;
      x = [];
      for (i = this.nrow; i >= 1; i -= 1) {
         v = b.get(i);
         for (j = this.nrow; j > i; j -= 1) { v -= this.A.get(i, j) * x[j - 1]; }
         x[i - 1] = v / this.A.get(i, i);
      }
      return new Vector(x);
   };

   UpperS.prototype.isSingular = function isSingular() {
      return this.A.diagView().any(function(x) {
         return isNaN(x) || utils.veryClose(x, 0, Vector.tolerance);
      });
   };

   return UpperS;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./../utils":44}],44:[function(require,module,exports){
/**
 * Utility library for linAlg.
 * @module utils
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   /**
    * A collection of utilities used by other linAlg modules.
    */
   var utils = {};

   // TODO: Is this the best way?
   /** Return whether the numbers `a`, `b` are within `tol` of each other. */
   utils.veryClose = function veryClose(a, b, tol) {
      return Math.abs(a - b) < tol;
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

   return utils;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],45:[function(require,module,exports){
/**
 * Javascript implementation of Linear Algebra Vectors.
 * @module Vector
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */

(function(define) {'use strict';
define(function(require) {

   var utils, op, Permutation;

   Permutation = require('./permutation.js');
   utils = require('./utils');
   op = utils.op;
   /**
    * `Vector` objects are Javascript representations of real-valued vectors.
    * They are constructed in one of three ways depending on the type of the first parameter `arr`:
    * 1. Based on an array of values. In this case, the resulting vector length `len` is optional.
    * 2. Based on a key-value object representing the non-zero indices and their values (sparse vectors)
    * 3. Based on a function `f(n)` describing how the i-th index is meant to be computed.
    * 4. Based on a single number (constant value).
    *
    * When `arr` is a `Vector`, it is simply returned unchanged.
    *
    * `Vector` objects are 1-indexed. By default, they are immutable structures, they cannot be edited
    * once created. See `Vector.MutableV` for a description of mutable vectors.
    *
    * Every vector has a fixed `length`, accessed as a property.
    * Vectors of length `0` are allowed, though there is not much one can do with them.
    *
    *     // A length-4 vector
    *     var v1 = new Vector([3, 5, 1, 2]);
    *     // A length-10 sparse vector
    *     var v2 = new Vector({ 4: 10, 2: 12 }, 10);
    *     // A length-3 vector with values exp(1), exp(2), exp(3)
    *     var v3 = new Vector(Math.exp, 3);
    *     v3.length === 3  // true
    *     // A length-5 vector with all values equal to 4
    *     var v4 = new Vector(4, 5);
    */
   function Vector(arr, len) {
      if (arr instanceof Vector) { return arr; }
      if (Array.isArray(arr)) {
         return new Vector.DenseV(arr);
      }
      if (typeof arr === 'function') {
         return new Vector.TabularV(arr, len);
      }
      if (typeof arr === 'number') {
         return new Vector.TabularV(function(i) {
            return arr;
         }, len);
      }
      return new Vector.SparseV(arr, len);
   }

   /** The tolerance used in equality tests. You may set a different value. Defaults to `1e-8`.
    */
    Vector.tolerance = 1e-8;

   /**
    * Subclass of `Vector` representing "dense" vectors.
    * Dense vectors are internally stored simply as Javascript Arrays.
    * Users should not need to access this subclass directly.
    */
   Vector.DenseV = require('./vector/dense')(Vector);

   /**
    * Subclass of `Vector` representing "sparse" vectors.
    * Sparse vectors are stored as objects, whose keys represent the indices
    * that have non-zero values.
    * Users should not need to access this subclass directly.
    */
   Vector.SparseV = require('./vector/sparse')(Vector);

   /**
    * Subclass of `Vector` representing vectors whose values are specified via
    * a function `f(i)` of the index.
    * The values of the vector are computed lazily, only when they are accessed.
    * Users should not need to access this subclass directly.
    */
   Vector.TabularV = require('./vector/tabular')(Vector);
    /**
     * Subclass of `Vector` efficiently representing vectors all of whose
     * values are meant to be the same number.
     * Users should not need to access this subclass directly.
     * Use `Vector.const` or `Vector.ones` instead.
     */
   Vector.ConstV = require('./vector/const')(Vector);
   /**
    * Subclass of `Vector` representing vectors that provide a "view" into
    * another object, e.g. a row or column of a `Matrix`. Changes to a view
    * vector cause changes to the corresponding "viewed" object and vice versa.
    * Users should not need to access this subclass directly.
    * Use `Vector.prototype.view` instead.
    */
   Vector.ViewV = require('./vector/view')(Vector);

   /**
    * Create a vector that follows a linear progression starting from `a` increasing
    * by `step` amount, and ending the moment `b` is exceeded.
    *
    * If `step` is omitted, it defaults to 1 or -1 depending on the relation between
    * `a` and `b`. If `b` is also omitted, then the vector generated is `1,2,...,a`.
    *
    *     Vector.seq(1, 6, 2)  // Produces [1, 3, 5]
    *     Vector.seq(5, 1)     // Produces [5, 4, 3, 2, 1]
    *     Vector.seq(3)        // Produces [1, 2, 3]
    */
   Vector.seq = function seq(a, b, step) {
      var length;
      if (arguments.length === 0) { return new Vector([]); }
      if (arguments.length === 1) { b = a; a = 1; step = 1; length = b; }
      if (b === a) { return new Vector([a]); }
      step = step || (b > a ? 1 : -1);
      length = Math.floor((b - a) / step) + 1;
      return new Vector(function(i) { return a + (i - 1) * step; }, length);
   };

   /**
    * Generate a constant vector of length `len`, with all entries having value `val`.
    * _Constant vectors are immutable_. Use `Vector.fill` if you want to initialize a
    * vector with some value(s).
    */
   Vector.const = function constant(val, len) {
      return new Vector.ConstV(val, len);
   };

   /**
    * Generate a constant vector of length `len`, with all entries having value 1.
    * _Constant vectors are immutable_.
    *
    *     // Sums all elements of v1
    *     Vector.ones(v1.length).dot(v1)
    */
   Vector.ones = function ones(len) {
      return Vector.const(1, len);
   };

   /**
    * Returns the concatenation of its arguments. The arguments may be vectors, arrays
    * or plain numbers.
    */
   Vector.concat = function concat(vectors) {
      vectors = Array.prototype.concat.apply([],
         Array.prototype.map.call(arguments, function(vector) {
            if (vector instanceof Vector) { return vector.get(); }
            return Array.isArray(vector) ? vector : [vector];
         })
      );
      return new Vector(vectors);
   };
   // Vector.prototype methods

   /**
    * Generic accessor method to obtain the values in the vector. The argument `i` can take a
    * number of different forms:
    *
    * 1. With no argument present, an array of all vector values is returned.
    * 2. If called with an integer `i`, the `i`-th entry from the vector is returned
    * (indexing starts at 1).
    * 3. If called with an array of integers, an array of the correspondingly indexed entries
    * is returned.
    *
    * Users should always go through this method, or `Vector.prototype._get`, when accessing
    * values of the vector unless they really know what they're doing.
    * You may use `Vector.prototype._get` for slightly more efficient access if you will always
    * be accessing values via an integer.
    *
    *     v1.get() === [3, 5, 1, 2];
    *     v1.get([2, 3]) === [5, 1];
    *     v1.get(1) === 3;
    *     v1.get(2) === 5;
    *     // Out of range defaults to 0
    *     v1.get(0) === 0;
    *     v1.get(5) === 0;
    */
   Vector.prototype.get = function get(i) {
      if (i == null) { return this.toArray(); }
      if (i instanceof Vector) { i = i.get(); }
      if (!Array.isArray(i)) { return this._get(i); }
      // else, i is an array
      return this.view(i).toArray();
   };

   /**
    * Same as `Vector.prototype.get`, but only works with an integer argument.
    */
   Vector.prototype._get = function _get(i) {
      if ( i < 1 || i > this.length) { return null; }
      if (!this.values) { this.values = []; }
      if (!this.cached && this.values[i - 1] == null) {
         this.values[i - 1] = this.compute(i);
      }
      return this.values[i - 1];
   };

   /**
    * Compute the entry at index `i` of the vector. This method is used internally
    * by `Vector.prototype.get` and `Vector.prototype._get` to obtain the correct
    * value in cases where the vector values are stored _lazily_. Users should not
    * call it directly. Use `Vector.prototype.get` or `Vector.prototype._get` instead.
    * @private
    */
   Vector.prototype.compute = function compute(i) {
      throw new Error('Subclasses of Vector need to implement compute: ' +
         this.constructor.name);
   };

   /**
    * Set the entries of the vector that are specified by the parameter `i` to the value(s)
    * specified by the parameter `vals`. _Can only be used on a vector that is set to
    * be mutable_. The parameters can take two forms:
    *
    * 1. If `i` is a single numeric index, then `vals` is the value that should be placed
    * at that index.
    * 2. If the parameter `i` is omitted, i.e. `vals` is the first argument, then it needs to
    * be an array or vector of equal length to `this`, or a single number, or a function `f(i)`,
    * and it will be used to set all the vector's values.
    *
    * In order to set more than one of a vector's values at the same time, create a
    * `Vector.ViewV` and use `Vector.prototype.set` on that.
    *
    * You may use `Vector.prototype._set` if efficiency is an issue and you are certain that
    * you are in the single-index case.
    */
   Vector.prototype.set = function set(i, vals) {
      function changeAll(target, vals) {
         var ind;
         // Ensure vals is a function returning the values
         function makeLookup(vals) {
            if (typeof vals === 'function') { return vals; }
            if (Array.isArray(vals)) { vals = new Vector(vals); }
            if (vals instanceof Vector) {
               if (!target.sameLength(vals)) {
                  throw new Error('Incompatible vector lengths');
               }
               return vals.get.bind(vals);
            }
            return function(ind) { return vals; }; // constant
         }
         vals = makeLookup(vals);
         for (ind = 1; ind <= target.length; ind += 1) {
            target._set(ind, vals(ind));
         }
      }
      if (arguments.length === 1) {
         changeAll(this, i);  // i is the values
      } else if (Array.isArray(i)) {
         changeAll(this.view(i), vals);
      } else {
         this._set(i, vals);
      }
      return this;
   };
   /**
    * Set the entry at index `i` of the vector to `val`. Can only be used on a vector
    * that is currently mutable.
    */
   Vector.prototype._set = function _set(i, val) {
      if (!this.mutable()) { throw new Error('Trying to set in an immutable vector.'); }
      if (i < 1 || i > this.length) {
         throw new Error('Trying to set value out of bounds');
      }
      this.change(i, val);
      return this;
   };

   /**
    * Method meant to be used internally for setting the value at index `i` of the
    * vector to `val`. Bypasses the checks made by `Vector.prototype._set`, including
    * whether the vector has been set to be mutable. _Avoid using this method unless
    * you are really certain of what you are doing!_
    */
   Vector.prototype.change = function change(i, val) {
      throw new Error('Subclasses of Vector need to implement change: ' +
         this.constructor.name);
   };

   /**
    * Called with no arguments (or with undefined/null argument), return the mutable
    * state of the vector.
    *
    * Called with a boolean argument `isMutable`, set the mutable state to that value
    * and return the vector.
    */
   Vector.prototype.mutable = function mutable(isMutable) {
      if (!this.hasOwnProperty('_mutable')) { this._mutable = false; }
      if (isMutable != null) {
         this._mutable = isMutable === true;
         return this;
      }
      return this._mutable;
   };

   /**
    * Force a vector to be evaluated. This resolves any deferred calculations
    * needed for the computation of the vector's elements.
    *
    * Many vector methods, notably `Vector.prototype.map`, delay the required computations
    * until the point where they need to be computed. `Vector.prototype.force` is one
    * way to force that computation.
    */
   Vector.prototype.force = function force() {
      return this;  // stub; overridden in some subclasses
   };

   /**
    * Return a view vector on the `arr` indices. View vectors reflect the values on their
    * target, but allow one to access those locations via a different indexing.
    * Changing the values of a view vector actually changes the values of their target.
    *
    * The indices to view may also be specified via a function `f(i)` as the first argument.
    * In that case, a second argument is needed with the desired length for the resulting vector.
    *
    *     var v1 = new Vector([3, 5, 1, 2]);
    *     var view = v1.view([2, 3]);
    *     view.get(1) === 5;
    *     view.get(2) === 1;
    *     var view2 = v1.view(function(i) { return 5 - i; }, 3); // [2, 1, 5]
    */
   Vector.prototype.view = function view(arr, len) {
      return new Vector.ViewV(this, arr, len);
   };


   /* eslint-disable complexity */
   /**
    * Fill in the segment of the vector's values from `start` to `end` with `val`.
    * If `start` is an array or vector, use its values as the indices to fill. Only usable
    * on vectors that are currently mutable.
    */
   Vector.prototype.fill = function fill(val, start, end) {
      var i;
      if (start && start.forEach != null) {
         start.forEach(function(ind) { this._set(ind, val); }.bind(this));
      } else {
         if (end == null || end > this.length) { end = this.length; }
         if (start == null || start < 1) { start = 1; }
         for (i = start; i <= end; i += 1) {
            this._set(i, val);
         }
      }
      return this;
   };
   /* eslint-enable */

   /**
    * Return a new vector with the values of `this` repeated according to `times`.
    * - If `times` is a number, recycle that many times.
    * - If `times` is a vector or array of the same length, use its values as frequencies
    * for the corresponding entries.
    * - If `times` is an object with a `length` property, cycle the values until that length
    * is filled.
    * - If `times` is an object with an `each` property, repeat each value that many times.
    */
   Vector.prototype.rep = function rep(times) {
      var arr, values;
      arr = [];
      values = this.toArray();
      if (times instanceof Vector) { times = times.toArray(); }
      if (Array.isArray(times)) {
         if (!this.sameLength(times)) {
            throw new Error('Incorrect "times" length.');
         }
         times.forEach(function(nTimes, i) {
            nTimes = Math.floor(nTimes);
            while (nTimes > 0) { arr.push(values[i]); nTimes -= 1; }
         });
         return new Vector(arr);
      }
      if (times.length != null) { return this.resize(Math.floor(times.length), true); }
      if (times.each != null) {
         times.each = Math.floor(times.each);
         return new Vector(function(i) {
            return values[Math.floor((i - 1) / times.each)];
         }, times.each * this.length);
      }
      return this.resize(Math.floor(times) * this.length, true);
   };

   /** See `Vector.concat`. */
   Vector.prototype.concat = function(vectors) {
      vectors = Array.prototype.slice.call(arguments);
      vectors.unshift(this);
      return Vector.concat.apply(null, vectors);
   };

   /**
    * Return a new resized version of `this` with a new `length`.`fill` may be:
    * - `true`: we then recycle the Vector's values to the new length.
    * - `false` or omitted: we then fill in with zeros.
    * - a function `f(i)`: It is then used to fill in the _new_ values.
    */
   Vector.prototype.resize = function resize(length, fill) {
      var arr, i, f;
      arr = this.toArray().slice(0, length);
      if (typeof fill === 'function') {
         f = fill;
      } else {
         f = fill ? function(i) { return arr[(i - 1) % this.length]; }
                  : function(i) { return 0; };
      }
      for (i = this.length + 1; i <= length; i += 1) { arr.push(f.call(this, i)); }
      return new Vector(arr).mutable(this.mutable());
   };

   /** Permute the vector entries according to `perm` */
   Vector.prototype.permute = function permute(perm) {
      var invPerm;
      invPerm = new Permutation(perm).inverse();
      return this.view(invPerm.get.bind(invPerm), this.length);
   };

   /**
    * Execute the function `f` for each entry of the vector,
    * starting with the entry with index 1. `f` will be called as `f(value, index)`.
    * If `skipZeros` is `true`, then the system _may_ skip the execution
    * of `f` for zero entries.
    *
    *     var v1 = new Vector([3, 5, 1, 2]);
    *     // Prints: 3 1, 5 2, 1 3, 2 4
    *     v1.each(console.log);
    */
   Vector.prototype.each = function each(f, skipZeros) {
      throw new Error('Subclasses of Vector need to implement each: ' +
         this.constructor.name);
   };

   /**
    * Alias for `Vector.prototype.each`.
    */
   Vector.prototype.forEach = function(f, skipZeros) {
      return this.each.apply(this, [].slice.call(arguments));
   };
   /**
    * Execute the function `f` for each pair of corresponding entries from the
    * vector and `v2`, starting with the entries with index 1.
    * `f` will be called as `f(val1, val2, index)`, where `val1`, `val2`
    * are the entries of the vectors `this`, `v2` at index `i`.
    * If `skipZeros` is `true`, then the system _may_ skip the execution of `f` when
    * one of the values is `0`.
    *
    *     // Prints 3 3 1, 5 5 2, 1 1 3, 2 2 4
    *     v1.eachPair(v1, console.log);
    */
   Vector.prototype.eachPair = function eachPair(v2, f, skipZeros) {
      if (!this.sameLength(v2)) {
         throw new Error('Vector#eachPair: vectors should be same langth');
      }
      if (v2.isSparse()) {
         v2.eachPair(this, swap(f), skipZeros); return this;
      }
      this.each(function(val, i) {
         f(val, v2._get(i), i);
      });
      return this;
   };

   /**
    * Similar to `Array.prototype.reduce`. Given a function `f(acc, val, i)` and an
    * `initial` value, it successively calls the function on the vector's entries,
    * storing each result in the variable `acc`, then feeding that value back.
    * If `skipZeros` is `true`, this operation _may_ skip any zero entries.
    * `initial` and `acc` do not have to be numbers, but they do need to have the
    * same type, and `f` should return that same type.
    *
    *     function add(acc, val) { return acc + val; };
    *     // Equivalent to ((((4 + 3) + 5) + 1) + 2)
    *     v1.reduce(add, 4);
    */
   Vector.prototype.reduce = function reduce(f, initial, skipZeros) {
      initial = initial || 0;
      this.each(function(val, i) {
         initial = f(initial, val, i);
      }, skipZeros);
      return initial;
   };

   /**
    * Similar to `Vector.prototype.reduce` but acts on a pair of vectors `this`, `v2`.
    * The signature of the function `f` would be `f(acc, val1, val2, i)` where `acc`
    * is the accumulated value, `i` is the index, and `val1`, `val2` are the `i`-indexed
    * values from `this`, `v2`. If `skipZeros` is `true`, the implementation _may_ avoid
    * calling `f` for an index `i` if one of the values is `0`.
    *
    * The vectors `this`, `v2` need to have the same length.
    *
    *     function f(acc, val1, val2) = { return acc + val1 * val2; };
    *     // Computes the dot product of v1, v2.
    *     v1.reducePair(v2, f, 0)
    */
   Vector.prototype.reducePair = function reducePair(v2, f, initial, skipZeros) {
      initial = initial || 0;
      this.eachPair(v2, function(val1, val2, i) {
         initial = f(initial, val1, val2, i);
      }, skipZeros);
      return initial;
   };

   /** Alias for `Vector.prototype.reduce`. */
   Vector.prototype.foldl = Vector.prototype.reduce;

   /**
    * Create a new vector by applying the function `f` to all elements of `this`.
    * The function `f` has the signature `f(val, i)`.
    * If `skipZeros` is `true`, the operation may assume that `f(0, i)=0` and
    * may choose to skip those computations.
    *
    * `Vector#map` only returns a "promise" to compute the resulting vector.
    * The implementation may choose to not call `f` until its values
    * are actually needed. Users should not rely on side-effects of `f`.
    *
    *     // Results in [3 + 1, 5 + 2, 1 + 3, 2 + 4];
    *     v1.map(function(val, i) { return val + i; });
    */
   Vector.prototype.map = function map(f, skipZeros) {
      var f2 = function(i) { return f(this._get(i), i); }.bind(this);
      return new Vector(f2, this.length);
   };


   /**
    * Like `Vector.prototype.map`, but the function `f` acts on two vectors, with
    * signature `f(val1, val2, i)`. If `skipZeros` is `true`, the implementation may
    * assume that `f` will return `0` as long as one of the values is `0`.
    */
   Vector.prototype.mapPair = function mapPair(v2, f, skipZeros) {
      if (!this.sameLength(v2)) {
         throw new Error('Vector.mapPair: vectors should be same langth');
      }
      if (skipZeros && v2.isSparse()) {
         return v2.mapPair(this, swap(f), skipZeros);
      }
      return new Vector(function(i) {
         return f(this._get(i), v2._get(i), i);
      }.bind(this), this.length);
   };

   // Predicates

   /** Return true, if the predicate `pred(val, i)` is true for at least one entry, false otherwise. */
   Vector.prototype.any = function any(pred) {
      var i;
      for (i = 1; i <= this.length; i += 1) {
         if (pred(this.get(i), i)) { return true; }
      }
      return false;
   };

   /** Return true, if the predicate `pred(val, i)` is true for all entries, false otherwise. */
   Vector.prototype.all = function all(pred) {
      var i;
      for (i = 1; i <= this.length; i += 1) {
         if (!pred(this.get(i), i)) { return false; }
      }
      return true;
   };

   // Vector operations

   /**
    * Compute the p-norm of the vector. `p` should be a positive real
    * number or `Infinity`. Defaults to the 2-norm.
    *
    *     v.norm(1)        // 1-norm (sum of absolute values)
    *     v.norm()         // 2-norm (Euclidean formula)
    *     v.norm(Infinity) // Infinity (max) norm
    */
   Vector.prototype.norm = function norm(p) {
      var res;
      if (p == null) { p = 2; }
      if (p === Infinity) {
         return this.reduce(function(acc, val) {
            return Math.max(acc, Math.abs(val));
         }, 0, true);
      }
      res = this.reduce(function(acc, val) {
         return acc + Math.pow(Math.abs(val), p);
      }, 0, true);
      return Math.pow(res, 1 / p);
   };

   /**
    * Compute the dot product of `this` with `v`.
    *
    *     // Returns 3 * 3 + 5 * 5 + 1 * 1 + 2 * 2
    *     v1.dot(v1);
    */
   Vector.prototype.dot = function dot(v) {
      return this.reducePair(v, function(acc, val1, val2) {
         return acc + val1 * val2;
      }, 0, true);
   };

   /**
    * Return a Javascript array of the vector's values. Returns a new
    * Array object every time.
    */
   Vector.prototype.toArray = function toArray() {
      if (this.cached) { return this.values.slice(); }
      var arr = [];
      this.each(function(val) { arr.push(val); });
      return arr;
   };

   /** Return a clone of the vector. */
   Vector.prototype.clone = function clone() {
      return new Vector(this.toArray());
   };

   /** Test if `this` pointwise equals `v2`, within a given pointwise `tolerance`
    * (defaults to `Vector.tolerance`). */
   Vector.prototype.equals = function equals(v2, tolerance) {
      var i;
      tolerance = tolerance || Vector.tolerance;
      if (!this.sameLength(v2)) { return false; }
      for (i = 1; i <= this.length; i += 1) {
         if (!utils.veryClose(this.get(i), v2.get(i), tolerance)) { return false; }
      }
      return true;
   };

   // Vector arithmetic operations.

   /**
    * Pointwise add two vectors. Returns a new vector.
    *
    *     // Returns: [3 + 1, 5 + 1, 1 + 1, 2 + 1]
    *     v1.pAdd(Vector.ones(4));
    */
   Vector.prototype.pAdd = function pAdd(v) {
      return this.mapPair(v, op.add, false);
   };

   /** Pointwise subtract two vectors. Returns a new vector. */
   Vector.prototype.pSub = function pSub(v) {
      return this.mapPair(v, op.sub, false);
   };

   /** Multiply the vector `v` by the constant `a`. Returns a new vector. */
   Vector.prototype.sMult = function sMult(a) {
      return this.map(function(val) { return a * val; }, true);
   };

   /** Pointwise multiply two vectors. Returns a new vector. */
   Vector.prototype.pMult = function pMult(v) {
      return this.mapPair(v, op.mult, true);
   };

   /** Pointwise divide two vectors. Returns a new vector. */
   Vector.prototype.pDiv = function pDiv(v) {
      return this.mapPair(v, op.div, false);
   };

   /** Raise each entry in `this` to the `n`-th power. Returns a new vector. */
   Vector.prototype.pPow = function pPow(n) {
      return this.map(function(val) { return Math.pow(val, n); }, n > 0);
   };

   // Other Vector prototype methods

   /** order takes a parameter `desc` which defaults to `false`.  If
    * `desc` is `true` then the order is given in descending order.
    *  Example:  If `this` has values [3, 1, 8, 10, 2] then
    *  order(false) returns [2, 5, 1, 3, 4].  `desc` can also be a
    *  comparator function.
    *  The default ordering functions only work for numeric vectors.
    *  Provide custom function otherwise.
    */
   Vector.prototype.order = function order(desc) {
      var f;
      // make sure desc is a function
      if (typeof desc !== 'function') {
         desc = desc === true ? function(a, b) {
            if (isNaN(b)) { return -1; }
            if (isNaN(a)) { return 1; }
            return a > b ? -1 : a === b ? 0 : 1;
         } : function(a, b) {
            if (isNaN(b)) { return -1; }
            if (isNaN(a)) { return 1; }
            return a < b ? -1 : a === b ? 0 : 1;
         };
      }
      f = function(i, j) { return desc(this.get(i), this.get(j)); }.bind(this);
      return new Vector(Vector.seq(this.length).toArray().sort(f));
   };

   /**
    */
   Vector.prototype.sort = function sort(desc) {
      return this.view(this.order(desc).toArray());
   };

   /**
    * Compute the successive differences of the values in the vector, "`this[i+1] - this[i]`."
    *
    *     v1.diff(); // Produces: [5 - 3, 1 - 5, 2 - 1]
    *     v1.diff().length === v1.length - 1 // true
    */
   Vector.prototype.diff = function diff() {
      return new Vector(function(i) {
         return this._get(i + 1) - this._get(i);
      }.bind(this), this.length - 1);
   };

   /**
    * Create a new vector by accumulating one by one the results
    * `f(acc, val, i)` as `val` ranges over the values of the vector,
    * starting with the value `initial` (defaults to `0`). This is effectively a version of
    * `Vector.prototype.reduce` where each intermediate step is stored.
    *
    *     var v1 = new Vector([3, 5, 1, 2]);
    *     function f(acc, val) { return acc + val * val; }
    *     v1.cumulative(f, 2);  // [11, 36, 37, 41]
    */
   Vector.prototype.cumulative = function cumulative(f, initial) {
      var arr = [];
      this.reduce(function(acc, val, i) {
         acc = f(acc, val, i);
         arr.push(acc);
         return acc;
      }, initial || 0, false);
      return new Vector(arr);
   };

   /**
    * Create a new vector from the partial sums in the vector.
    *
    *     v1.cumSum();  // [3, 8, 9, 11]
    */
   Vector.prototype.cumSum = function cumSum() {
      return this.cumulative(op.add, 0);
   };

   /**
    * Create a new vector from the partial products in the vector.
    *
    *     v1.cumProd(); // [3, 15, 15, 30]
    */
   Vector.prototype.cumProd = function cumProd() {
      return this.cumulative(op.mult, 1);
   };

   /**
    * Create a new vector from the partial minima in the vector.
    *
    *     v1.cumMin(); // Produces [3, 3, 1, 1]
    */
   Vector.prototype.cumMin = function cumMin() {
      return this.cumulative(function(a, b) {
         return Math.min(a, b);
      }, Infinity);
   };

   /**
    * Create a new vector from the partial maxima in the vector.
    *
    *     v1.cumMax(); // Produces [3, 5, 5, 5]
    */
   Vector.prototype.cumMax = function cumMax() {
      return this.cumulative(function(a, b) {
         return Math.max(a, b);
      }, -Infinity);
   };

   /** Return whether the vector is stored as a sparse vector. */
   Vector.prototype.isSparse = function isSparse() {
      return false;
   };

   /** Return whether the vector has the same length as the vector `other`. */
   Vector.prototype.sameLength = function sameLength(other) {
      return this.length === other.length;
   };

   // Helper functions

   function swap(f) {
      return function(b, a, i) { return f(a, b, i); };
   }

   return Vector;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./permutation.js":37,"./utils":44,"./vector/const":46,"./vector/dense":47,"./vector/sparse":48,"./vector/tabular":49,"./vector/view":50}],46:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Vector constructor and
 * creates the subclass ConstV of Vector
 */
return function(Vector) {

   // Subclass of `Vector` representing efficiently vectors all of whose
   // values are meant to be the same number.
   // Users should not need to access this directly.
   function ConstV(val, len) {
      this.val = val;
      this.length = len;
      this.cached = false;
   }

   ConstV.prototype = Object.create(Vector.prototype);

   /* ConstV.prototype methods */

   ConstV.prototype._get = function _get(i) {
      if ( i < 1 || i > this.length) { return null; }
      return this.val;
   };

   // Constant vectors are always immutable
   ConstV.prototype.mutable = function mutable(newSetting) {
      if (newSetting == null) { return false; }
      throw new Error('Cannot set a constant to be mutable');
   };

   ConstV.prototype.each = function each(f) {
      var i;
      for (i = 1; i <= this.length; i += 1) {
         f(this.val, i);
      }
      return this;
   };

   return ConstV;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],47:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Vector constructor and
 * creates the subclass DenseV of Vector
 */
return function(Vector) {

   // Subclass of `Vector` representing "dense" vectors.
   // Dense vectors are stored simply as Javascript Arrays
   // Users should not need to access this directly.
   function DenseV(arr) {
      this.values = arr;
      this.length = arr.length;
      this.cached = true;
   }

   /* makes DenseV a "subclass" of Vector */
   DenseV.prototype = Object.create(Vector.prototype);

   /* DenseV.prototype methods */

   DenseV.prototype.change = function change(i, val) {
      if (!this.values) { this.values = []; }
      this.values[i - 1] = val;
      return this;
   };

   DenseV.prototype.each = function each(f) {
      this.force();
      (this.values || []).forEach(function(val, i) { f(val, i + 1); });
      return this;
   };

   return DenseV;
};


});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],48:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Vector constructor and
 * creates the subclass SparseV of Vector
 */
return function(Vector) {

   // Subclass of `Vector` representing "sparse" vectors.
   // Sparse vectors are stored as objects, whose keys represent the indices
   // that have non-zero values.
   // Users should not need to access this directly.
   function SparseV(arr, len) {
      this._values = arr;
      this.length = len;
      this.cached = false;
   }

   SparseV.prototype = Object.create(Vector.prototype);

   /* SparseV.prototype methods */

   SparseV.prototype._get = function _get(i) {
      // If NaN, we do want to return that, cannot "|| 0"
      if ( i < 1 || i > this.length) { return null; }
      return this._values.hasOwnProperty(i) ? this._values[i] : 0;
   };

   SparseV.prototype.change = function change(i, val) {
      this._values[i] = val;
      return this;
   };

   SparseV.prototype.each = function each(f, skipZeros) {
      var i, vals;
      vals = this._values;
      if (skipZeros) {
         Object.keys(vals).forEach(function(i) {
            f(vals[i], parseInt(i));
         });
      } else {
         for (i = 1; i <= this.length; i += 1) {
            f(this._get(i), i);
         }
      }
      return this;
   };

   SparseV.prototype.eachPair = function eachPair(v2, f, skipZeros) {
      var i, vals;
      if (!this.sameLength(v2)) {
         throw new Error('SparseV#eachPair: vectors should be same langth');
      }
      vals = this._values;
      if (skipZeros) {
         Object.keys(vals).forEach(function(i) {
            f(vals[i], v2._get(parseInt(i)), parseInt(i));
         });
      } else {
         for (i = 1; i <= this.length; i += 1) {
            f(this._get(i), v2._get(i), i);
         }
      }
      return Vector;
   };

   SparseV.prototype.map = function map(f, skipZeros) {
      if (!skipZeros) { return Vector.prototype.map.call(this, f); }
      var newValues = {};
      this.each(function(val, i) {
         newValues[i] = f(val, i);
      }, true);
      return new Vector(newValues, this.length);
   };

   SparseV.prototype.mapPair = function mapPair(v2, f, skipZeros) {
      if (!this.sameLength(v2)) {
         throw new Error('Vector.mapPair: vectors should be same langth');
      }
      var newValues = {};
      if (!skipZeros && !v2.isSparse()) {
         return new Vector(function(i) {
            return f(this._get(i), v2._get(i), i);
         }.bind(this), this.length);
      }
      this.eachPair(v2, function(val1, val2, i) {
         newValues[i] = f(val1, val2, i);
      }, true);
      return new Vector(newValues, this.length);
   };

   SparseV.prototype.clone = function clone() {
      var values = {};
      var oldValues = this._values;
      Object.keys(oldValues).forEach(function(k) {
         values[k] = oldValues[k];
      });
      return new Vector(values, this.length);
   };

   /**
    * Return a new resized version of `this` with a new `length`.`fill` may be:
    * - `true`: we then recycle the Vector's values to the new length.
    * - `false` or omitted: we then fill in with zeros.
    * - a function `f(i)`: It is then used to fill in the _new_ values.
    */
   SparseV.prototype.resize = function resize(length, fill) {
      var obj, key, val, values;

      function fillMore(fill) {
         for (key = this.length + 1; key <= length; key += 1) {
            val = fill.call(this, key);
            if (val !== 0) { obj[key] = val; }
         }
      }

      obj = {};
      values = this._values;
      for (key in values) {
         if (values.hasOwnProperty(key) && parseInt(key) <= length) {
            obj[key] = values[key];
         }
      }
      if (typeof fill === 'function') {
         fillMore.call(this, fill);
      } else if (fill === true) {
         fillMore.call(this, function(key) {
            return this.get((key - 1) % this.length + 1);
         });
      }
      return new Vector(obj, length);
   };

   SparseV.prototype.isSparse = function isSparse() {
      return true;
   };

   return SparseV;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],49:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Vector constructor and
 * creates the subclass TabularV of Vector
 */
return function(Vector) {

   // Subclass of `Vector` representing vectors whose values are specified via
   // a function `f(i)` of the index.
   // The values of the vector are computed lazily, only when they are accessed.
   // Users should not need to access this directly.
   function TabularV(f, len) {
      this.f = f;
      this.length = len;
      this.cached = false;
   }

   TabularV.prototype = Object.create(Vector.DenseV.prototype);

   TabularV.each = function each(v, f) {
      v.force().each(f);
      return Vector;
   };

   /* TabularV.prototype methods */

   TabularV.prototype.compute = function compute(i) {
      return this.f(i);
   };

   TabularV.prototype.force = function force() {
      var i;
      if (!this.cached) {
         for (i = 1; i <= this.length; i += 1) { this._get(i); }
         this.cached = true;
         this.f = fmoot; // We do not need f any more.
      }
      return this;
   };

   function fmoot() {
      throw new Error('Should not call the function of a cached tabular object');
   }

   return TabularV;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],50:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

/* Returns a function which takes the Vector constructor and
 * creates the subclass ViewV of Vector
 */
return function(Vector) {

   // Subclass of `Vector` representing vectors that provide a "view" into
   // another object, e.g. the row or column of a `Matrix`. Changes to a view
   // vector cause changes to the corresponding "viewed" object and vice versa.
   //
   // Constructs a view into a `Vector`. `target` must be a `Vector`.
   // `indices` can be:
   // 1. an array of indices, or
   // 2. a function which computes the translation from ViewV-index
   // to target-index
   //
   // `len` is the length of the resulting vector. Needed only in case 2.
   function ViewV(target, indices, len) {
      if (!this instanceof ViewV) { return new ViewV(target, indices, len); }
      this.target = target;
      if (typeof indices === 'function') {
         this.i = indices;
         if (len == null) {
            throw new Error('ViewV with function requires length arg');
         }
         this.length = len;
      } else {
         this.i = function(i) { return indices[i - 1]; };
         this.length = indices.length;
      }
      this.cached = false;
      return this;
   }

   ViewV.prototype = Object.create(Vector.prototype);

   ViewV.prototype._get = function _get(i) {
      if (i < 1 || i > this.length) { return null; }
      return this.compute(i);
   };

   ViewV.prototype.compute = function compute(i) {
      return this.target._get(this.i(i));
   };

   ViewV.prototype.change = function change(i, val) {
      this.target._set(this.i(i), val);
      return this;
   };

   // A ViewV's mutability is directly tied to its target's mutability.
   ViewV.prototype.mutable = function mutable(newSetting) {
      if (newSetting != null) {
         this.target.mutable(newSetting);
         return this;
      }
      return this.target.mutable();
   };

   ViewV.prototype.each = function each(f) {
      var i;
      for (i = 1; i <= this.length; i += 1) {
         f(this._get(i), i);
      }
      return Vector;
   };

   return ViewV;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],51:[function(require,module,exports){
(function (global){
//! moment.js
//! version : 2.8.3
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.8.3',
        // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return parseTokenOrdinal;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(input, 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = config._locale.isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual zone can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i);
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.zone(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.zone(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.add(this._dateTzOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                daysAdjust = (this - moment(this).startOf('month')) -
                    (that - moment(that).startOf('month'));
                // same as above but with zones, to negate all dst
                daysAdjust -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4;
                output += daysAdjust / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                return +this.clone().startOf(units) > +moment(input).startOf(units);
            }
        },

        isBefore: function (input, units) {
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                return +this.clone().startOf(units) < +moment(input).startOf(units);
            }
        },

        isSame: function (input, units) {
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[zone(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist int zone
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateTzOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.subtract(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._dateTzOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Use moment().localeData() instead.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateTzOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + yearsToDays(this._months / 12);
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LOCALES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define('moment', function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],52:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

   function Loader (main) {
      this.setMain(main);
   }

   Loader.prototype = {
      // Set the main object
      setMain: function setMain(newMain) {
         this.main = newMain;
      },
      // Returns an existing module (or loads if not available)
      // Convention: Modules lowercase, Classes uppercase
      requireModule: function requireModule(name) {
         return getSetProperty(this.main, name);
      },
      addModule: function addModule(name, obj) {
         getSetProperty(this.main, name, obj);
      },
      // Returns an existing type (or errors if not available)
      // TODO -- implement this
      requireClass: function requireClass(name) {
         return getSetProperty(this.main, name);
      },
      addClass: function addClass(name, obj) {
         // Add new type
         // TODO: Enforce name starting with capital letter
         getSetProperty(this.main, name, obj);
         return this;
      },
      getClass: function getClass(name) {
         return getSetProperty(this.main, name);
      },
      // Adds a new method to a "module". Maybe allow multiple methods
      // Typical formats:
      // addModuleMethod('Stats', 'sum', f);
      // addModuleMethod('Stats.sum', f);
      // addModuleMethod('Stats', { sum: f, mean: g });
      addModuleMethod: function addModuleMethod(module, name, method) {
         var params;
         params = normalizeArguments(module, name, method);
         safeMixin(this.requireModule(params.module), params.methods);
         return this;
      },
      // Adds a new class method to a "type". Maybe allow multiple methods
      // Notice you can use this to add a subclass as a class property
      addClassMethod: function addClassMethod(type, name, method) {
         var params;
         params = normalizeArguments(type, name, method);
         safeMixin(this.getClass(params.module), params.methods);
         return this;
      },
      // Adds a new instance/prototype method to a "type".
      // Maybe allow multiple methods
      addInstanceMethod: function addInstanceMethod(type, name, method) {
         var params;
         params = normalizeArguments(type, name, method);
         safeMixin(this.getClass(params.module).prototype, params.methods);
         return this;
      },
      loadModule: function loadModule(moduleFun) {
         moduleFun(this);
      }
   };

   // Converts all these formats to a "{ module: 'Stats', methods: { sum: f, ... }}" type
   // addModuleMethod('Stats', 'sum', f);
   // addModuleMethod('Stats.sum', f);
   // addModuleMethod('Stats', { sum: f, mean: g });
   //
   // Note:  for addModuleMethod('Stats.subA.sum', f), need to break at the *last* dot.
   function normalizeArguments(module, name, method) {
      var bindings, regexp;
      bindings = {};
      regexp = /^(.*)\.([^\.]*)$/;
      if (typeof method === 'undefined') {
         if (typeof name !== 'function') {
          return { module: module, methods: name };
         }
         module = module.match(regexp);
         if (module == null) {
            throw new Error('Invalid module method specification in addModuleMethod');
         }
         bindings[module[2]] = name;
         module = module[1];
      } else {
         bindings[name] = method;
      }
      return { module: module, methods: bindings };
   }

   // if third argument omitted, it's a "get" call
   // `path` takes the form 'part1.part2.part3.part4' with 1 or more parts.
   // root is an object, like this.main
   function getSetProperty(root, path, property) {
      if (!Array.isArray(path)) { path = path.split('.'); }
      while (path.length > 1) {
         if (!root.hasOwnProperty(path[0])) {
            throw new Error('bad path: ' + path[0]);
         }
         root = root[path.shift()];
      }
      if (property == null) { // get call
         if (!root.hasOwnProperty(path[0])) {
            throw new Error('bad path: ' + path[0]);
         }
         return root[path[0]];
      }
      // else, throw error if the set would be an over-write
      if (root.hasOwnProperty(path[0])) {
         throw new Error('Warning!!!! Trying to set existing property: ' + path[0]);
      }
      root[path[0]] = property;
   }

   // Takes an object to mix in to, `obj1`, and an object to mix, `obj2`.
   // Writes to console.error if the objects have any property in common
   // (and doesn't mix that property).
   function safeMixin(obj1, obj2) {
      Object.keys(obj2).forEach(function(key) {
         if (obj1.hasOwnProperty(key)) {
            console.error('Warning!!!! Trying to set existing property: ', key);
         } else {
            obj1[key] = obj2[key];
         }
      });
   }

   return Loader;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{}],53:[function(require,module,exports){
(function(define) {'use strict';
define(function(require) {

   /*
    * Base structures for PanthR
    * @module Base
    * @version 0.0.1
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    */

return function(loader) {
   var Base;

   /*
    * TODO
    */
   Base = {};

   /* Implementation of "statistics" variables. */
   Base.Variable = require('./base/variable');
   /* Implementation of basic list structure. */
   Base.List = require('./base/list');
   /* Implementation of "statistics" datasets. */
   Base.Dataset = require('./base/dataset');

   loader.addClass('Variable', Base.Variable);
   loader.addClass('List', Base.List);
   loader.addClass('Dataset', Base.Dataset);
   loader.loadModule(require('./base/fun'));
   loader.loadModule(require('./base/base'));
   loader.loadModule(require('./base/stats'));

   return Base;

}

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));

},{"./base/base":1,"./base/dataset":5,"./base/fun":6,"./base/list":7,"./base/stats":8,"./base/variable":11}]},{},[18]);
