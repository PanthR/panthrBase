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
