(function(define) {'use strict';
define(function(require) {

   /*
    * Use this as the top-level file for stand-alone testing of Base.
    */
   var Base, loader;

   Base = {};

   loader = new (require('panthrLoader'))(Base);

   loader.loadModule(require('./panthrBase'));

   return Base;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
