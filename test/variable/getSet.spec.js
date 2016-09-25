var main = require('../../index');
var Variable  = main.Variable;
var List  = main.List;
var utils  = require('../../base/utils');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var moment = require('moment');

var v1 = new Variable([2.12, -12.2, 3, undefined]);
var v2 = new Variable(['2.12', '-12.2','3']);
var v3 = new Variable(['2.12', '-12.2', ,'3'], { mode: 'string' });
var v4 = new Variable([true, false, undefined, true]);
var v5 = new Variable(['23-10-2007', '22-09-2008'], { mode: 'date', format: 'DD-MM-YYYY' });
var v6 = new Variable(['A', 'A', 'B', 'D'], { mode: 'ord', levels: ['C', 'A', 'D', 'B'] });

describe('Variable#get', function() {
   it('exists', function() {
      expect(Variable).to.respondTo('get');
      expect(v1.get(2)).to.equal(-12.2);
      expect(v1.get([1, 2])).to.deep.equal([2.12, -12.2]);
      expect(utils.areEqualArrays(v1.get([1, 5, 2]), [2.12, utils.missing, -12.2])).to.be.true;
      expect(utils.equal(v1.get(4), null)).to.be.true;
      expect(utils.equal(v3.get(3), null)).to.be.true;
      expect(utils.equal(v4.get(3), null)).to.be.true;
      expect(v4.get(4)).to.equal(true);
   });
   it('places null in for missing/nan indices', function() {
      expect(utils.areEqualArrays(v1.get([1, undefined, 2]), [2.12, utils.missing, -12.2])).to.be.true;
      expect(utils.areEqualArrays(v1.get([1, null, 2]), [2.12, utils.missing, -12.2])).to.be.true;
      expect(utils.areEqualArrays(v1.get([1, NaN, 2]), [2.12, utils.missing, -12.2])).to.be.true;
   });
   it('returns null when out of bounds', function() {
      expect(utils.equal(v1.get(0), null)).to.be.true;
      expect(utils.equal(v1.get(5), null)).to.be.true;
   });
   it('works for factors and ordered', function() {
      expect(utils.equal(v2.get(0), null)).to.be.true;
      expect(utils.equal(v2.get(5), null)).to.be.true;
      expect(v2.get(3)).to.equal('3');
      expect(v6.get(2)).to.equal('A');
      expect(v6.get(3)).to.equal('B');
      expect(v6.get(4)).to.equal('D');
      expect(v6.get([2, 3])).to.deep.equal(['A', 'B']);
      expect(v6.get()).to.deep.equal(['A', 'A', 'B', 'D']);
   });
   it('works for datetime', function() {
      expect(moment(v5.get(1)).year()).to.equal(2007);
      expect(moment(v5.get(1)).month()).to.equal(9);
      expect(moment(v5.get(1)).date()).to.equal(23);
      expect(utils.equal(v5.get(0), null)).to.be.true;
      expect(v5.get([1, 2])).to.exist;
      expect(v5.get([1, 2]).length).to.equal(2);
   });
   describe('testing the indexing modes', function() {
      var spy;
      before(function() {
         spy = sinon.spy(v1,'_get');
      });
      after(function() {
         spy.restore();
      });

      it('-- accepts an array of non-positive integers', function() {
         v1.get([-1, 0, -2]);
         expect(spy.lastCall.args[0]).to.deep.equal([3,4]);
      });
      it('-- should throw error if there are both positive and negative indices', function() {
         expect(function() { v1.get([-3, 2, 0] ); }).to.throw(Error);
      });
      it('-- accepts a logical variable', function(){
         var L = new Variable([true, false, true, true]);
         v1.get(L);
         spy.lastCall.args[0].forEach(function(i) { expect(L.get(i)).to.be.true; });
         expect(spy.lastCall.args[0].length).to.equal(3);
         expect(function() { v1.get(new Variable([true, false])); }).to.throw(Error);
         v1.get(v4);    // v4 = [t, f, null, t]
         expect(utils.equal(spy.lastCall.args[0][1], null)).to.be.true;
      });
      it('-- accepts a scalar variable', function() {
         var S = new Variable([-1, 0, -2]);
         v1.get(S);
         expect(spy.lastCall.args[0]).to.deep.equal([3,4]);
         S = new Variable([1, 0, 2]);
         v1.get(S);
         expect(spy.lastCall.args[0]).to.deep.equal([1,2]);
      });
      it('-- accepts strings as indices', function() {
         var v1 = new Variable([2.12, -12.2, 3, undefined]);
         v1.names(['A', 'B', 'C']);
         expect(v1.get(["A"])).to.deep.equal([2.12]);
         expect(v1.get("A")).to.equal(2.12);
         expect(utils.isMissing(v1.get("D"))).to.be.true;
      });
   });
});
describe('Variable set', function() {
   it('exists', function() {
      expect(Variable).to.respondTo('set');
      expect(function() { v1.set(1, 1.2); }).to.not.throw(Error);
      expect(v1.get(1)).to.equal(1.2);
      expect(v1.set([1, 2], [3.42, 3.41]));
      expect(v1.get(2)).to.equal(3.41);
      expect(v1.get(1)).to.equal(3.42);
   });
   it('works for factors and ordered', function() {
      expect(function() { v2.set(1, '3'); }).to.not.throw(Error);
      expect(function() { v2.set(1, '3.1'); }).to.throw(Error);
      expect(v2.get(1)).to.equal('3');
      expect(function() { v2.set(1, 4); }).to.throw(Error);
      expect(function() { v2.set(1, null); }).to.not.throw(Error);
      expect(utils.equal(v2.get(1), null)).to.be.true;
   });
   it('works datetime', function() {
      expect(function() { v5.set([1, 2], '2003-02-22') }).to.not.throw(Error);
      expect(moment(v5.get(1)).format('YYYY-MM-DD')).to.equal('2003-02-22');
      expect(moment(v5.get(2)).format('YYYY-MM-DD')).to.equal('2003-02-22');
   });
   it('works if passed a variable for the values', function() {
      var v1 = new Variable([2.12, -12.2, 3, 23]);
      var i1 = new Variable([1, 1, 3]);
      expect(function() { v1.set(i1, new Variable([4, 5, 1])); }).to.not.throw(Error);
      expect(v1.get(1)).to.equal(5);
      expect(v1.get(2)).to.equal(-12.2);
   });
   it('works if passed various forms for the indices', function() {
      var v1 = new Variable([2.12, -12.2, 3, 23]);
      var i1 = new Variable([1, 1, 3]);
      var l1 = new Variable([true, null, true, undefined]);
      expect(function() { v1.set(i1, [4, 5, 1]); }).to.not.throw(Error);
      expect(v1.get(1)).to.equal(5);
      expect(v1.get(2)).to.equal(-12.2);
      expect(v1.get(i1)).to.deep.equal([5, 5, 1]);
      expect(function() { v1.set(l1, 10); }).to.throw(Error);
      expect(utils.areEqualArrays(v1.get(l1), [5, utils.missing, 1, utils.missing])).to.be.true;
   });
   it('works if passed a function for the values', function() {
      var v1 = new Variable([2.12, -12.2, 3, 23]);
      v1.set([2, 3], function(i) {return i*i; });
      expect(v1.get()).to.deep.equal([2.12, 4, 9, 23]);
      v1.set(2, function(i) {return i+1; });
      expect(v1.get()).to.deep.equal([2.12, 3, 9, 23]);
   });
});
describe('Variable#has', function() {
   var v1 = new Variable([2, 4, 6]);
   v1.names(['A', 'B', 'C']);
   it('works on valid number/string indices', function() {
      expect(v1).to.respondTo('has');
      expect(v1.has(0)).to.be.false;
      expect(v1.has(1)).to.be.true;
      expect(v1.has(2)).to.be.true;
      expect(v1.has(3)).to.be.true;
      expect(v1.has(4)).to.be.false;
      expect(v1.has('C')).to.be.true;
      expect(v1.has('D')).to.be.false;
      expect((new Variable([2, 4])).has(1)).to.be.true;
      expect((new Variable([2, 4])).has('A')).to.be.false;
   });
   it('returns false for missing/NaN indices', function() {
      expect(v1.has(NaN)).to.be.false;
      expect(v1.has(null)).to.be.false;
      expect(v1.has()).to.be.false;
   });
});
describe('Variable select', function() {
   var v1 = new Variable([2.12, -12.2, 3, 23]);
   v1.names(["a","b","c","d"]);
   var w1 = v1.select(new Variable.Vector([2, 3, 4, 2, 3, 4]));
   var v2= new Variable(["yes","no","yes","yes"]);
   var w2 = v2.select([4,1,2]);
   var w2 = v2.select(new Variable([4,1,2]));
   it('works when called with a vector', function() {
      expect(w1.get()).to.deep.equal([-12.2, 3, 23, -12.2, 3, 23]);
      expect(w1.names().toArray()).to.deep.equal(["b","c","d","b","c","d"]);
   });
   it('works when called with an array', function() {
      expect(w2.get()).to.deep.equal(["yes","yes","no"]);
   });
});

describe('Variable#index', function() {
   var v1 = new Variable([2, 4, 6]);
   v1.names(['A', 'B', 'C']);
   var v2 = new Variable(['A', 'B', 'C']);
   it('returns a clone if no arguments provided', function() {
      var v = v1.index();
      expect(v.length()).to.equal(3);
      expect(v).to.not.equal(v1);
      expect(v.mode()).to.equal(v1.mode());
      expect(v.toArray()).to.deep.equal(v1.toArray());
      v = v2.index();
      expect(v.length()).to.equal(3);
      expect(v).to.not.equal(v2);
      expect(v.mode()).to.equal(v2.mode());
      expect(v.toArray()).to.deep.equal(v2.toArray());
   });
   it('uses all entries at that dimension if an index equals "undefined"', function() {
      var v = v1.index(undefined);
      expect(v.length()).to.equal(3);
      expect(v).to.not.equal(v1);
      expect(v.mode()).to.equal(v1.mode());
      expect(v.toArray()).to.deep.equal(v1.toArray());
      v = v2.index(undefined);
      expect(v.length()).to.equal(3);
      expect(v).to.not.equal(v2);
      expect(v.mode()).to.equal(v2.mode());
      expect(v.toArray()).to.deep.equal(v2.toArray());
   });
   it('uses no entries at that dimension if an index equals "null"', function() {
      var v = v1.index(null);
      expect(v.length()).to.equal(0);
      expect(v).to.not.equal(v1);
      expect(v.mode()).to.equal(v1.mode());
      v = v2.index(null);
      expect(v.length()).to.equal(0);
      expect(v).to.not.equal(v2);
      expect(v.mode()).to.equal(v2.mode());
   });
   it('allows repeated values in indices', function() {
      var v = v1.index(new Variable([3, 1, 1]));
      expect(v.length()).to.equal(3);
      expect(v.mode()).to.equal(v1.mode());
      expect(v.toArray()).to.deep.equal([v1.get(3), v1.get(1), v1.get(1)]);
      v = v2.index(new Variable([3, 1, 1]));
      expect(v.length()).to.equal(3);
      expect(v.mode()).to.equal(v2.mode());
      expect(v.toArray()).to.deep.equal([v2.get(3), v2.get(1), v2.get(1)]);
   });
   it('uses named coordinates correctly', function() {
      var v = v1.index(new Variable(['A', 'A', 'C']));
      expect(v.length()).to.equal(3);
      expect(v.mode()).to.equal(v1.mode());
      expect(v.toArray()).to.deep.equal([v1.get(1), v1.get(1), v1.get(3)]);
   });
});

describe('Variable#indexSet', function() {
   it('changes all values if no arguments provided', function() {
      var v1 = new Variable([2, 4, 6]);
      v1.names(['A', 'B', 'C']);
      var v2 = new Variable(['A', 'B', 'C']);
      v1.indexSet([1, 2, 3]);
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([1, 2, 3]);

      v2.indexSet(['C', 'B', 'A']);
      expect(v2.length()).to.equal(3);
      expect(v2.toArray()).to.deep.equal(['C', 'B', 'A']);
   });
   it('changes all entries at that dimension if an index equals "undefined"', function() {
      var v1 = new Variable([2, 4, 6]);
      v1.names(['A', 'B', 'C']);
      var v2 = new Variable(['A', 'B', 'C']);
      v1.indexSet([1, 2, 3], undefined);
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([1, 2, 3]);

      v2.indexSet(['C', 'B', 'A'], undefined);
      expect(v2.length()).to.equal(3);
      expect(v2.toArray()).to.deep.equal(['C', 'B', 'A']);
   });
   it('changes nothing if a dimension equals "null"', function() {
      var v1 = new Variable([2, 4, 6]);
      v1.names(['A', 'B', 'C']);
      var v2 = new Variable(['A', 'B', 'C']);
      v1.indexSet([1, 2, 3], null);
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([2, 4, 6]);

      v2.indexSet(['C', 'B', 'A'], null);
      expect(v2.length()).to.equal(3);
      expect(v2.toArray()).to.deep.equal(['A', 'B', 'C']);
   });
   it('allows repeated values in indices', function() {
      var v1 = new Variable([2, 4, 6]);
      v1.names(['A', 'B', 'C']);
      var v2 = new Variable(['A', 'B', 'C']);
      v1.indexSet([1, 2, 3], new Variable([3, 1, 1]));
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([3, 4, 1]);

      v2.indexSet(['A', 'B', 'C'], new Variable([3, 1, 1]));
      expect(v2.length()).to.equal(3);
      expect(v2.toArray()).to.deep.equal(['C', 'B', 'A']);
   });
   it('uses named coordinates correctly', function() {
      var v1 = new Variable([2, 4, 6]);
      v1.names(['A', 'B', 'C']);
      var v2 = new Variable(['A', 'B', 'C']);
      v1.indexSet([7, 8, 9], new Variable(['A', 'A', 'C']));
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([8, 4, 9]);
   });
});
