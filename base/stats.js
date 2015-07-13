(function(define) {'use strict';
define(function(require) {

return function(loader) {
   /**
    * create and populate the stats module. FIXME later
    * @module stats
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    */
   loader.addModule('stats', {});
   loader.loadModule(require('./stats/basic'));
   loader.loadModule(require('./stats/distr'));
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
