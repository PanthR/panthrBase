(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function ScalarVar(values) {

   }

   ScalarVar.prototype = Object.create(Variable.prototype);

   return ScalarVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
