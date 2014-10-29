var Base = require('../../index');
var Dataset  = Base.Dataset;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('Dataset constructor', function() {
   it('accepts an array of variable-like things', function() {
      var dSet = new Dataset([[1,2,3], [5,6,7]]);
      expect(dSet).to.be.instanceof(Dataset);
      expect(dSet.length()).to.equal(2);
      expect(utils.isMissing(dSet.names())).to.be.ok;
      expect(dSet.get(1).toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get(2).toArray()).to.deep.equal([5,6,7]);
   });
   it('accepts an object of variable-like things', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      expect(dSet).to.be.instanceof(Dataset);
      expect(dSet.length()).to.equal(2);
      expect(dSet.names().toArray()).to.deep.equal(['a', 'b']);
      expect(dSet.get('a').toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get('b').toArray()).to.deep.equal([5,6,7]);
   });
   it('accepts a nested list of variable-like things', function() {

   });
   it('throws for error for unequal-length variables', function() {

   });
});