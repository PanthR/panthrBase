var Variable  = require('../../base/variable');
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('Variables can be ', function() {
   it('scalar', function() {
      var v1 = new Variable([1.2, 3.1, -2.5, 0],
         { mode: 'Sc', label: 'l1' });
      var v2 = new Variable([1.2, 3.1, -2.5, 0],
         { mode: 'Sc' });
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.ScalarVar);
      expect(v2).to.be.instanceof(Variable);
      expect(v2).to.be.instanceof(Variable.ScalarVar);
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
         {mode: 'log', label: 'l1'});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.LogicalVar);
      expect(v1.values.toArray()).to.deep.equal(arr);
      expect(v1.mode()).to.equal('logical');
   });
   it('string', function() {
      var arr = ['true', 'false', 'true', 'truthy'];
      var v1 = new Variable(arr,
         {mode: 'string', label: 'l1'});
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.StringVar);
      expect(v1.values.toArray()).to.deep.equal(arr);
      expect(v1.mode()).to.equal('string');
   });
   it('factor', function() {
      var arr = ['b', 'a', 'a', , 'c', 'b'];
      var v1 = new Variable(arr,
         {mode: 'factor', label: 'l1'});
      var v2 = new Variable(new Variable.Vector(['b', 'a', 'a', , 'c', 'b']));
      expect(v1).to.be.instanceof(Variable);
      expect(v1).to.be.instanceof(Variable.FactorVar);
      expect(utils.areEqualArrays(v1.values.toArray(), [2, 1, 1, utils.missing, 3, 2])).to.be.true;
      expect(v1.mode()).to.equal('factor');
      expect(v2).to.be.instanceof(Variable);
      expect(v2).to.be.instanceof(Variable.FactorVar);
      expect(utils.areEqualArrays(v2.values.toArray(), [2, 1, 1, utils.missing, 3, 2])).to.be.true;
      expect(v2.mode()).to.equal('factor');
      // Setting custom levels
      v1 = new Variable(['a', 'a', 'b'], { mode: 'factor', levels: ['b'] });
      expect(v1).to.be.instanceof(Variable.FactorVar);
      expect(utils.isMissing(v1.get(1))).to.be.ok;
      expect(v1.get(3)).to.equal('b');
      v1 = new Variable(['a', 'a', 'b'], { mode: 'factor', levels: ['c', 'b', 'a'] });
      expect(v1).to.be.instanceof(Variable.FactorVar);
      expect(v1.get(3)).to.equal('b');
      expect(v1.get(2)).to.equal('a');
      expect(v1.values.toArray()).to.deep.equal([3, 3, 2]);
   });
   it('ordinal', function() {
      var arr = ['b', 'a', 'a', 'c', 'b'];
      var levels = ['c', 'b', 'a']
      var v1 = new Variable(arr,
         {mode: 'ordinal', label: 'l1', levels: levels});
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
         {mode: 'dateTime', label: 'l1', format: "MM-DD-YYYY"});
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
   it('created from a function', function() {
      var V1, V2;
      V1 = new Variable(function(i) { return i*i; }, {length: 4});
      expect(V1.get()).to.deep.equal([1, 4, 9, 16]);
      expect(V1.mode()).to.equal('scalar');
      V2 = new Variable(function(i) { return i%2 === 1 ? "a" : "b"}, {length: 4});
      expect(V2.get()).to.deep.equal(['a','b','a','b']);
      expect(V2.mode()).to.equal('factor');
      // fails with no length specified
      expect(function() { return new Variable(function(i) { return i*i; })})
         .to.throw(Error);
   });
});
