(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function FactorVar(values) {

   }

   FactorVar.prototype = Object.create(Variable.prototype);

   return FactorVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
