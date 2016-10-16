(function(define) {
'use strict';
define(function(require) {

return function(Variable) {

   var utils;

   utils = require('./../utils');

   function ScalarVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   ScalarVar.prototype = Object.create(Variable.prototype);

   ScalarVar.prototype.asLogical = function() {
      return Variable.logical(this.values.map(
         utils.makePreserveMissing(function(v) { return v !== 0; })
      )).names(this.names());
   };

   return ScalarVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
