var Variable  = require('../../index').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('order', function() {
   var v = new Variable([2, 2.1, 4.3, 1.5, -2, 1, 3]);
   it('works with numerical inputs', function() {
      expect(v).to.respondTo('order');
      expect(v.order().toArray()).to.deep.equal([5, 6, 4, 1, 2, 7, 3]);
   });
   it('can make descending order', function() {
      expect(v.order(true).toArray()).to.deep.equal([3, 7, 2, 1, 4, 6, 5]);
   });
   it('can use a provided comparator', function() {
      f = function(a, b) { 
         return a.length < b.length ? -1 : a.length === b.length ? 0 : 1; 
      }
      var w = Variable.string(["zach","c","antelope","zoo","foods"]);
      expect(w.order(f).toArray()).to.deep.equal([2,4,1,5,3]);
   });
   it('sends NaN values to the end', function() {
      var u = new Variable([2, NaN, 4.3, 1.5, 100, 1, -3]);
      expect(u.order().toArray()).to.deep.equal([7, 6, 4, 1, 3, 5, 2]);
      expect(u.order(true).toArray()).to.deep.equal([5, 3, 1, 4, 6, 7, 2]);
      u = new Variable([2, NaN, 4.3, 1.5, 100, 1, NaN, -3]);
      expect(u.order().toArray()).to.deep.equal([8, 6, 4, 1, 3, 5, 2, 7]);
      expect(u.order(true).toArray()).to.deep.equal([5, 3, 1, 4, 6, 8, 2, 7]);
   });
   it('works for factors', function() {
      var w = Variable.factor(["A", "A", "B", "A", "C", "B"]);
      expect(w.order().toArray()).to.deep.equal([1, 2, 4, 3, 6, 5]);
      expect(w.order(true).toArray()).to.deep.equal([5, 3, 6, 1, 2, 4]);
   });
});
describe('sort', function() {
   var v = new Variable([2, 2.1, 4.3, 1.5, -2, 1, 3]);
   it('works with numerical inputs', function() {
      expect(v).to.respondTo('order');
      expect(v.sort().toArray()).to.deep.equal([-2, 1, 1.5, 2, 2.1, 3, 4.3]);
   });
   it('can make descending order', function() {
      expect(v.sort(true).toArray()).to.deep.equal([4.3, 3, 2.1, 2, 1.5, 1, -2]);
   });
   it('can use a provided comparator', function() {
      f = function(a, b) { 
         return a.length < b.length ? -1 : a.length === b.length ? 0 : 1; 
      }
      var w = new Variable.string(["zach","c","antelope","zoo","foods"]);
      expect(w.sort(f).toArray()).to.deep.equal(["c", "zoo", "zach", "foods", "antelope"]);
   });
   it('sends NaN values to the end', function() {
      var u = new Variable([2, NaN, 4.3, 1.5, 100, 1, -3]);
      expect(u.sort().toArray().slice(0,6)).to.deep.equal([-3, 1, 1.5, 2, 4.3, 100]);
      expect(u.sort(true).toArray().slice(0,6)).to.deep.equal([100, 4.3, 2, 1.5, 1, -3]);
      u = new Variable([2, NaN, 4.3, 1.5, 100, 1, NaN, -3]);
      expect(u.sort().toArray().slice(0,6)).to.deep.equal([-3, 1, 1.5, 2, 4.3, 100]);
      expect(u.sort(true).toArray().slice(0,6)).to.deep.equal([100, 4.3, 2, 1.5, 1, -3]);
   });
   it('with random numbers', function() {
      var v = new Variable(new Variable.Vector(Math.random, 100));
      var w = v.sort();
      for (var i = 1; i < w.length; i+= 1) {
         expect(w.get(i)).to.not.be.greaterThan(w.get(i + 1));
      }
      w = v.sort(true);
      for (var i = 1; i < w.length; i+= 1) {
         expect(w.get(i)).to.not.be.lessThan(w.get(i + 1));
      }
   });
   it('works for factors', function() {
      var w = Variable.factor(["A", "A", "B", "A", "C", "B"]);
      expect(w.sort().asScalar().toArray()).to.deep.equal([1, 1, 1, 2, 2, 3]);
      expect(w.sort(true).asScalar().toArray()).to.deep.equal([3, 2, 2, 1, 1, 1]);
   });
});
describe('quantile', function() {
   var v1 = new Variable([3, 4, 5, 6, 7]);
   var v2 = new Variable([3, 4, NaN, 5, 6, 7, NaN]);
   it('works when no missing values', function() {
      expect(v1.quantile(.2).toArray()).to.deep.equal([3.8]);
      expect(v1.quantile(.25).toArray()).to.deep.equal([4]);
      expect(v1.quantile(0).toArray()).to.deep.equal([3]);
      expect(v1.quantile(1).toArray()).to.deep.equal([7]);
   });
   it('skips values missing in the variable if skipMissing', function() {
      expect(v2.quantile(.2, true).toArray()).to.deep.equal([3.8]);
      expect(v2.quantile(.25, true).toArray()).to.deep.equal([4]);
      expect(v2.quantile(0, true).toArray()).to.deep.equal([3]);
      expect(v2.quantile(1, true).toArray()).to.deep.equal([7]);
   });
   it('throws an error if missing and not skipMissing', function() {
      expect(function() { v2.quantile(.2)}).to.throw(Error);
   });
   it('preserves missing values in the `probs` argument', function() {
      expect(utils.areEqualArrays(v1.quantile([.2, NaN, null, .5, undefined]).toArray(),
         [3.8, utils.missing, utils.missing, 5, utils.missing])).to.be.true;
   });
   it('works for different `probs` formats: 1 value, array, vector, variable', function() {
      expect(v1.quantile(new Variable.Vector([.2, .25, 1])).toArray())
         .to.deep.equal([3.8, 4, 7]);
      expect(v1.quantile(new Variable([.2, .25, 1])).toArray())
         .to.deep.equal([3.8, 4, 7]);
   });
   it('generates appropriate name labels', function() {
            expect(v1.quantile(new Variable([.2, .25, 1]))
               .names().toArray()).to.deep.equal(['20%', '25%', '100%']);
   });
   it('errors when prob < 0 or prob > 1', function() {
      expect(function() { v1.quantile(-2)}).to.throw(Error);
      expect(function() { v1.quantile(-.02)}).to.throw(Error);
      expect(function() { v1.quantile(1.1)}).to.throw(Error);
   });
});
