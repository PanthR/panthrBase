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
});