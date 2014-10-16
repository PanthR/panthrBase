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