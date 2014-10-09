(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   var utils;

   utils = require('./../utils');
   // values _will_ be an array
   function FactorVar(values, options) {
      this.levels(values.slice().sort());
      // the values of a factor "are" the corresponding codes
      this.values = new Variable.Vector(this.getCodes(values)).mutable(true);
   }

   FactorVar.prototype = Object.create(Variable.prototype);

   // When called with no argument, returns an array of the levels.
   // When called with an array `arr` as the argument, uses `arr`
   // to set the levels.
   // Duplicates in `arr` are ignored.
   FactorVar.prototype.levels = function levels(arr) {
      var i;
      if (arguments.length === 0) { return this.c2v.slice(1); }
      // build this.v2c and this.c2v from arr
      this.c2v = [utils.missing];     // codes for levels begin from 1, not 0.
      this.v2c = {};
      for (i = 0; i < arr.length; i += 1) {
         if (utils.isNotMissing(arr[i]) && !this.v2c.hasOwnProperty(arr[i])) {
            this.v2c[arr[i]] = this.c2v.length;
            this.c2v.push(arr[i].toString());
         }
      }
      return this;
   };

   // Given an array of string values, `values`, returns the
   // corresponding array of numerical codes.
   FactorVar.prototype.getCodes = function getCodes(values) {
      var v2c = this.v2c;
      return values.map(utils.makePreserveMissing(
         function(val) { return v2c[val]; }
      ));
   };

   FactorVar.prototype._get = function _get(i) {
      var c2v = this.c2v;
      if (utils.isMissing(i)) { i = null; } // Want to pass null, not NaN, to Vector#get
      if (typeof i === 'number') { return utils.singleMissing(c2v[ this.values.get(i) ]); }
      return this.values.get(i).map(utils.makePreserveMissing(
         function(code) { return c2v[code]; }
      ));
   };

   // Val can be an array of values or a single value.
   // Those values can be the numeric codes or the string labels.
   FactorVar.prototype._set = function _set(i, val) {
      var c2v = this.c2v;
      var v2c = this.v2c;
      /* eslint-disable complexity */
      function getCode(val) {
         if (Array.isArray(val)) { return val.map(getCode); }
         if (utils.isMissing(val)) { return utils.missing; }
         if (typeof val === 'string') {
            if (!v2c.hasOwnProperty(val)) {
               throw new Error('Invalid value for factor');
            }
            return v2c[val];
         }
         if (isNaN(val) || val < 1 || val >= c2v.length) {
            throw new Error('Invalid value for factor');
         }
         return Math.floor(val);
      }
      /* eslint-enable */
      if (arguments.length === 1) {
         this.values.set(getCode(i));
      } else {
         this.values.set(i, getCode(val));
      }
      return this;
   };

   FactorVar.prototype.reproduce = function reproduce(newValues) {
      newValues = newValues.map(function(code) { return this.c2v[code]; }.bind(this));
      return new Variable(newValues, {
         mode: this.mode(), label: this.label, levels: this.levels()
      });
   };

   FactorVar.prototype.asString = function asString() {
      return Variable.string(this.get());
   };

   return FactorVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
