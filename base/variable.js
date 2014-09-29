/**
 * Representation of "statistics" Variables
 * @module Variable
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 * Bill Altermatt <altermattw@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   var Variable, utils, generateName;

   utils = require('./utils');

   /**
    * Create a new variable. `values` is an array with the desired values.
    * `options` is an object indicating properties of the variable:
    *  - `name`: A brief label for the variable (to show in variable listings)
    *  - `label`: The label to use in graphs/tables/descriptions.
    *  - `mode`: A string describing what type of variable to create. If `mode` is missing
    * it will be determined based on the first non-missing entry in `values`.
    *
    *
    * Further options depend on the particular mode chosen. See the subclass documentations
    * for details.
    *
    * Default name/label values will be generated if not provided. So creating a `Variable` can
    * be as simple as passing a `values` argument to the constructor.
    */
   Variable = function(values, options) {
      var ret;
      if (options == null) { options = {}; }
      options.mode = utils.getOption(options.mode, Object.keys(Variable.modes)) ||
                     inferMode(values);
      ret = new Variable.modes[options.mode](values, options);
      ret.name  = options.name  || generateName();
      ret.label = options.label || '';
      return ret;
   };

   Variable.prototype = Object.create({});

   Variable.Vector      = require('linalg-panthr').Vector;
   Variable.ScalarVar   = require('./variable/scalar')(Variable);
   Variable.LogicalVar  = require('./variable/logical')(Variable);
   Variable.StringVar   = require('./variable/string')(Variable);
   Variable.FactorVar   = require('./variable/factor')(Variable);
   Variable.OrdinalVar  = require('./variable/ordinal')(Variable);
   Variable.DateTimeVar = require('./variable/datetime')(Variable);

   // mode values are the keys for Variable.modes
   // the corresponding constructors are stored as values
   Variable.modes = {
      'scalar':   Variable.ScalarVar,
      'logical':  Variable.LogicalVar,
      'string':   Variable.StringVar,
      'factor':   Variable.FactorVar,
      'ordinal':  Variable.OrdinalVar,
      'dateTime': Variable.DateTimeVar
   };

   // give a mode property to each Variable subclass
   Object.keys(Variable.modes).forEach(function(key) {
      Variable.modes[key].prototype.mode = function mode() { return key; };
   });

   Variable.prototype.get = function get(i) {
      return i == null ? this.values.toArray() : this.values.get(i);
   };

   Variable.prototype.set = function set(i, val) {
      this.values.set(i, val);
      return this;
   }

   // Helper methods

   function inferMode(values) {
      var i = 0;
      while (i < values.length && values[i] == null) { i += 1; }
      if (i >= values.length || typeof values[i] === 'number') { return 'scalar'; }
      return typeof values[i] === 'boolean' ? 'logical' : 'factor';
   }

   generateName = (function(index) {
      return function genName() {
         index += 1;
         return 'Var' + ('0000' + index).slice(-4);
      };
   }(0));

   return Variable;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
