(function(define) {
'use strict';
define(function(require) {

return function(loader) {
   // create and populate the stats module
   loader.addModule('base', {});
   loader.loadModule(require('./base/restructure'));
   loader.loadModule(require('./base/read-write'));
   loader.loadModule(require('./base/format'));
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
