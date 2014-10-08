var Variable  = require('../../base/variable');
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
      expect(v1.get([1, 5, 2])).to.deep.equal([2.12, null, -12.2]);
      expect(v1.get(4)).to.equal(null);
      expect(v3.get(3)).to.equal(null);
      expect(v4.get(3)).to.equal(null);
      expect(v4.get(4)).to.equal(true);
   });
   it('places null in for missing/nan indices', function() {
      expect(v1.get([1, undefined, 2])).to.deep.equal([2.12, null, -12.2]);
      expect(v1.get([1, null, 2])).to.deep.equal([2.12, null, -12.2]);
      expect(v1.get([1, NaN, 2])).to.deep.equal([2.12, null, -12.2]);
   });
   it('returns null when out of bounds', function() {
      expect(v1.get(0)).to.equal(null);
      expect(v1.get(5)).to.equal(null);
   });
   it('works for factors and ordered', function() {
      expect(v2.get(0)).to.equal(null);
      expect(v2.get(5)).to.equal(null);
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
      expect(v5.get(0)).to.equal(null);
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
         expect(spy.lastCall.args[0][1]).to.equal(null);
      });
      it('-- accepts a scalar variable', function() {
         var S = new Variable([-1, 0, -2]);
         v1.get(S);
         expect(spy.lastCall.args[0]).to.deep.equal([3,4]);
         S = new Variable([1, 0, 2]);
         v1.get(S);
         expect(spy.lastCall.args[0]).to.deep.equal([1,2]);
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
      expect(v2.get(1)).to.equal(null);
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
      expect(v1.get(l1)).to.deep.equal([5, null, 1, null]);
   });
});