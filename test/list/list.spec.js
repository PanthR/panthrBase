var Base = require('../../index');
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('List construction', function() {
   it('takes no arguments', function() {
      var l = List();
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(0);
      var l = List([]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(0);
   });
   it('takes object', function() {
      var l = new List({ a: 4, b: 2 });
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(2);
      expect(l.get(1)).to.equal(4);
      expect(l.get("a")).to.equal(4);
      expect(l.get(2)).to.equal(2);
      expect(utils.isMissing(l.get("c"))).to.be.true;
      expect(utils.isMissing(l.get(3))).to.be.true;
      expect(utils.isMissing(l.get(0))).to.be.true;
   });
   it('takes array', function() {
      var l = new List([4, 3, 2, 1]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(4);
      expect(l.get()).to.deep.equal([4, 3, 2, 1]);
   });
   it('can be called without new', function() {
      var l = List([2, 4, 5, 6]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(4);
      expect(l.get()).to.deep.equal([2, 4, 5, 6]);
   });
   it('takes multiple arguments', function() {
      var l = List(2, 4, 5, 6);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(4);
      expect(l.get()).to.deep.equal([2, 4, 5, 6]);
   });
});
describe('List names', function() {
   var l = new List({a: 4, b: 7, c: -1});
   it('can be provided to the constructor', function() {
      expect(l.get('a')).to.equal(4);
      expect(l.get('b')).to.equal(7);
      expect(l.get('c')).to.equal(-1);
   })
   it('can be retrieved using the names function', function() {
      expect(l.names().toArray()).to.deep.equal(['a','b','c']); // unintentionally tests order, sorry...
      expect(l.names(3)).to.equal('c');
   })
   it('can be set using the names function', function() {
      expect(l.names(3, 'z').get('z')).to.equal(l.get(3));
      expect(l.names(['p','q','r']).names().toArray()).to.deep.equal(['p','q','r']);
      expect(l.names(new Variable(['p','q','x'])).names()
                     .toArray()).to.deep.equal(['p','q','x']);
   })
   it('cannot be used to partially set the names', function() {
      expect(function () { l.names(['no','maybe']); }).to.throw(Error);
      expect(function () { l.names([]); }).to.throw(Error);
      expect(utils.isMissing(l.names())).to.be.false;
   })
   it('can be deleted by calling with utils.missing', function() {
      var l = (new List({a: 4, b: 7, c: -1}))
               .names(['a','b','c']).names(utils.missing);
      expect(utils.isMissing(l.names())).to.be.true;
   })
});
describe('List set', function() {
   it('works when i is a single number (reset/append/error)', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l.set(1, 18).get(1)).to.equal(18);
      expect(l.set(2, 28).get(2)).to.equal(28);
      expect(l.set(3, 38).get(3)).to.equal(38);
      expect(l.set(4, 48).get(4)).to.equal(48);
      expect(l.set(10, 108).get(10)).to.equal(108);
      expect(l.set(5.8, 1.8).get(5)).to.equal(1.8);
      expect(function() { l.set(-2, 18); }).to.throw(Error);
   });
   it('works when i is a name-string, either existing or new', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l.set('a', 6.2).get('a')).to.equal(6.2);
      expect(l.set('z', 6.2).get('z')).to.equal(6.2);
      expect(l.length()).to.equal(4);
      expect(l.set('z', 10.5).get('z')).to.equal(10.5);
      expect(l.length()).to.equal(4);
   });
   it('works when i is an object of name-value pairs', function() {
      var l = new List({a: 4, b: 7, c: -1});
      var obj = {b: 22, d: -3};
      expect(l.set(obj).get('b')).to.equal(obj.b);
      expect(l.get('d')).to.equal(obj.d);
      expect(l.length()).to.equal(4);
      expect(l.get(4)).to.equal(obj.d);
   });
   it('works when i is an array of values to append', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l.set([3.2, 3.3, 3.4, 3.5]).get(7)).to.equal(3.5);
      expect(l.length()).to.equal(7);
      //l.names(['x','y','z','p',,,'a']);
   });
   it('works when i is a List', function() {
      var l = new List({a: 4, b: 7, c: -1});
      var l2 = new List({b: 2 });
      l2.set([6]);
      l.set(l2);
      expect(l.get(4)).to.equal(6);
      expect(l.get(2)).to.equal(2);
      expect(l.get('b')).to.equal(2);
      expect(l.length()).to.equal(4);
   });
});
describe('List delete', function() {
   it('by index', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l.delete(2).get(2)).to.equal(-1);
      expect(l.length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
      expect(l.delete(3).length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
      expect(l.delete(-1).length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
   });
   it('by name', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l.delete('b').get(2)).to.equal(-1);
      expect(l.length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
      expect(l.delete('b').length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
      expect(l.delete('d').length()).to.equal(2);
      expect(l.names().toArray()).to.deep.equal(['a', 'c']);
   });
});
describe('List push:', function() {
   it('works by specifying just a value', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l).to.respondTo('push');
      expect(function() { l.push(5); }).to.not.throw(Error);
      expect(l.length()).to.equal(4);
      expect(l.get(4)).to.equal(5);
      expect(l.names().toArray()).to.deep.equal(['a', 'b', 'c']);
   });
   it('works by specifying a name in addition to a value', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l).to.respondTo('push');
      expect(function() { l.push(5, 'd'); }).to.not.throw(Error);
      expect(l.length()).to.equal(4);
      expect(l.get(4)).to.equal(5);
      expect(l.names().toArray()).to.deep.equal(['a', 'b', 'c', 'd']);
   });
});
describe('List prepend:', function() {
   it('works by specifying just a value', function() {
      var l = new List({ a: 4, b: 7, c: -1 });
      expect(l).to.respondTo('prepend');
      expect(function() { l.prepend(5); }).to.not.throw(Error);
      expect(l.length()).to.equal(4);
      expect(l.get(1)).to.equal(5);
      expect(l.names().toArray()).to.deep.equal([utils.missing, 'a', 'b', 'c']);
   });
   it('works by specifying a name in addition to a value', function() {
      var l = new List({ a: 4, b: 7, c: -1 });
      expect(l).to.respondTo('prepend');
      expect(function() { l.prepend(5, 'd'); }).to.not.throw(Error);
      expect(l.length()).to.equal(4);
      expect(l.get(1)).to.equal(5);
      expect(l.names().toArray()).to.deep.equal(['d', 'a', 'b', 'c']);
   });
});
describe('List has:', function() {
   it('finds named entry by index', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l).to.respondTo('has');
      expect(function() { l.has(2); }).to.not.throw(Error);
      expect(l.has(2)).to.equal(true);
      expect(l.has(4)).to.equal(false);
   });
   it('finds named entry', function() {
      var l = new List({a: 4, b: 7, c: -1});
      expect(l).to.respondTo('has');
      expect(function() { l.has('b'); }).to.not.throw(Error);
      expect(l.has('b')).to.equal(true);
      expect(l.has('d')).to.equal(false);
   });
});
describe('List deepGet:', function() {
   it('descends into lists', function() {
      var l = new List({a: new Variable([2, 4]), b: List({c: 5, d: 2})});
      expect(l.deepGet(["a"])).to.be.an.instanceof(Variable);
      expect(l.deepGet(["b", "c"])).to.equal(5);
      expect(l.deepGet([1, 1])).to.equal(2);
      expect(l.deepGet([1])).to.be.an.instanceof(Variable);
      expect(l.deepGet([2, 1])).to.equal(5);
      expect(l.deepGet(new Variable([2, 1]))).to.equal(5);
   });
   it('errors if going too wide or deep', function() {
      var l = new List({a: new Variable([2, 4]), b: List({c: 5, d: 2})});
      expect(function() { l.deepGet([3]) }).to.throw(Error);
      expect(function() { l.deepGet([1, 3]) }).to.throw(Error);
      expect(function() { l.deepGet(["a", "c"]) }).to.throw(Error);
      expect(function() { l.deepGet([2, 1, 1]) }).to.throw(Error);
   });
});
describe('List deepSet:', function() {
   it('descends into lists and makes assignment', function() {
      var l = new List({a: new Variable([2, 4]), b: List({c: 5, d: 2})});
      l.deepSet([1, 1], 5);
      expect(l.get('a').get(1)).to.equal(5);
      l.deepSet(['b','c'], 20);
      expect(l.get('b').get('c')).to.equal(20);
      l.deepSet(['b','e'], 77);
      expect(l.get('b').length()).to.equal(3);
      expect(l.get('b').get('e')).to.equal(77);
   });
   it('errors if going too wide or deep', function() {
      var l = new List({a: new Variable([2, 4]), b: List({c: 5, d: 2})});
      expect(function() { l.deepSet([3, 1], 10) }).to.throw(Error);
      expect(function() { l.deepSet([1, 3, 1], 10) }).to.throw(Error);
      expect(function() { l.deepSet(["a", "c", "x"], 10) }).to.throw(Error);
   });
});

describe('List#index', function() {
   var l1 = new List([2, 4, 6]);
   l1.names(['A', 'B', 'C']);
   var l2 = new List(['A', 'B']);
   l2.append(l1);
   it('returns a clone if no arguments provided', function() {
      var l = l1.index();
      expect(l.length()).to.equal(3);
      expect(l).to.not.equal(l1);
      expect(l.get(1)).to.equal(l1.get(1));
      expect(l.get(2)).to.equal(l1.get(2));
      expect(l.get(3)).to.equal(l1.get(3));
      l = l2.index();
      expect(l.length()).to.equal(3);
      expect(l).to.not.equal(l2);
      expect(l.get(1)).to.equal(l2.get(1));
      expect(l.get(2)).to.equal(l2.get(2));
      expect(l.get(3)).to.not.equal(l2.get(3));
      expect(l.get(3).get(2)).to.equal(l2.get(3).get(2));
   });
   it('returns an empty list if the index "null"', function() {
      var l = l1.index(null);
      expect(l.length()).to.equal(0);
      expect(l).to.not.equal(l1);
      l = l2.index(null);
      expect(l.length()).to.equal(0);
      expect(l).to.not.equal(l2);
   });
   it('allows repeated values in indices', function() {
      var l = l1.index(new Variable([3, 1, 1]));
      expect(l.length()).to.equal(3);
      expect(l.get(1)).to.equal(l1.get(3));
      expect(l.get(2)).to.equal(l1.get(1));
      expect(l.get(3)).to.equal(l1.get(1));

      l = l2.index(new Variable([3, 3, 1]));
      expect(l.length()).to.equal(3);
      expect(l.get(3)).to.equal(l2.get(1));
      expect(l.get(1)).to.not.equal(l2.get(3));
      expect(l.get(2)).to.not.equal(l2.get(2));
      expect(l.get(1)).to.not.equal(l.get(2));
      expect(l.get(1).get(2)).to.equal(l2.get(3).get(2));
      expect(l.get(2).get(2)).to.equal(l2.get(3).get(2));
   });
   it('uses named coordinates correctly', function() {
      var l = l1.index(new Variable(['A', 'A', 'C']));
      expect(l.length()).to.equal(3);
      expect(l.get(1)).to.equal(l1.get(1));
      expect(l.get(2)).to.equal(l1.get(1));
      expect(l.get(3)).to.equal(l1.get(3));
      expect(l.names().toArray()).to.deep.equal(['A', 'A', 'C']);
   });
});

