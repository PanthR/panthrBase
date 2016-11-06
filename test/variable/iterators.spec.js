var Variable  = require('../../base/variable');
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var A = [
   new Variable([5.5, 3.3, -2.5]),
   new Variable(['c', 'x', 'x']),
   new Variable(['c', 'x', 'x'], {mode: 'str'}),
   new Variable([true, false, true], {mode: 'logical'}),
   new Variable(['2014-05-17', '2001-08-25', '1985-01-02'],
   { mode: 'date'}),
   new Variable(['c', 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
];
var Amiss = [
   new Variable([5.5, , 3.3, -2.5]),
   new Variable(['c', , 'x', 'x']),
   new Variable(['c', , 'x', 'x'], {mode: 'str'}),
   new Variable([true, , false, true], {mode: 'logical'}),
   new Variable(['2014-05-17', , '2001-08-25', '1985-01-02'],
   { mode: 'date'}),
   new Variable(['c', , 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
];

describe('Variable iterators: ', function() {
   describe('each', function() {
      it('calls the function with the correct arguments', function() {
         A.forEach(function(v) {
            var c = 0;
            function f(val, i) {
               c += 1;
               expect(v.values.get(i)).to.equal(val);
            }
            v.each(f);
            expect(c).to.equal(v.length());
         });
      });
      it('in the correct order', function() {
         A.forEach(function(v) {
            var c = 0;
            function f(val, i) { c += 1; expect(i).to.equal(c); }
            v.each(f);
         });
      });
      it('defaults to skipMissing false', function() {
         Amiss.forEach(function(v) {
            var c = 0;
            v.each(function(val, i) { c += 1; expect(utils.equal(v.values.get(i), val)).to.be.true; });
            expect(c).to.equal(v.length());
         });
      });
      it('skips the missing if skipMissing true', function() {
         Amiss.forEach(function(v) {
            var c = 0;
            v.each(function(val, i) { c += 1;
               expect(utils.equal(v.values.get(i), val)).to.be.true;
               expect(utils.isNotMissing(val)).to.be.true;
            }, true);
            expect(c).to.equal(v.length() - 1);
         });
      });
   });
   describe('reduce', function() {
      it('calls the function with the correct arguments', function() {
         A.forEach(function(v) {
            var c = 0, acc = Math.random();
            function f(_acc, val, i) {
               c += 1;
               expect(_acc).to.equal(acc);
               expect(v.values.get(i)).to.equal(val);
               acc = Math.random();
               return acc;
            }
            v.reduce(f, acc);
            expect(c).to.equal(v.length());
         });
      });
      it('in the correct order', function() {
         A.forEach(function(v) {
            var c = 0;
            function f(acc, val, i) { c += 1; expect(i).to.equal(c); }
            v.reduce(f, 1);
         });
      });
      it('returns the correct value', function() {
         A.forEach(function(v) {
            var res;
            function f(acc, val, i) { res = Math.random(); return res; }
            expect(v.reduce(f, 1)).to.equal(res);
         });
      });
      it('defaults to skipMissing false', function() {
         Amiss.forEach(function(v) {
            var c = 0, acc = Math.random();
            function f(_acc, val, i) {
               c += 1;
               expect(utils.equal(_acc, acc));
               expect(utils.equal(v.values.get(i), val)).to.be.true;
               acc = Math.random();
               if (acc < 0.5) { acc = utils.isMissing; }
               return acc;
            }
            v.reduce(f, acc);
            expect(c).to.equal(v.length());
         });
      });
      it('skips the missing if skipMissing true', function() {
         Amiss.forEach(function(v) {
            var c = 0, acc = Math.random();
            function f(_acc, val, i) {
               c += 1;
               expect(utils.equal(_acc, acc));
               expect(utils.isNotMissing(val)).to.be.true;
               expect(utils.equal(v.values.get(i), val)).to.be.true;
               acc = Math.random();
               if (acc < 0.5) { acc = utils.missing; }
               return acc;
            }
            v.reduce(f, acc, true);
            expect(c).to.equal(v.length() - 1);
         });
      });
   });
   describe('map', function() {
      it('calls the function with the correct arguments', function() {
         A.forEach(function(v) {
            var c = 0;
            function f(val, i) {
               c += 1;
               expect(v.values.get(i)).to.equal(val);
            }
            v.map(f);
            expect(c).to.equal(v.length());
         });
      });
      it('in the correct order', function() {
         A.forEach(function(v) {
            var c = 0;
            function f(val, i) { c += 1; expect(i).to.equal(c); }
            v.map(f);
         });
      });
      it('creates correct values', function() {
         A.forEach(function(v) {
            var arr = [];
            var f = function(val, i) { arr.push(Math.random()); return arr[arr.length-1]; }
            var w = v.map(f);
            expect(w).to.be.instanceof(Variable);
            expect(w.mode()).to.equal('scalar');
            expect(w.get()).to.deep.equal(arr);
            arr = [];
            f = function(val, i) { arr.push(Math.random() > 0.5); return arr[arr.length-1]; }
            w = v.map(f);
            expect(w).to.be.instanceof(Variable);
            expect(w.mode()).to.equal('logical');
            expect(w.get()).to.deep.equal(arr);
         });
      });
      it('defaults to skipMissing false', function() {
         Amiss.forEach(function(v) {
            var c = 0;
            function f(val, i) {
               c += 1;
               expect(utils.equal(v.values.get(i), val)).to.be.true;
            }
            v.map(f, 'string');
            expect(c).to.equal(v.length());
         });
      });
      it('skips the missing if skipMissing true', function() {
         Amiss.forEach(function(v) {
            var c = 0;
            function f(val, i) {
               c += 1;
               expect(utils.equal(v.values.get(i), val)).to.be.true;
               expect(utils.isNotMissing(val)).to.be.true;
            }
            v.map(f, true);
            expect(c).to.equal(v.length() - 1);
         });
      });
      it('preserves names', function() {
         A.forEach(function(v) {
            v.names(['A', 'B', 'C']);
            expect(v.map(function(x) { return 1; }, true)
                    .names().toArray()).to.deep.equal(['A','B','C']);
         });
      });
   });
   describe('filter', function() {
      var Amiss = [
         new Variable([5.5, , 3.3, -2.5]),
         new Variable(['c', , 'x', 'x']),
         new Variable(['c', , 'x', 'x'], {mode: 'str'}),
         new Variable([true, , false, true], {mode: 'logical'}),
         new Variable(['2014-05-17', , '2001-08-25', '1985-01-02'],
         { mode: 'date'}),
         new Variable(['c', , 'x', 'x'], {mode: 'ord', levels:['x', 'c']})
      ];
      it('returns correct values', function() {
         Amiss.forEach(function(v) {
            var w = v.filter(utils.isNotMissing);
            expect(w.mode()).to.equal(v.mode());
            expect(w.length()).to.equal(3);
            expect(w.get(1)).to.equal(v.get(1));
            expect(w.get(2)).to.equal(v.get(3));
            expect(w.get(3)).to.equal(v.get(4));
            w = v.filter(function(val, i) { return i === 3; })
            expect(w.mode()).to.equal(v.mode());
            expect(w.length()).to.equal(1);
            expect(w.get(1)).to.equal(v.get(3));
         });
      });
      it('preserves the names', function() {
         var v = A[0];
         v.names(['A', 'B', 'C']);
         expect(v.filter(function(v) { return v < 4; }).names().toArray()).to.deep.equal(['B','C']);
      });
   });
   describe('Variable.mapPair', function() {
      var f, v1, v2, v;

      f = function(x, y) { return x + y; }
      v1 = new Variable([2, 3, 5]);
      v2 = new Variable([1, 6, 7]);
      v = Variable.mapPair(v1, v2, f, 'scalar');
      it('returns a variable of the correct mode', function() {
         expect(v).to.be.defined;
         expect(v.mode()).to.equal('scalar');
      });
      it('returns the correct values', function() {
         expect(v.values.values).to.deep.equal([3, 9, 12]);
      });
      it('infers the mode if not provided', function() {
         expect(Variable.mapPair(v1, v2, f).mode())
            .to.equal(v.mode());
      });
      it('errors on arguments of unequal lengths', function() {
         var v3 = new Variable([3, 5]);

         expect(function() { Variable.mapPair(v1, v3, f, 'scalar'); })
            .to.throw(Error);
      });
      it('accepts one-dimensional objects as arguments', function() {
         v = null;
         expect(function() { v = Variable.mapPair(v1, v2.values, f, 'scalar'); })
            .to.not.throw(Error);
         expect(v.values.values).to.deep.equal([3, 9, 12]);
         v = null;
         expect(function() {
            v = Variable.mapPair(v1.values, v2.values.values, f, 'scalar');
         }).to.not.throw(Error);
         expect(v.values.values).to.deep.equal([3, 9, 12]);
      });
      it('maintains names from the first suitable argument', function() {
         v1.names(['A', 'B', 'C']);
         v = Variable.mapPair(v1, v2, f, 'scalar');
         expect(v.names().values.values).to.deep.equal(['A', 'B', 'C']);
         v = Variable.mapPair(v2, v1, f, 'scalar');
         expect(v.names().values.values).to.deep.equal(['A', 'B', 'C']);
         v2.names(['D', 'E', 'F']);
         v = Variable.mapPair(v2, v1, f, 'scalar');
         expect(v.names().values.values).to.deep.equal(['D', 'E', 'F']);
      });
   });
   describe('Variable.Multi', function() {
      var f, v1, v2, v3, v;

      f = function(x, y, z) { return x + y + z; }
      v1 = new Variable([2, 3, 5]);
      v2 = new Variable([1, 6, 7, 6]);
      v3 = new Variable([3]);
      v = Variable.mapMulti([v1, v2, v3], f, 'scalar');
      it('returns a variable of the correct mode', function() {
         expect(v).to.be.defined;
         expect(v.mode()).to.equal('scalar');
      });
      it('returns the correct values', function() {
         expect(v.values.values).to.deep.equal([6, 12, 15, 11]);
      });
      it('infers the mode if not provided', function() {
         expect(Variable.mapMulti([v1, v2, v3], f).mode())
            .to.equal(v.mode());
      });
      it('targets a predetermined length if one is provided', function() {
         expect(Variable.mapMulti([v1, v2, v3], f, 'scalar', 7)
            .values.values).to.deep.equal([6, 12, 15, 11, 7, 14, 12]);
      });
      it('maintains names from the first suitable argument', function() {
         v1.names(['A', 'B', 'C']);
         v = Variable.mapMulti([v1, v2, v3], f, 'scalar', 3);
         expect(v.names().values.values).to.deep.equal(['A', 'B', 'C']);
         v = Variable.mapMulti([v2, v1, v3], f, 'scalar', 3);
         expect(v.names().values.values).to.deep.equal(['A', 'B', 'C']);
         v = Variable.mapMulti([v2, v3, v1], f, 'scalar', 2);
         expect(v.names().values.values).to.deep.equal(['A', 'B']);
         v = Variable.mapMulti([v2, v3, v1], f, 'scalar', 7);
         expect(v.names().values.values).to.deep.equal(['A', 'B', 'C', 'A', 'B', 'C', 'A']);
         v2.names(['D', 'E', 'F', 'G']);
         v = Variable.mapMulti([v2, v1, v3], f, 'scalar', 4);
         expect(v.names().values.values).to.deep.equal(['D', 'E', 'F', 'G']);
      });
   });
});
