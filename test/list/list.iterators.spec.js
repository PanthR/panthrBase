var List  = require('../../index').List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('List iterators', function() {
   var vals1 = [3, 7, -0.5, 2];
   var names1 = ['a', 'b', 'c', 'd'];
   var l1 = new List(vals1).names(names1);
   var vals2 = [3, 7, utils.missing, 2];
   var names2 = ['a', 'b', 'c', 'd'];
   var l2 = new List(vals2).names(names2);
   describe('each', function() {
      it('calls f on each value with the correct arguments', function() {
         var c = 0;
         function f1(val, i, name) {
            c += 1;
            expect(vals1[i-1]).to.equal(val);
            expect(names1[i-1]).to.equal(name);
            expect(i === c).to.be.true;
         }
         l1.each(f1);
         expect(c).to.equal(vals1.length);
      });
      it('calls f on each value with the correct arguments', function() {
         var c = 0;
         function f1(val, i, name) {
            c += 1;
            expect(utils.equal(vals2[i-1], val)).to.be.true;
            expect(utils.equal(names2[i-1], name)).to.be.true;
            expect(i === c).to.be.true;
         }
         l2.each(f1);
         expect(c).to.equal(vals2.length);
      });
   });
   describe('reduce', function() {
      it('works correctly', function() {
         var acc, c;
         c = 0;
         acc = Math.random();
         function f(_acc, val, i, name) {
            expect(_acc).to.equal(acc);
            c += 1;
            expect(utils.equal(vals2[i-1], val)).to.be.true;
            expect(utils.equal(names2[i-1], name)).to.be.true;
            expect(i === c).to.be.true;
            acc = Math.random();
            return acc;
         }
         expect(l2.reduce(f, acc)).to.equal(acc);
      });
   });
   describe('map', function() {
      it('makes the correct new list with same names', function() {
         var arr;
         arr = [];
         function f(val, i, name) {
            expect(utils.equal(vals2[i-1], val)).to.be.true;
            expect(utils.equal(names2[i-1], name)).to.be.true;
            arr.push(Math.random());
            return arr[arr.length - 1];
         }
         var newl2 = l2.map(f);
         expect(newl2).to.be.instanceof(List);
         expect(utils.areEqualArrays(newl2.get(), arr)).to.be.true;
         expect(utils.areEqualArrays(newl2.names().toArray(), 
                                 l2.names().toArray())).to.be.true;
      });
   });
});