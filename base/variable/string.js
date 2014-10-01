(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function StringVar(values, options) {
      this.values = new Variable.Vector(values).mutable(true);
   }

   StringVar.prototype = Object.create(Variable.prototype);

   StringVar.prototype.asScalar = function asScalar() {
      return new Variable(this.values.map(function(val){
         return val == null ? null : parseFloat(val);
      }));
   };

   return StringVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
