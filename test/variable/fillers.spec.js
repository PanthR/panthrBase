var Variable  = require('../../base/variable');
var expect = require('chai').expect;

describe('Variable fillers include ', function() {
   it('resize', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0], {mode: 'Sc', name: 'niceName', label: 'l1'});
      var v2 = new Variable(['c', 'b', 'c', 'c', 'a']);
      expect(Variable).to.respondTo('resize');
      expect(v1.resize(7, true)).to.equal(v1);
      expect(v1.get()).to.deep.equal([1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5]);
      expect(v1.resize(10)).to.equal(v1);
      expect(v1.get()).to.deep.equal([
         1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5, null, null, null]);
      expect(v1.resize(4).get()).to.deep.equal([1.2, 3.1, -2.5, 0]);
      expect(v2.resize(7, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c', 'a', 'c', 'b']);
      expect(v2.resize(10, 42)).to.equal(v2);
      expect(v2.get()).to.deep.equal([
         'c', 'b', 'c', 'c', 'a', 'c', 'b', null, null, null]);
      expect(v2.resize(4, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c']);
   });
   it('tabulate', function() {
      // function, start, end, options are the parameters
      expect(Variable).itself.to.respondTo('tabulate');
      var f1, f2;
      f1= function(i) { return i*i; };
      var v1 = Variable.tabulate(f1, 1, 4, {name: 'v1', mode: 'sc'});
      expect(v1.length()).to.equal(4);
      expect(v1.get()).to.deep.equal([1, 4, 9, 16]);
      f2 = function(i) { return ['a', 'b'][i%2]; };
      var v2 = Variable.tabulate(f2, 2, 7);
      expect(v2.length()).to.equal(6);
      expect(v2).to.be.instanceOf(Variable.FactorVar);
      expect(v2.get()).to.deep.equal(['a','b','a','b','a','b']);
   });
});
