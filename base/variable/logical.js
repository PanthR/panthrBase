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
      return (new Variable(this.values.map(utils.makePreserveMissing(
         function(val) { return val === true ? 1 : 0; }
      )))).names(this.names());
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
