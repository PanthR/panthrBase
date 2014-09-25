(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function DateTimeVar(values) {

   }

   DateTimeVar.prototype = Object.create(Variable.prototype);

   return DateTimeVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
