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
   it('factor', function() {
      var arr = ['b', 'a', 'a', , 'c', 'b'];
      var v1 = new Variable(arr,
         {mode: 'factor', name: 'niceName', label: 'l1'});
      var v2 = new Variable(new Variable.Vector(['b', 'a', 'a', , 'c', 'b']));
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.FactorVar);
      expect(v1.values.toArray()).to.deep.equal([2, 1, 1, null, 3, 2]);
      expect(v1.mode()).to.equal('factor');
      expect(v2).to.be.instanceof(Variable);
      expect(v2).to.be.instanceof(Variable.FactorVar);
      expect(v2.values.toArray()).to.deep.equal([2, 1, 1, null, 3, 2]);
      expect(v2.mode()).to.equal('factor');
   });
   it('ordinal', function() {
      var arr = ['b', 'a', 'a', 'c', 'b'];
      var levels = ['c', 'b', 'a']
      var v1 = new Variable(arr,
         {mode: 'ordinal', name: 'niceName', label: 'l1', levels: levels});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.OrdinalVar);
      expect(v1.values.toArray()).to.deep.equal([2, 3, 3, 1, 2]);
      expect(v1.mode()).to.equal('ordinal');
      expect(Variable.ordinal(['b', 'a', 'a'], 'aLabel').get()).to.deep.equal(['b', 'a', 'a']);
      expect(Variable.ordinal(['b', 'a', 'a'], 'aLabel').levels()).to.deep.equal(['a', 'b']);
      expect(Variable.ordinal(['b', 'a', 'a'], 'aLabel').label).to.equal('aLabel');
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a']).get()).to.deep.equal(['b', 'a', 'a']);
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a']).levels()).to.deep.equal(['b', 'a']);
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a']).label).to.equal('');
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a'], 'aLabel').get()).to.deep.equal(['b', 'a', 'a']);
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a'], 'aLabel').levels()).to.deep.equal(['b', 'a']);
      expect(Variable.ordinal(['b', 'a', 'a'], ['b', 'a'], 'aLabel').label).to.equal('aLabel');
   });
   it('dateTime', function() {
      var arr = ["01-25-2001", "01-25-2002", "01-26-2001"];
      var v1 = new Variable(arr,
         {mode: 'dateTime', name: 'niceName', label: 'l1', format: "MM-DD-YYYY"});
      expect(v1).to.be.instanceof(Variable);
      //TODO need to test the values once we have get and set methods
      expect(v1).to.be.instanceof(Variable.DateTimeVar);
      expect(v1.mode()).to.equal('dateTime');
   });
   it('created without an explicit mode being given', function() {
      expect(new Variable([2.3, -123, 23])).to.be.instanceof(Variable.ScalarVar);
      expect(new Variable(["2.3", "-123", "23"])).to.be.instanceof(Variable.FactorVar);
      expect(new Variable([, , null])).to.be.instanceof(Variable.ScalarVar);
      expect(new Variable([, , true])).to.be.instanceof(Variable.LogicalVar);
      expect(new Variable([, , 23])).to.be.instanceof(Variable.ScalarVar);
      expect(new Variable([, , "23"])).to.be.instanceof(Variable.FactorVar);
   });
});