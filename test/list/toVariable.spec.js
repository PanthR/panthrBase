var Base = require('../../index');
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('toVariable', function() {
   var v1 = (new Variable([5, 4, 3, 0])).names(["a","b","c","d"]);
   var v2 = new Variable([2, 5, 8, 11]);
   var L1 = new List({one: v1, two: v1, three: v2});  // some named entries
   var L2 = new List({a: v2, b: v2, c: 5}); // all unnamed entries
   var L3 = new List([v1, v2, 5]);
   var M1 = L1.toVariable();
   var M2 = L2.toVariable();
   var M3 = L3.toVariable();
   it('returns a variable', function() {
      expect(M1).to.be.instanceof(Variable);
   });
   it('returns correct values and names', function() {
      expect(M1.get()).to.deep.equal([5, 4, 3, 0, 5, 4, 3, 0, 2, 5, 8, 11]);
      expect(M1.names().toArray()).to.deep.equal(["one.a","one.b","one.c","one.d"
         , "two.a","two.b","two.c","two.d","three.1","three.2","three.3","three.4"]);
      expect(M2.get()).to.deep.equal([2, 5, 8, 11, 2, 5, 8, 11, 5]);
      expect(M2.names().toArray()).to.deep.equal(["a.1","a.2","a.3","a.4",
         "b.1","b.2","b.3","b.4", "c"]);
      expect(M3.get()).to.deep.equal([5,4,3,0,2,5,8,11,5]);
      expect(utils.areEqualArrays(M3.names().toArray(), ["a","b","c","d",
         utils.missing,utils.missing,utils.missing,utils.missing,
         utils.missing]
         )).to.be.true;
   });
   it('doesn\'t change the elements in the list itself', function() {
      expect(v1.names().toArray()).to.deep.equal(["a","b","c","d"]);
      expect(utils.isMissing(v2.names())).to.be.true;
   });
   it('works with nested lists', function() {
      var L4 = new List({ m: L1, g: L1 });
      var M4 = L4.toVariable();
      expect(M4.get()).to.deep.equal(M1.get().concat(M1.get()));
      expect(M4.names().toArray()).to.deep.equal(
         M1.names().toArray().map(function(s) { return 'm.' + s; }).concat(
            M1.names().toArray().map(function(s) { return 'g.' + s; })
         )
      );
   });
   it('works with arrays and vectors', function() {
      var L4 = new List({ a: [4, 1, 2], b: new Variable.Vector([5, 6, 3]) });
      var M4 = L4.toVariable();
      expect(M4.get()).to.deep.equal([4, 1, 2, 5, 6, 3]);
      expect(M4.names().toArray()).to.deep.equal(
         ["a.1","a.2","a.3","b.1","b.2","b.3"]
      );
   });
});