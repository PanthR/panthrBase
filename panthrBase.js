(function(define) {'use strict';
define(function(require) {

   /*
    * Base structures for PanthR
    * @module Base
    * @version 0.0.1
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    */

return function(loader) {
   var Base;

   /*
    * TODO
    */
   Base = {};

   /* Implementation of "statistics" variables. */
   Base.Variable = require('./base/variable');
   /* Implementation of basic list structure. */
   Base.List = require('./base/list');
   /* Implementation of "statistics" datasets. */
   Base.Dataset = require('./base/dataset');
   Base.utils = require('./base/utils');

   loader.addClass('Variable', Base.Variable);
   loader.addClass('List', Base.List);
   loader.addClass('Dataset', Base.Dataset);
   loader.addClass('utils', Base.utils);
   loader.loadModule(require('./base/fun'));
   loader.loadModule(require('./base/base'));
   loader.loadModule(require('./base/stats'));
   loader.loadModule(require('./base/math'));

   return Base;

}

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
