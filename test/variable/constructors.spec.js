var Variable  = require('../../base/variable');
var expect = require('chai').expect;

describe('Variables can be ', function() {
   it('scalar', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0],
         {mode: 'Sc', name: 'niceName', label: 'l1'});
      var v2 = new Variable([1.2, 3.1, -2.5, 0],
         {mode: 'Sc'});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.ScalarVar);
      expect(v2).to.be.instanceof(Variable);
      expect(v2).to.be.instanceof(Variable.ScalarVar);
      expect(v1.name).to.equal('niceName');
      expect(v2.name[v2.name.length - 1]).to.equal('1');
      expect(v1.label).to.equal('l1');
      expect(v2.label).to.equal('');
      expect(v2.values).to.be.instanceof(Variable.Vector);
      expect(v2.values.toArray()).to.deep.equal([1.2, 3.1, -2.5, 0]);
      expect(v2.mode()).to.equal("scalar");
      expect(v2.mode()).to.not.equal("logical");
   });
   it('logical', function() {
      var arr = [true, false, true, true];
      var v1 = new Variable(arr,
         {mode: 'log', name: 'niceName', label: 'l1'});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.LogicalVar);
      expect(v1.values.toArray()).to.deep.equal(arr);
      expect(v1.mode()).to.equal('logical');
   });
   it('string', function() {
      var arr = ['true', 'false', 'true', 'truthy'];
      var v1 = new Variable(arr,
         {mode: 'string', name: 'niceName', label: 'l1'});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.StringVar);
      expect(v1.values.toArray()).to.deep.equal(arr);
      expect(v1.mode()).to.equal('string');
   });
   it('created without an explicit mode being given', function() {

   });
});