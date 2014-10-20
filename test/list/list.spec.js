var List  = require('../../index').List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('List construction', function() {
   it('takes no arguments', function() {
      var l = List();
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(0);
      var l = List([]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(0);
   });
   it('takes object', function() {
      var l = new List({ a: 4, b: 2 });
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(2);
      expect(l.get(1)).to.equal(4);
      expect(l.get("a")).to.equal(4);
      expect(l.get(2)).to.equal(2);
      expect(utils.isMissing(l.get("c"))).to.be.true;
      expect(utils.isMissing(l.get(3))).to.be.true;
      expect(utils.isMissing(l.get(0))).to.be.true;
   });
   it('takes array', function() {
      var l = new List([4, 3, 2, 1]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(4);
      expect(l.get()).to.deep.equal([4, 3, 2, 1]);
   });
   it('takes list of values', function() {
      var l = List([2, 4, 5, 6]);
      expect(l).to.be.instanceof(List);
      expect(l.length()).to.equal(4);
      expect(l.get()).to.deep.equal([2, 4, 5, 6]);
   });
});
describe('List names', function() {

});