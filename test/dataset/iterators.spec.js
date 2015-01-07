var Base = require('../../index');
var Dataset  = Base.Dataset;
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('Dataset has', function() {
   var dSet;
   beforeEach(function() {
      dSet = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
   });
   it('eachRow', function() {
      var c = 0;
      function f(row, i) {
         c += 1;
         expect(i).to.equal(c);
         expect(row).to.be.a('function');
         expect(row(1)).to.equal(dSet.get(i, 1));
         expect(row(2)).to.equal(dSet.get(i, 2));
         expect(row('c')).to.equal(dSet.get(i, 3));
      }
      dSet.eachRow(f);
      expect(c).to.equal(dSet.nrow);
   });
   it('eachCol', function() {
      var c = 0;
      function f(val, j, name) {
         c += 1;
         expect(j).to.equal(c);
         expect(name).to.equal(dSet.names(j));
         expect(val.toArray()).to.deep.equal(dSet.getVar(j).toArray());
      }
      dSet.eachCol(f);
      expect(c).to.equal(dSet.ncol);
   });
});
