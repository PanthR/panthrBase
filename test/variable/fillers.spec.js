var Variable  = require('../../base/variable');
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('Variable fillers include ', function() {
   it('resize', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0], {mode: 'Sc', label: 'l1'});
      var v2 = new Variable(['c', 'b', 'c', 'c', 'a']);
      expect(Variable).to.respondTo('resize');
      expect(v1.resize(7, true)).to.equal(v1);
      expect(v1.get()).to.deep.equal([1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5]);
      expect(v1.resize(10)).to.equal(v1);
      expect(utils.areEqualArrays(v1.get(),
      [ 1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5, utils.missing, utils.missing,
                                           utils.missing])).to.be.true;
      expect(v1.resize(4).get()).to.deep.equal([1.2, 3.1, -2.5, 0]);
      expect(v2.resize(7, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c', 'a', 'c', 'b']);
      expect(v2.resize(10, 42)).to.equal(v2);
      expect(utils.areEqualArrays(v2.get(),
      [ 'c', 'b', 'c', 'c', 'a', 'c', 'b',
               utils.missing, utils.missing, utils.missing])).to.be.true;
      expect(v2.resize(4, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c']);
   });
   it('tabulate', function() {
      // function, start, end, options are the parameters
      expect(Variable).itself.to.respondTo('tabulate');
      var f1, f2;
      f1= function(i) { return i*i; };
      var v1 = Variable.tabulate(f1, 1, 4, {  mode: 'sc' });
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
      var v2 = Variable.seq(6.9, 4.5);
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
         var A = [v1, v2, v3, v4];
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
         expect(utils.isMissing(v.rep(3).get(5))).to.be.true;
         expect(utils.isMissing(v.rep(v1).get(8))).to.be.true;
      });
      it('preserves the names', function() {
         v1.names(['A', 'B', 'C']);
         expect(v1.rep(v1).names().toArray()).to.deep.equal([
            'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B']);
         expect(v1.rep(counts).names().toArray()).to.deep.equal([
            'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B']);
         expect(v1.rep(2).names().toArray()).to.deep.equal([
            'A', 'B', 'C', 'A', 'B', 'C']);
      });
   });
   describe('concat', function() {
      var A = [
         new Variable([5.5, 3.3, -2.5]),
         new Variable(['c', 'x', 'x']),
         new Variable(['c', 'x', 'x'], {mode: 'str'}),
         new Variable([true, false, true], {mode: 'logical'}),
         new Variable(['2014-05-17', '2001-08-25', '1985-01-02'],
         { mode: 'date'}),
         new Variable(['c', 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
      ];
      it('preserves mode when modes are uniform and not ordinal', function() {
         expect(Variable).itself.to.respondTo('concat');
         A.slice(0,5).forEach(function(v) { 
            var w = Variable.concat(v, v, v);
            expect(w.mode()).to.equal(v.mode());
            expect(w.length()).to.equal(v.length() * 3);
            expect(utils.areEqualArrays(w.get().slice(0,3), v.get())).to.be.true;
            expect(utils.areEqualArrays(w.get().slice(3,6), v.get())).to.be.true;
            expect(utils.areEqualArrays(w.get().slice(6,9), v.get())).to.be.true;
            w = Variable.concat(v);
            expect(w.mode()).to.equal(v.mode());
            expect(utils.areEqualArrays(w.get(), v.get())).to.be.true;
         });
         var w = Variable.concat();
         expect(w.mode()).to.equal('scalar');
         expect(utils.areEqualArrays(w.get(), [])).to.be.true;
      });
      it('except for 2 or more ordinals being concatted', function() {
         var v = A[5];
         var w = Variable.concat(v, v, v);
         expect(w.mode()).to.equal('factor');
         expect(w.length()).to.equal(v.length() * 3);
         expect(utils.areEqualArrays(w.get().slice(0,3), v.get())).to.be.true;
         expect(utils.areEqualArrays(w.get().slice(3,6), v.get())).to.be.true;
         expect(utils.areEqualArrays(w.get().slice(6,9), v.get())).to.be.true;
         w = Variable.concat(v);
         expect(w.mode()).to.equal(v.mode());
         expect(utils.areEqualArrays(w.get(), v.get())).to.be.true;
      })
      it('returns string if at least one mode is a string', function() {
         function pick() { 
            return A[Math.floor(A.length*Math.random())];
         }
         for (var i = 0; i < 15; i += 1) {
            expect(Variable.concat(pick(), A[2], pick()).mode()).to.equal('string');
            expect(Variable.concat(pick(), A[2], pick()).length()).to.equal(9);
         }
      })
      it('returns factor if all modes ordered or factor, not just 1 ord', function() {
         function pick() { 
            return A[Math.random() > .5 ? 1 : 5];
         }
         for (var i = 0; i < 15; i += 1) {
            var w = Variable.concat(pick(), pick());
            expect(w.mode()).to.equal('factor');
            expect(w.length()).to.equal(6);
            expect(utils.areEqualArrays(w.get().slice(0,3), A[1].get())).to.be.true;
            expect(utils.areEqualArrays(w.get().slice(3,6), A[1].get())).to.be.true;
         }
      })
      it('returns scalar otherwise when modes not uniform', function() {
         var ind = [0, 1, 3, 4, 5];
         var i, j, k;
         for (i = 0; i < 20; i += 1) {
            j = ind[Math.floor(5 * Math.random())];
            k = ind[2 + Math.floor(2 * Math.random())];
            if (j !== k) {
               var w = Variable.concat(A[j], A[k], A[k]);
               expect(w.mode()).to.equal('scalar');
               expect(w.length()).to.equal(9);
               expect(utils.areEqualArrays(w.get().slice(0,3), A[j].asScalar().get())).to.be.true;
               expect(utils.areEqualArrays(w.get().slice(3,6), A[k].asScalar().get())).to.be.true;
               expect(utils.areEqualArrays(w.get().slice(6,9), A[k].asScalar().get())).to.be.true;
            }
         }
      })
      it('which is also in the prototype', function() {
         expect(Variable).to.respondTo('concat');
         expect(A[1].concat(A[2], A[3]).length()).to.equal(9);
         expect(A[1].concat(A[2]).length()).to.equal(6);
         expect(A[1].concat().length()).to.equal(3);
      });
      it('concats the names as well, unless none exist', function() {
         var w1 = new Variable([5.5, 3.3, -2.5]);
         var w2 = new Variable(['c', 'x', 'x']);
         w1.names(["a","b","c"]);
         expect(utils.areEqualArrays(w1.concat(w2).names().toArray(),
            ["a","b","c", utils.missing, utils.missing, utils.missing]))
            .to.be.true;
         expect(w1.concat(w1).names().toArray())
               .to.deep.equal(["a","b","c","a","b","c"]);
         expect(utils.isMissing(w2.concat(w2).names())).to.be.true;
      });
   });
});
