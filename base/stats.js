(function(define) {'use strict';
define(function(require) {

return function(loader) {
   // create and populate the stats module
   loader.addModule('stats', {});
   loader.loadModule(require('./stats/basic'));
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
