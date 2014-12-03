var Variable  = require('../../index').Variable;
var stats  = require('../../index').stats;
var List      = require('../../index').List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var A = [
   new Variable([5.5, , 3.3, -2.5]),
   new Variable(['c', , 'x', 'x']),
   new Variable([true, , false, true], {mode: 'logical'}),
   new Variable(['c', , 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
];
var E = new Variable([]);
var M = new Variable([null, NaN, undefined]);
var STR = Variable.string(["help","me","please!"]);

describe('Basic statistics', function() {
   it('sum', function() {
      expect(Variable).to.respondTo('sum');
      A.forEach(function(v) {
         expect(utils.isMissing(v.sum())).to.be.true;
         if (v.length() > 0) {
            expect(v.nonMissing().sum()).to.exist;
            expect(v.sum(true)).to.exist;
         }
      });
      expect(A[0].sum(true)).to.equal(5.5+3.3-2.5);
      expect(A[1].sum(true)).to.equal(1+2+2);
      expect(A[2].sum(true)).to.equal(1+0+1);
      expect(A[3].sum(true)).to.equal(2+1+1);
      expect(E.sum(true)).to.equal(0);
      expect(E.sum()).to.equal(0);
      expect(utils.isMissing(STR.sum())).to.be.true;
      expect(M.sum(true)).to.equal(0);
      expect(utils.isMissing(M.sum())).to.be.true;
   });
   it('mean', function() {
      expect(Variable).to.respondTo('mean');
      A.forEach(function(v) {
         expect(utils.isMissing(v.sum())).to.be.true;
         if (v.length() > 0) {
            expect(v.nonMissing().sum()).to.exist;
            expect(v.sum(true)).to.exist;
         }
      });
      expect(A[0].mean(true)).to.equal((5.5+3.3-2.5)/3);
      expect(A[1].mean(true)).to.equal((1+2+2)/3);
      expect(A[2].mean(true)).to.equal((1+0+1)/3);
      expect(A[3].mean(true)).to.equal((2+1+1)/3);
      expect(utils.isMissing(E.mean(true))).to.be.true;
      expect(utils.isMissing(E.mean())).to.be.true;
      expect(utils.isMissing(STR.mean())).to.be.true;
      expect(utils.isMissing(M.mean(true))).to.be.true;
      expect(utils.isMissing(M.mean())).to.be.true;
   });
   it('min', function() {
      expect(A[0].min(true)).to.equal(-2.5);
      expect(A[1].min(true)).to.equal(1);
      expect(A[2].min(true)).to.equal(0);
      expect(A[3].min(true)).to.equal(1);
      [E, M, STR].forEach(function(v) {
         expect(v.min(true)).to.equal(Infinity);
      });
      A.concat([M, STR]).forEach(function(v) {
         expect(utils.isMissing(v.min())).to.be.true;
      });
      expect(E.min()).to.equal(Infinity);
   });
   it('max', function() {
      expect(A[0].max(true)).to.equal(5.5);
      expect(A[1].max(true)).to.equal(2);
      expect(A[2].max(true)).to.equal(1);
      expect(A[3].max(true)).to.equal(2);
      [E, M, STR].forEach(function(v) {
         expect(v.max(true)).to.equal(-Infinity);
      });
      A.concat([M, STR]).forEach(function(v) {
         expect(utils.isMissing(v.max())).to.be.true;
      });
      expect(E.max()).to.equal(-Infinity);
   });
   it('var (variance) and standard deviation', function() {
      var A1 = Variable.seq(5, 1);
      var A2 = Variable([null]).concat(A1);
      expect(A1).to.respondTo('var');
      expect(A1.var()).to.equal(2.5);
      expect(A2.var(true)).to.equal(2.5);
      expect(utils.isMissing(A2.var())).to.be.true;
      expect(utils.isMissing(Variable([1]).var())).to.be.true;
      expect(utils.isMissing(Variable([]).var())).to.be.true;
      expect(A1).to.respondTo('sd');
      expect(A1.sd()).to.be.closeTo(Math.sqrt(2.5), 0.000001);
      expect(A2.sd(true)).to.be.closeTo(Math.sqrt(2.5), 0.000001);
      expect(utils.isMissing(A2.sd())).to.be.true;
      expect(utils.isMissing(Variable([1]).sd())).to.be.true;
      expect(utils.isMissing(Variable([]).sd())).to.be.true;
   });
   it('scale', function() {
      var v1 = Variable.tabulate(Math.random, 1, 10).set(5, NaN);
      var center = Math.random();
      var scale = Math.random();
      v1.scale(center, scale).get('values').each(function(val, i) {
         expect(utils.equal(val, (v1.get(i) - center) / scale)).to.be.true;
      });
      expect(v1.scale(center, scale).get('center')).to.equal(center);
      expect(v1.scale(center, scale).get('scale')).to.equal(scale);
   });
   it('zscore', function() {
      var v1 = Variable.tabulate(Math.random, 1, 10).set(5, NaN);
      var center = v1.mean(true);
      var scale = v1.sd(true);
      var L = v1.zscore();
      expect(L.get('center')).to.equal(center);
      expect(L.get('scale')).to.equal(scale);
   });
   it('correlate', function() {
      var v1 = Variable.tabulate(Math.random, 1, 10).set(5, NaN);
      expect(stats.correlate(v1, v1, true)).to.be.closeTo(1, .000001);
   });
      var v1 = new Variable([1,2,3,4,5]);
      var v2 = new Variable([5,4,3,2,1]);
      expect(stats.correlate(v1, v2, false)).to.be.closeTo(-1, .000001);
      v1.set(1, NaN);
      v2.set(5, NaN);
      expect(stats.correlate(v1, v2, true)).to.be.closeTo(-1, .000001);
      v1 = Variable.tabulate(Math.random, 1, 10000);
      v2 = Variable.tabulate(Math.random, 1, 10000);
      expect(Math.abs(stats.correlate(v1, v2))).to.be.below(.05);
      var v1 = new Variable([1,2,3,4,5]);
      var v2 = new Variable([2.2, 1.4, 3, 3, 2]);
      expect(stats.correlate(v1, v2)).to.be.closeTo(.27617, .00001);
});
