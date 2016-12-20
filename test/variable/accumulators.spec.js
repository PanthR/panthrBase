var Variable  = require('../../base/variable');
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('Variable accumulators: ', function() {
   it('cumulative', function() {
      var v1 = new Variable([1, 2, 3]);
      expect(v1).to.respondTo('cumulative');
      var v2 = v1.cumulative(function(acc, val, i) { return acc + val * i; }, 1);
      expect(v2.toArray()).to.deep.equal([2, 6, 15]);
   });
   it('cumSum', function() {
      var v1 = new Variable([1, 2, 3]);
      expect(v1).to.respondTo('cumSum');
      var v2 = v1.cumSum();
      expect(v2.toArray()).to.deep.equal([1, 3, 6]);
   });
   it('cumProd', function() {
      var v1 = new Variable([1, 2, 3]);
      expect(v1).to.respondTo('cumProd');
      var v2 = v1.cumProd();
      expect(v2.toArray()).to.deep.equal([1, 2, 6]);
   });
   it('cumMax', function() {
      var v1 = new Variable([2, 1, 3]);
      expect(v1).to.respondTo('cumMax');
      var v2 = v1.cumMax();
      expect(v2.toArray()).to.deep.equal([2, 2, 3]);
   });
   it('cumMin', function() {
      var v1 = new Variable([2, 1, 3]);
      expect(v1).to.respondTo('cumMin');
      var v2 = v1.cumMin();
      expect(v2.toArray()).to.deep.equal([2, 1, 1]);
   });
   it('diff', function() {
      var v1 = new Variable([2, 1, 3, 1]);
      expect(v1).to.respondTo('diff');
      var v2 = v1.diff();
      expect(v2.toArray()).to.deep.equal([-1, 2, -2]);
   });
});
