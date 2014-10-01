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
   describe('rep', function() {
      var v1 = new Variable([5.5, 3.3, -2.5]);
      var v2 = new Variable(['c', 'x', 'x']);
      var v3 = new Variable(['c', 'x', 'x'], {mode: 'ord', levels:['x', 'c']});
      var v4 = new Variable([true, false, true], {mode: 'logical'});
      var counts = [5.5, 3.3, -2.5];
      // `times` is a number: repeat the variable that many times
      it('with a number will repeat the variable', function() {
         expect(v1.rep(3).get()).to.deep.equal([
            5.5, 3.3, -2.5, 5.5, 3.3, -2.5, 5.5, 3.3, -2.5]);
         expect(v2.rep(3).get()).to.deep.equal([
            'c', 'x', 'x', 'c', 'x', 'x', 'c', 'x', 'x']);
         expect(v3.rep(2.9).get()).to.deep.equal([
            'c', 'x', 'x', 'c', 'x', 'x']);
         expect(v4.rep(1).get()).to.deep.equal([
            true, false, true]);
      });
      // `times` is a variable or array: use the values as frequencies for
      // corresponding entries.  `times` must have same length as `this`
      it('with a variable or array will repeat the variable', function() {
         expect(v1.rep(v1).get()).to.deep.equal([
            5.5, 5.5, 5.5, 5.5, 5.5, 3.3, 3.3, 3.3]);
         expect(v1.rep(counts).get()).to.deep.equal([
            5.5, 5.5, 5.5, 5.5, 5.5, 3.3, 3.3, 3.3]);
         expect(v2.rep(v1).get()).to.deep.equal([
            'c', 'c', 'c', 'c', 'c', 'x', 'x', 'x']);
         expect(v3.rep([2, 3, 2]).get()).to.deep.equal([
            'c', 'c', 'x', 'x', 'x', 'x', 'x']);
      });
      it('returns a variable of the same subclass & correct length', function(){
         var A = [v1, v2, v3, v3];
         A.forEach(function(v) {
            expect(v.rep(10*Math.random()).mode()).to.equal(v.mode());
            expect(v.rep(v1).mode()).to.equal(v.mode());
            expect(v.rep(counts).mode()).to.equal(v.mode());
            expect(v.rep({length: 2.5}).mode()).to.equal(v.mode());
            expect(v.rep({each: 2.5}).mode()).to.equal(v.mode());
            expect(v.rep(5).length()).to.equal(v.length()*5);
            expect(v.rep(v1).length()).to.equal(5+3+0);
            expect(v.rep(counts).length()).to.equal(5+3+0);
            expect(v.rep({length: 2.5}).length()).to.equal(2);
            expect(v.rep({each: 2.5}).length()).to.equal(v.length()*2);
         });
      });
      it('repeats missing values', function() {
         var v = new Variable([3.5, null, 1]);
         expect(v.rep(3).get(5)).to.equal(null);
         expect(v.rep(v1).get(8)).to.equal(null);
      });
   });
});
