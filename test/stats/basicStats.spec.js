var Variable  = require('../../panthrBase').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var A = [
   new Variable([5.5, , 3.3, -2.5]),
   new Variable(['c', , 'x', 'x']),
   new Variable([true, , false, true], {mode: 'logical'}),
   new Variable(['c', , 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
];
var E = new Variable([]);

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
   });
   it('mean', function() {
      expect(Variable).to.respondTo('mean');

   });
});