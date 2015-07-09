(function(define) {'use strict';
define(function(require) {

// Module that contains methods for reading and writing datasets and variables.
return function(loader) {
   var Variable, List, Dataset, reString, regexp, quoteUnescape, utils, writeDefaults;

   Variable = loader.getClass('Variable');
   List = loader.getClass('List');
   Dataset = loader.getClass('Dataset');

   utils = require('../utils');

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
   reString.datasetTerm = '(?:' +
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
         terms.forEach(function(col) {
            if (!makeVar(col.slice(1, col.length)).sameMode(makeVar(col))) {
               options.header = true;
            }
         });
      }
      // makeVariable accepts extra parameters, that we must not set.
      // Hence the wrapper
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
      var rows, row, cols;
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
      cols.get(1).forEach(function(_first, i) {
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
         '_\\': '\\\\',
         '_\t': '\\t',
         '_\n': '\\n',
         '_\r': '\\r'
      };
      return function(str) {
         str = str.replace(/[\\\t\n\r]/g, function(m) { return replacements['_' + m]; });
         if (!options.quote) { return str; }
         return '"' + str.replace(/"/g, options.qescape ? '\\"' : '""') + '"';
      };
   }

   function prepareVar(v, options) {
      function killMissing(strv) {
         return strv.map(function(str) { return utils.getDefault(str, ''); });
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
         '_,': { term: '([^,\\n]*)', sep: ',', junk: '[\\t ]*' },
         '_;': { term: '([^;\\n]*)', sep: ';', junk: '[\\t ]*' },
         '_ ': { term: '([^\\s]*)', sep: '[ \\t]+', junk: '' }
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
              '""': '"',
              '\'\'': '\''
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
