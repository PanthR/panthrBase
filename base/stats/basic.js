(function(define) {'use strict';
define(function(require) {

return function(Base) {
   /* eslint-disable no-unused-vars */
   var Variable, Dataset, utils;
   /* eslint-enable */

   Variable = Base.Variable;
   Dataset  = Base.Dataset;
   utils    = require('../utils');

   /**
    * Return the sum of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is null.
    */
   Variable.prototype.sum = function sum(skipMissing) {
      return this.asScalar().reduce(utils.op.add, 0, skipMissing);
   };

   /**
    * Return the mean of the values.
    * `skipMissing` defaults to false.  If `skipMissing` is false and
    * `this` has missing values, result is null.
    */
   Variable.prototype.mean = function mean(skipMissing) {
     var v;  // the variable whose mean we will return
     v = filterMissing(this.asScalar(), skipMissing);
     return utils.singleMissing(v.sum() / v.length());
   };

   // helper methods

   // Takes a variable `v` and a boolean `skipMissing`.
   // If `skipMissing` is true, filters out those missing values.
   // skipMissing defaults to false.
   function filterMissing(v, skipMissing) {
      return skipMissing === true ? v.nonMissing() : v;
   }

   return Base;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
