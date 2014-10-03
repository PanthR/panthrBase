var Variable  = require('../../base/variable');
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
   });
});