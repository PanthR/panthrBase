/**
 * Utility library for panthrBase.
 * @module utils
 * @author Haris Skiadas <skiadas@hanover.edu>, Barb Wahl <wahl@hanover.edu>
 */
(function(define) {'use strict';
define(function(require) {

   /**
    * A collection of utilities used by panthrBase
    */
   var utils = {};

   /**
    * Take a user-provided option description `s` and a list of
    * allowable option settings.  Return the first element of the list
    * that has the string `s` as its initial substring.  Return `null`
    * if no such match is found.
    *
    * If `s` is empty or `null` / undefined, return the default setting `def`.
    */
   utils.getOption = function getOption(s, optList, def) {
      var i;
      if (s == null || s === '') { return def; }
      s = s.toLowerCase();
      for (i = 0; i < optList.length; i += 1) {
         if (optList[i].toLowerCase().indexOf(s) === 0) { return optList[i]; }
      }
      return null;
   };

   return utils;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
