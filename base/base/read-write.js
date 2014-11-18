(function(define) {'use strict';
define(function(require) {

// Module that contains methods for reading and writing datasets and variables
return function(loader) {
   var Variable, List, Dataset, regexp, quoteUnescape;

   Variable = loader.getClass('Variable');
   List     = loader.getClass('List');
   Dataset  = loader.getClass('Dataset');

   /* eslint-disable quotes */
   /* Regular expressions used by the various functions */
   regexp = {};
   regexp.doubleQuoteContent = '(?:""|\\\\"|\\\\\\\\|[^"])+';
   regexp.singleQuoteContent = "(?:''|\\\\'|\\\\\\\\|[^'])+";
   regexp.variableSeparators = '(?:^|[\\s\\n;,]+)';
   regexp.datasetSeparators = '[\\t;,]| +';  // tab, semicolon, comma, or spaces
   regexp.regularTerm = '[^\\s\\n;,]+';
   regexp.variableTerm = regexp.variableSeparators + '(' +
                           '"(' + regexp.doubleQuoteContent + ')"' + '|' +
                           "'(" + regexp.singleQuoteContent + ")'" + '|' +
                           regexp.regularTerm +
                         ')';
   regexp.datasetTerm  = '(' +
                           '"(' + regexp.doubleQuoteContent + ')"' + '|' +
                           "'(" + regexp.singleQuoteContent + ")'" + '|' +
                           regexp.regularTerm +
                         ')';
   regexp.numberlike = '^[+-]?(?:\\d+\\.?|\\.\\d+)\\d*(?:[eE][+-]?\\d+)?$';
   /* eslint-enable quotes */

   Object.keys(regexp).forEach(function(key) {
         regexp[key] = new RegExp(regexp[key], 'g');
   });

   /**
    * Reads values from a "string" into a variable. `mode` will be inferred if not specified.
    *
    * `Variable#read` breaks the string at any sequence of newlines, spaces
    * commas and semicolons.
    * - If the resulting token starts with a double quote,
    * then it must end with a double-quote and its contents are interpreted as follows:
    *    - Consecutive double-quotes (`""`) are interpreted as a double-quote (`"`).
    *    - Escaped (backslashed) characters (`\c`) are interpreted as the character (`c`).
    *    - No unescaped un-doubled double-quotes are allowed in the term.
    * - Analogous conditions for a term starting with a single quote (`'`).
    * - If the token does not start with a quote, then it is interpreted literally.
    *
    * If the mode is not specified, it will be inferred as 'scalar' or 'factor' depending
    * on whether the "terms" can be interpreted as numbers.
    */
   loader.addClassMethod('Variable', 'read', function read(vals, mode) {
      var terms;
      terms = tokenize(regexp.variableTerm, vals, cleanMatch);
      if (!mode) { mode = variableInferMode(terms); }
      if (mode === 'scalar') { terms = terms.map(parseFloat); }
      return new Variable(terms, { mode: mode });
   });

   function variableInferMode(terms) {
      return terms.every(function(s) {
         return s.match(regexp.numberlike) !== null; }) ?
            'scalar' : 'factor';
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
      while ((m = re.exec(s)) !== null) { arr.push(f(m)); }
      return arr;
   }

   // m is the match
   function cleanMatch(m) {
      if (typeof m[2] !== 'undefined') {
         return quoteUnescape(m[2], '"');
      } else if (typeof m[3] !== 'undefined') {
         return quoteUnescape(m[3], '\'');
      }
      return m[1];
   }

   /*
    * Cleans up contents of quoted string.  `q` is the quote type.
    */
   quoteUnescape = (function(dict) {
      return function(s, q) {
         return s.replace(dict[q], function(match, c) {
            return c || q;
         });
      };
   }({ '"': /\\(.)|""/g, '\'': /\\(.)|""/g }));

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
