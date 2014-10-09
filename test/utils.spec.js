var utils  = require('../base/utils');
var expect = require('chai').expect;

describe('utils has', function() {
   describe('getOption method', function() {
      var getOption = utils.getOption;
      var optList = ["scalar", "logical", "String", "scall"];
      var def = "default";
      it('which returns the first match', function() {
         expect(getOption).to.exist;
         expect(getOption("sca",optList,def)).to.equal("scalar");
         expect(getOption("s",optList)).to.equal("scalar");
         expect(getOption("lo",optList)).to.equal("logical");
      });
      it('which ignores case', function() {
         expect(getOption("scA",optList,def)).to.equal("scalar");
         expect(getOption("S",optList)).to.equal("scalar");
         expect(getOption("st",optList)).to.equal("String");
      });
      it('which returns the default if s is empty or null', function() {
         expect(getOption("",optList,def)).to.equal("default");
         expect(getOption(null,optList,def)).to.equal("default");
         expect(getOption(undefined,optList,def)).to.equal("default");
         expect(getOption("",[],def)).to.equal("default");
      });
      it('which returns null if no match is found', function() {
         expect(getOption("happy",optList,def)).to.equal(null);
         expect(getOption("scb",optList,def)).to.equal(null);
         expect(getOption("x",[],def)).to.equal(null);
      });
   });
   describe('missing value functionality:', function() {
      it('method isMissing', function() {
         [utils.missing, NaN, null, undefined].forEach(function(v) {
            expect(utils.isMissing(v)).to.be.ok;
         });
         [0, -1, "", []].forEach(function(v) {
            expect(utils.isMissing(v)).to.not.be.ok;
         });
      });
      it('method singleMissing', function() {
         expect(utils.isMissing(utils.singleMissing(null))).to.be.ok;
         [0, "", 4, -1].forEach(function(v) {
            expect(utils.singleMissing(v)).to.equal(v);
         });
         expect(utils.singleMissing([])).to.deep.equal([]);
      });
      it('method makePreserveMissing', function() {
         function f(val) { return (val === 5) ? null : val; }
         var f2 = utils.makePreserveMissing(f);
         expect(utils.isMissing(f2(utils.missing))).to.be.ok;
         expect(utils.isMissing(f2(null))).to.be.ok;
         [0, "", 4, -1].forEach(function(v) {
            expect(f2(v)).to.equal(v);
         });
         expect(utils.isMissing(f2(5))).to.be.ok;
      });
      it('method equal', function() {
         var A = [null, NaN, undefined, "", -1, 0, 1, 4, "dfd"];
         A.forEach(function(v) {
            expect(utils.equal(v, v)).to.be.ok;
            expect(utils.equal(v, 5)).to.be.not.ok;
            expect(utils.equal(5, v)).to.be.not.ok;
         });
         for (i = 0; i < 3; i += 1) {
            for (j = 0; j < 3; j += 1) {
               expect(utils.equal(A[i], A[j])).to.be.ok;
            }
         }
         expect(utils.equal(null, 0)).to.not.be.ok;
      });
      it('method areEqualArrays', function() {
         var A = [null, 1, 2, undefined];
         var B = [NaN, 1, 2, null];
         var C = [0, 1, 2, null];
         expect(utils.areEqualArrays(A, B)).to.be.ok;
         expect(utils.areEqualArrays(A, C)).to.not.be.ok;
         expect(utils.areEqualArrays(C, A)).to.not.be.ok;
      });
   });
});