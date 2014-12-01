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
         return function(str) {
            return '<' + params.tag + ' class="' + params.class + '">' + str +
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
               return wrap(options.name)(obj.name) + wrap(options.value)(obj.value);
            }).join('');
         } :
         function(row) {
            return row.map(function(obj) {
               return wrap(options.value)(obj.value);
            }).join('');
         };
      arr = this.layOut(options.ncol);
      return arr.map(function(row) {
         // row is an array of objects with properties `value` and `name`
         return makeRow(row);
      }).map(wrap(options.row)).join('\n');
   });

// boilerplate below here
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
