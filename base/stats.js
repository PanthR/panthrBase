(function(define) {'use strict';
define(function(require) {

return function(Base) {
   require('./stats/basic')(Base);

   return Base;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
