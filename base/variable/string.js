(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   function StringVar(values) {

   }

   StringVar.prototype = Object.create(Variable.prototype);

   return StringVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
