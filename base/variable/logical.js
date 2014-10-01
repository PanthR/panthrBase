(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function LogicalVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   LogicalVar.prototype = Object.create(Variable.prototype);

   LogicalVar.prototype.asScalar = function asScalar() {
      return new Variable(this.values.map(function(val) {
         return val === true ? 1
              : val === false ? 0
                              : null;
      }));
   };

   return LogicalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
