(function(define) {'use strict';
define(function(require) {

// Module that contains methods for displaying and formatting variables/datasets
return function(loader) {
   var utils;
   utils    = require('../utils');

   // build array of arrays of objects (array of rows to be displayed)
   // each object has a `name` and a `value` property.
   // `ncol` is a positive integer
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

   // Returns a string (an HTML expression) for displaying the variable.
   // `options` can include:
   //  - ncol: a positive integer, defaults to 1
   //  - withNames: a boolean value, defaults to false
   //  - value: an object with properties `tag` and `class` for specifying the
   //           html tag and the class attribute.
   //  - name:  an object... same as value
   //  - row:   an object... same as value
   //  All three of these objects are optional, and their individual parts are
   //  optional as well.  Defaults to `<td>` or `<tr>` for the tag and to
   //  `var-value`, `var-name`, `var-row` for the class.
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

   // Returns a string variable for displaying the given variable with
   // specified numerical formatting. `options` is an object and may
   // include the following properties:
   //  - type:  has a string value 'scientific' or 'fixed
   //  - decimals:  indicates fixed number of decimal digits to the right of
   //       the decimal point; has a non-negative integer value; defaults to 4 in
   //       the case of scientific notation, and to 2 otherwise
   loader.addInstanceMethod('Variable', 'format', function format(options) {
      var v, maxDigits;
      v = this.asScalar().names(this.names());
      function nDigits(x) {
         return x === 0 ? 1 : Math.abs(Math.log(Math.abs(x)) / Math.LN10);
      }
      options = options || {};
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
