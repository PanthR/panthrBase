(function(define) {
'use strict';
define(function(require) {

var panthrMath;

panthrMath = require('panthr-math');

return function(loader) {
   /**
    * create and populate the math module. FIXME later
    * @module math
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    */
   loader.addModule('math', {});
   loader.addModuleMethod('math', 'bd0', panthrMath.bd0);
   loader.addModuleMethod('math', 'bratio', panthrMath.bratio);
   loader.addModuleMethod('math', 'dbinomLog', panthrMath.dbinomLog);
   loader.addModuleMethod('math', 'erf', panthrMath.erf);
   loader.addModuleMethod('math', 'erfc', panthrMath.erfc);
   loader.addModuleMethod('math', 'gam1', panthrMath.gam1);
   loader.addModuleMethod('math', 'gratio', panthrMath.gratio);
   loader.addModuleMethod('math', 'gratioc', panthrMath.gratioc);
   loader.addModuleMethod('math', 'gaminv', panthrMath.gaminv);
   loader.addModuleMethod('math', 'gratR', panthrMath.gratR);
   loader.addModuleMethod('math', 'expm1', panthrMath.expm1);
   loader.addModuleMethod('math', 'lbeta', panthrMath.lbeta);
   loader.addModuleMethod('math', 'beta', panthrMath.beta);
   loader.addModuleMethod('math', 'lgamma', panthrMath.lgamma);
   loader.addModuleMethod('math', 'gamma', panthrMath.gamma);
   loader.addModuleMethod('math', 'log1p', panthrMath.log1p);
   loader.addModuleMethod('math', 'log10', panthrMath.log10);
   loader.addModuleMethod('math', 'log2', panthrMath.log2);
   loader.addModuleMethod('math', 'lpoisson', panthrMath.lpoisson);
   loader.addModuleMethod('math', 'phi', panthrMath.phi);
   loader.addModuleMethod('math', 'stirlerr', panthrMath.stirlerr);
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
