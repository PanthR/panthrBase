(function(define) {'use strict';
define(function(require) {

   /**
    * Base structures for PanthR
    * @module Base
    * @version 0.0.1
    * @author Haris Skiadas <skiadas@hanover.edu>
    * Barb Wahl <wahl@hanover.edu>
    * Bill Altermatt <altermattw@hanover.edu>
    */
   
return function(loader) {
   var Base;

   /**
    * TODO
    */
   Base = {};

   /** Implementation of "statistics" variables. */
   Base.Variable = require('./base/variable');
   /** Implementation of "statistics" datasets. */
   Base.Dataset = require('./base/dataset');

   loader.addClass('Variable', Base.Variable);
   loader.addClass('Dataset', Base.Dataset);
   loader.loadModule(require('./base/stats'));

   return Base;

}

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
