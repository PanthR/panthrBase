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

   LogicalVar.prototype.which = function which() {
      // `false` -> 0; `true` -> the array index plus 1; and NA -> NA
      var arr, k, v;
      arr = this.values.toArray();
      for (k = 0; k < arr.length; k += 1) {
         arr[k] = arr[k] === false ? 0 : (arr[k] || null) && k + 1;
      }
      arr = arr.filter(function(v) { return v !== 0; });
      return new Variable(arr);
   };

   return LogicalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
