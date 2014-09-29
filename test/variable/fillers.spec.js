var Variable  = require('../../base/variable');
var expect = require('chai').expect;

describe('Variables can be ', function() {
   it('resized', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0], {mode: 'Sc', name: 'niceName', label: 'l1'});
      var v2 = new Variable(['c', 'b', 'c', 'c', 'a']);
      expect(Variable).to.respondTo('resize');
      expect(v1.resize(7, true)).to.equal(v1);
      expect(v1.get()).to.deep.equal([1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5]);
      expect(v1.resize(10)).to.equal(v1);
      expect(v1.get()).to.deep.equal([
         1.2, 3.1, -2.5, 0, 1.2, 3.1, -2.5, null, null, null]);
      expect(v1.resize(4).get()).to.deep.equal([1.2, 3.1, -2.5, 0]);
      expect(v2.resize(7, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c', 'a', 'c', 'b']);
      expect(v2.resize(10, 42)).to.equal(v2);
      expect(v2.get()).to.deep.equal([
         'c', 'b', 'c', 'c', 'a', 'c', 'b', null, null, null]);
      expect(v2.resize(4, true)).to.equal(v2);
      expect(v2.get()).to.deep.equal(['c', 'b', 'c', 'c']);
   });
});
