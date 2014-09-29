(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   // values will be an array
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
      this.c2v = [null];     // codes for levels begin from 1, not 0.
      this.v2c = {};
      for (i = 0; i < arr.length; i += 1) {
         if (arr[i] != null && !this.v2c.hasOwnProperty(arr[i])) {
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
      return values.map(function(val) { return v2c[val]; });
   };

   FactorVar.prototype.get = function get(i) {
      var c2v = this.c2v;
      if (typeof i === 'number') { return c2v[ this.values.get(i) ]; }
      return this.values.get(i).map(function(code) {
         return code == null ? null : c2v[code];
      });
   };

   FactorVar.prototype.set = function set(i, val) {
      var c2v = this.c2v;
      var v2c = this.v2c;
      function getCode(val) {
         if (Array.isArray(val)) { return val.map(getCode); }
         if (typeof val === 'string') { return v2c[val]; }
         val = Math.floor(val);
         return val < 1 || val >= c2v.length ? null : val;
      }
      if (arguments.length === 1) {
         this.values.set(getCode(i));
      } else {
         this.values.set(i, getCode(val));
      }
      return this;
   };

   return FactorVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
