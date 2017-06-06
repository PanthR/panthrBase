/**
 * Representation of "Lists"
 * @module List
 * @author Haris Skiadas <skiadas@hanover.edu>
 * Barb Wahl <wahl@hanover.edu>
 */
(function(define) {
'use strict';
define(function(require) {

   var Variable, utils;

   utils = require('./utils');
   Variable = require('./variable');

   /**
    * A list is a collection of Javascript entities that can be accessed by index
    * or by name. One can remove an item from a list, which results in the other
    * items shifting place. One can also insert at the end of a list, or alter the
    * contents of the list.
    *
    * Indexing starts at 1.
    *
    * We can create a list by providing:
    * - an object containing the items to be placed in the list along with their names
    * - an array of items to be placed in the list, without names
    * - multiple arguments, which will be turned into a single array argument
    * - no arguments, resulting in an empty list
    */
   function List(values) {
      if (arguments.length > 1) { values = arguments; }
      if (!(this instanceof List)) { return new List(values); }
      if (Array.isArray(values)) {
         this.values = [utils.missing].concat(values);
         this._names = this.values.map(function() { return utils.missing; });
      } else {
         // Given an object. Need to populate array based on it
         this._names = [utils.missing].concat(Object.keys(values || {}));
         this.values = this._names.map(function(key) {
            return utils.optionMap(key, function(k) { return values[k]; });
         });
      }
   }

   List.prototype = Object.create({});

   /* eslint-disable complexity */
   /**
    * Get or set the item names.
    *
    * - When called with no arguments, return a string `Variable` of all the names,
    * with `utils.missing` in place of any missing names. If no names exist,
    * returns `utils.missing`.
    * - When called with a single numeric argument `i`, return the name at the
    * given index.
    * - When called with a single array or `Variable` argument, set the names of the
    * list using the array/variable's elements.
    * - When called with a single `null` or `utils.missing` argument, set the names
    * to `utils.missing`.
    * - When called with two arguments `i`, `newName`, set the name of the `i`-th item
    * to `newName`.
    *
    *     var l = new List({ a: [1, 2], b: 3 });
    *     l.names();           // Variable(['a', 'b'])
    *     l.names(2);          // 'b'
    *     l.names(2, 'c');     // `l` is now { a: [1,2], c: 3 }
    *     l.names(['d', 'e']); // `l` is now { d: [1,2], e: 3 }
    *     l.names(null);       // `l` now has no names
    */
   List.prototype.names = function names(i, newNames) {
      if (arguments.length === 0) {
         return utils.allMissing(this._names) ? utils.missing
                                              : Variable.string(this._names.slice(1));
      }
      if (arguments.length > 1) {
         this._names[i] = newNames;
      } else { // one argument, `i`
         if (utils.isMissing(i)) {
            this._names = this.values.map(function() { return utils.missing; });
            return this;
         }
         if (i instanceof Variable) { i = i.asString().toArray(); }
         if (!Array.isArray(i)) { return this._names[i]; }
         if (i.length !== this.length()) {
            throw new Error('Incompatible names length');
         }
         this._names = [utils.missing].concat(i);
      }
      return this;
   };
   /* eslint-enable */

   /**
    * Return the length of the list (number of items)
    */
   List.prototype.length = function length() {
      return this.values.length - 1;
   };

   /**
    * Given a name, return the index of the item with that name
    * or utils.missing if there isn't one.
    * You may also instead pass a single number, or an array of names
    * and numbers, in which case an array of indices is returned.
    * Mostly meant as an internal method.
    */
   List.prototype.getIndexOf = function getIndexOf(name) {
      var names;

      names = this._names;
      function tester(n) {
         if (typeof n === 'number') { return n; }
         n = names.indexOf(n);
         return n === -1 ? utils.missing : n;
      }
      return Array.isArray(name) ? name.map(tester) : tester(name);
   };

   /**
    * Return a list item by index. The index `i` can be:
    * - a positive number
    * - a string name
    * - `null` or `utils.missing`; in this case, an array of all the items
    * is returned.
    */
   List.prototype.get = function get(i) {
      if (utils.isMissing(i)) { return this.values.slice(1); }
      return this.values[this.getIndexOf(i)];
   };

   /**
    * Recursively descends a list specified by an array of indices. The parameter `coords`
    * can be any one-dimensional object whose entries are numeric or string indices.
    * These indices will then be used in succession to descend into the nested list.
    */
   List.prototype.deepGet = function deepGet(coords) {
      return Variable.oneDimToArray(coords).reduce(function(result, index, i, array) {
         var next;

         if (!result.has(index)) {
            throw new Error('Object ' + result + ' has no index ' + index);
         }
         next = result.get(index);
         if (i === array.length - 1 || next instanceof List || next instanceof Variable) { return next; }
         throw new Error('Trying to index non-list object: ' + next);
      }, this);
   };

   /**
    * Recursively descends a list specified by an array of indices. The parameter `coords`
    * can be any one-dimensional object whose entries are numeric or string indices.
    * At the last step of the descent, the assignment is made using `value`.
    */
   List.prototype.deepSet = function deepSet(coords, value) {
      Variable.oneDimToArray(coords).reduce(function(result, index, i, array) {
         var next;

         if (i === array.length - 1) {
            return result.set(index, value);
         }
         if (!result.has(index)) {
            throw new Error('Object ' + result + ' has no index ' + index);
         }
         next = result.get(index);
         if (next instanceof List || next instanceof Variable) {
            return next;
         }
         throw new Error('Trying to index non-list object: ' + next);
      }, this);

      return this;
   };

   /**
    * Called with two arguments `i`, `val`. Set the list item at a given index `i`.
    * `i` can be:
    * - a positive number. If `i` is greater than the length of the list,
    * create a new item at index `i` and fill the resulting gap with `utils.missing`.
    * - a string name:  If the name `i` is not already a name in the list, append a
    * new item with name `i`. Otherwise, update the existing item with the new value.
    * - an object of name-value pairs, causing a series of updates or appends, one for
    * each pair.
    * - an array of values, causing a series of appends of these (unnamed) items.
    * - a `List` of values, causing a series  of updates or appends.
    *
    * `val` can be any Javascript entity. If `i` is an object, array or `List`, then `val` is
    * omitted/ignored.
    */
   List.prototype.set = function set(i, val) {
      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number' || typeof i === 'string') {
         return this._set(i, val);
      }
      if (i instanceof List) {
         i.each(function(v, ind, name) {
            if (utils.isMissing(name)) {
               this._set(this.length() + 1, v);
            } else {
               this._set(name, v);
            }
         }.bind(this));
      } else if (Array.isArray(i)) {
         i.forEach(function(v) {
            this._set(this.length() + 1, v);
         }.bind(this));
      } else {
         // i is an object
         Object.keys(i).forEach(function(key) {
            this._set(key, i[key]);
         }.bind(this));
      }
      return this;
   };

   /**
    * Internal method used to set one item value. Requires two arguments,
    * an integer or string name `i` and a value `val`.
    */
   List.prototype._set = function _set(i, val) {
      var name;

      if (utils.isMissing(i)) { return this; }
      if (typeof i === 'number') {
         i = Math.floor(i);
         if (i < 1) { throw new Error('cannot set at negative index: ' + i); }
         this.values[i] = val;
      } else {
         name = i;
         i = this._names.indexOf(name);
         if (i === -1) { // append
            i = this.length() + 1;
            this._names[i] = name;
         }
         this.values[i] = val;
      }
      return this;
   };

   /**
    * Pushes a new value at the end of a list, with an optional associated name.
    */
   List.prototype.push = function push(val, name) {
      var pos;

      pos = this.length() + 1;
      this._set(pos, val);
      if (name != null) { this.names(pos, name); }

      return this;
   };

   /**
    * Synomym for `List#push`.
    */
   List.prototype.append = List.prototype.push;

   /**
    * Prepends a value into the list, with an optional name.
    */
   List.prototype.prepend = function prepend(val, name) {
      this.values.splice(1, 0, val);
      this._names.splice(1, 0, name == null ? utils.missing : name);

      return this;
   };

   /**
    * Returns a boolean indicating whether the given index or name
    * exists in the list.
    */
   List.prototype.has = function has(i) {
      return typeof i === 'number' ? i <= this.length()
                                   : !utils.isMissing(this.getIndexOf(i));
   };

   /**
    * Delete the item at index/name `i`. `i` may be a positive integer or string name.
    */
   List.prototype.delete = function _delete(i) {
    if (utils.isMissing(i)) { return this; }
    i = this.getIndexOf(i);
    if (i >= 1) {
      this.values.splice(i, 1);
      this._names.splice(i, 1);
    }
    return this;
   };

   /**
   * Apply the function `f(val, i, name)` to each item in the list.  For any
   * items with no associated name, `name` will be `utils.missing`.
   */
   List.prototype.each = function each(f) {
      var i;

      for (i = 1; i <= this.length(); i += 1) {
         f(this.values[i], i, this._names[i]);
      }
      return this;
   };

   /**
    * Apply the function `f(acc, val, i, name)` to each item in the list,
    * accumulating the result to be returned.
    *
    * For any values with no associated name, `name` will be supplied as
    * `utils.missing`.
    *
    * Similar to Javascript's `Array.prototype.reduce`. But unlike its
    * Array counterpart, if it is not given an `initial` value it will
    * use `undefined`, rather than using the first list entry.
    */
   List.prototype.reduce = function reduce(f, initial) {
      var i, acc;

      acc = initial;
      for (i = 1; i <= this.length(); i += 1) {
         acc = f(acc, this.values[i], i, this._names[i]);
      }
      return acc;
   };

   /**
    * Create a new list from the results of applying the function `f(val, i, name)`
    * to the items of the original list. For any values with no associated name,
    * `name` will be supplied as `utils.missing`.
    */
   List.prototype.map = function map(f) {
      var arr;

      arr = [];
      this.each(function(val, i, name) {
         arr.push(f(val, i, name));
      });
      return (new List(arr)).names(
         utils.optionMap(this.names(), function(nms) { return nms.toArray(); })
      );
   };

   /**
    * Clone the list. This method will attempt to make a deep clone by calling `clone`
    * on any top-level items in the list that have a clone method.
    */
   List.prototype.clone = function clone() {
      return this.map(function(val) {
         return val instanceof Object && val.clone ? val.clone() : val;
      });
   };

   /**
    * Return a `Variable` by concatenating the values from the list's items.
    * Works with items of any of the following types:
    * - single value
    * - Array, `Vector`, `Variable`
    * - `List`
    *
    * Names are generated for the new Variable base on the items' names in the list
    * as well as their names (if any) as PanthR objects. The idea is to preserve any
    * names in the list and/or in the values of the list in some reasonable way,
    * wherever they exist.
    * - If the item is a variable with names, and it is a named list item, join the names
    * - If the item is a variable with names, and it is an unnamed list item,
    * use the variable names
    * - If the item is a variable without names, and it is a named list item, provide
    * names of the form `itemName.1, itemName.2, ...`
    */
   List.prototype.toVariable = function toVariable() {
      var resolvedEntries;

      resolvedEntries = this.get().map(function(val, i) {
         if (val instanceof List) { return val.toVariable(); }
         if (val instanceof Variable) { return val.clone(); }
         val = Variable.oneDimToVariable(val);
         return val instanceof Variable ? val : new Variable([val]);
      });
      resolvedEntries.forEach(function(val, i) {
         val.names(joinNames(this.names(i + 1),
                             val.names(),
                             val.length()));
      }.bind(this));
      return Variable.concat.apply(null, resolvedEntries);
   };

   /*
    * Attempts to concatenate the list's entries into a simpler object.
    * Performs the following steps:
    * - If the list is empty, an empty list is returned.
    * - If `recursive` is set to `true` (defaults to `false`) then the list is
    *     fully unnested.
    * - Any one-dimensional (Variable/Vector/array) entries at the (new) top
    *     level are converted to `Variable`.
    * - If all top-level entries are now Variables, a single variable is created
    *     via `Variable.concat`.
    * - The resulting value (a `Variable` or a `List`) is returned.
    */
   List.prototype.concat = function concat(recursive) {
      var lst, i;

      recursive = recursive === true;

      if (this.length() === 0) { return this; }
      if (recursive) { this.unnest(Infinity); }

      lst = this.map(Variable.oneDimToVariable);
      for (i = 1; i <= lst.length(); i += 1) {
         if (!(lst.get(i) instanceof Variable)) { return lst; }
      }

      return lst.toVariable();
   };

   /**
    * Unnest a number of levels out of a nested list, starting at the
    * top level. `levels` is the number of levels it will attempt to unnest.
    * Level 0 indicates no change. Default is 1.
    * Level `Infinity` indicates complete unnesting.
    *
    * This method will only attempt to resolve nesting formed via `List` constructs,
    * and will not recurse into Javascript Objects or Arrays.
    *
    * BEWARE: This operation changes the list(s) _in place_.
    */
   List.prototype.unnest = function unnest(levels) {
      var i;

      if (arguments.length === 0) { levels = 1; }
      if (levels === 0) { return this; }
      if (levels > 1) {
         this.each(function(e) {
            if (e instanceof List) { e.unnest(levels - 1); }
         });
      }
      for (i = this.length(); i > 0; i -= 1) {
         if (this.values[i] instanceof List) {
            [].splice.apply(this._names,
               [i, 1].concat(
                  joinNames(this._names[i],
                            this.values[i].names(),
                            this.values[i].length()
                  )
               )
            );
            [].splice.apply(this.values,
               [i, 1].concat(this.values[i].get())
            );
         }
      }
      return this;
   };

   /* Helper methods */
   function joinNames(itemName, valueNames, length) {
      if (utils.isMissing(itemName)) {
         return Variable.ensureArray(valueNames);
      }
      if (utils.isMissing(valueNames)) {
         if (length === 1) { return [itemName]; }
         valueNames = Variable.Vector.seq(length);
      }
      return Variable.ensureArray(valueNames)
                     .map(function(s) { return itemName + '.' + s; });
   }

   return List;

});

}(typeof define === 'function' && define.amd ? define : function(factory) {
   'use strict';
   module.exports = factory(require);
}));
