var Variable  = require('../../base/variable');
var expect = require('chai').expect;

describe('Clone', function() {
   var A = [
      new Variable([1.2, 3.1, -2.5, 0]),  // A[0] scalar
      new Variable([true, false, false, false, true]),
      new Variable(['m','f','m','f']),
      new Variable(['m','f','m','f'],{mode: 'ord', levels: ['m', 'f']}),
      new Variable(['m','f','m','f'], {mode: 'str'})
   ];
   it('exists', function() {
      expect(Variable).to.respondTo('clone');
      A.forEach(function(v) {
         expect(function() { v.clone(); }).to.not.throw(Error);
      });
   });
   it('returns a variable of the same mode', function() {
      A.forEach(function(v) {
         expect(v.clone().mode()).to.equal(v.mode());
      });
      expect(A[3].clone().levels()).to.deep.equal(A[3].levels());
   });
   it('copies the values correctly and is independent of orginal', function() {
      A.forEach(function(v) {
         var w = v.clone();
         expect(w.get()).to.deep.equal(v.get());
         expect(w.values).to.not.equal(v.values);
      });
   });
   describe('reproduce', function() {
      it('can make a variable of length 0', function() {
         A.forEach(function(v) {
            expect(v.reproduce([]).mode()).to.equal(v.mode());
            expect(v.reproduce([]).length()).to.equal(0);
         });
      });
      it('can make a new variable using a vector of values', function() {
         expect(A[3].reproduce(new Variable.Vector([1, 2, 1])).levels())
            .to.deep.equal(A[3].levels());
      });
   });
});