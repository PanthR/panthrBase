(function(define) {'use strict';
define(function(require) {

// Add standard distribution functions

return function(loader) {
   var utils, Variable, rgen;

   utils = require('../utils');
   rgen = require('rgen');

   Variable = loader.getClass('Variable');

};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
