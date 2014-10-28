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
   it('takes list of values', function() {
      var l = List([2, 4, 5, 6]);
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
   it('can be used to partially set the names', function() {
      expect(function () { l.names(['no','maybe']); }).to.not.throw(Error);
      expect(l.names().toArray()).to.deep.equal(['no','maybe']);
      expect(function () { l.names([]); }).to.not.throw(Error);
      expect(utils.isMissing(l.names())).to.be.true;
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