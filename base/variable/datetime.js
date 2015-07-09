(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var moment, utils;       // date-time module
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
      function getMillis(v) {
         if (Array.isArray(v)) { return v.map(getMillis); }
         return utils.singleMissing(typeof v === 'string' ? f(v) : v);
      }
      this.values.set(i, getMillis(val));
   };

   DateTimeVar.prototype.asString = function asString() {
      return this.map(function(val) {
        return moment(val).format();
      }, true, 'string').names(this.names());
   };

   return DateTimeVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
