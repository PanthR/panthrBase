var Variable  = require('../../base/variable');
var expect = require('chai').expect;

describe('Variable fillers include ', function() {
   it('resize', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0], {mode: 'Sc', name: 'niceName', label: 'l1'});
      var v2 = new Variable(['c', 'b', 'c', 'c', 'a']);
      var r1, r2;
      expect(Variable).to.respondTo('resize');
      r1 = v1.resize(7, true);
      expect(r1).to.not.equal(v1);
      expect(r1.get()).to.deep.equal([1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5]);
      r2 = r1.resize(10);
      expect(r2).to.not.equal(r1);
      expect(r2.get()).to.deep.equal([
         1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5, null, null, null]);
      expect(v1.resize(4).get()).to.deep.equal([1.2, 3.1, -2.5, 0]);
      r1 = v2.resize(7, true);
      expect(r1).to.not.equal(v2);
      expect(r1.get()).to.deep.equal(['c', 'b', 'c', 'c', 'a', 'c', 'b']);
      r2 = r1.resize(10, 42);
      expect(r2).to.not.equal(r1);
      expect(r2.get()).to.deep.equal([
         'c', 'b', 'c', 'c', 'a', 'c', 'b', null, null, null]);
      r1 = r2.resize(4, true);
      expect(r1).to.not.equal(r2);
      expect(r1.get()).to.deep.equal(['c', 'b', 'c', 'c']);
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
   it('seq', function() {
   // from, to, step
   var v1 = Variable.seq(5.1, 6.9, 0.5);
   expect(v1).to.be.instanceOf(Variable.ScalarVar);
   expect(v1.get()).to.deep.equal([5.1, 5.6, 6.1, 6.6]);

   // from, to (step is 1 or -1)
   var v2 = Variable.seq(6.9, 4.5, {name: 'hey'});
   expect(v2.name).to.equal('hey');
   expect(v2.get()).to.deep.equal([6.9, 5.9, 4.9]);

   // to (from is 1, step is 1)
   v2 = Variable.seq(4.5);
   expect(v2.get()).to.deep.equal([1, 2, 3, 4]);

   });
});
