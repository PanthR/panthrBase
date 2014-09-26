(function(define) {'use strict';
define(function(require) {

return function(Variable) {

   /**
    * Constructs a factor variable with ordered levels.
    * `options.levels` can be an array of the levels, indicating the
    * desired ordering.
    * If `options.levels` is not provided, alphabetical ordering of
    * the values will be used.
    * _Caution_:  If `options.levels` is provided, then any values strings
    * which are not in the levels list will be treated as missing values.
    */
   function OrdinalVar(values, options) {
      this.levels(options.levels || values.slice().sort());
      // the values of a factor "are" the corresponding codes
      this.values = new Variable.Vector(this.getCodes(values));
   }

   OrdinalVar.prototype = Object.create(Variable.FactorVar.prototype);

   return OrdinalVar;
};

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
