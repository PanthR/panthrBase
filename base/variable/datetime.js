(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var moment;       // date-time module
   moment = require('moment');

   /**
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
            this.values = values.map(function(val) { return moment(val).valueOf(); });
         }
      } else {
         this.values = values.map(function(val) {
            return moment(val, options.format).valueOf();
         });
      }
      this.values = new Variable.Vector(this.values);
   }

   DateTimeVar.prototype = Object.create(Variable.prototype);

   return DateTimeVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
