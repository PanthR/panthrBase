(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function OrdinalVar(values) {

   }

   OrdinalVar.prototype = Object.create(Variable.FactorVar.prototype);

   return OrdinalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
