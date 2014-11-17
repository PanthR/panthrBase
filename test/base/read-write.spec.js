var List  = require('../../index').List;
var Dataset  = require('../../index').Dataset;
var Variable  = require('../../index').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('Variable read', function() {
   it('string result with mode specified', function() {
      expect(Variable).itself.to.respondTo('read');
      var v1 = Variable.read('"foo",bar,"foo,bar"', 'string');
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal(['foo', 'bar', 'foo,bar']);
      var v1 = Variable.read('"fo\\"o",ba\'r,"foo\\,b\\\\ar"', 'string');
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal(['fo"o', 'ba\'r', 'foo,b\\ar']);
   });
   it('scalar result with mode specified', function() {
      var v1 = Variable.read('2.34,1.23e-2,"4.52e1"', 'scalar');
      expect(v1.length()).to.equal(3);
      expect(v1.toArray()).to.deep.equal([2.34, 1.23e-2, 4.52e1]);
   });
   it('infers mode "properly"', function() {
      expect(Variable.read('-2.34,1e-2,"+4.52e1", -.3423').mode()).to.equal('scalar');
      expect(Variable.read('2.34,1.23e-2.223,"4.52e1"').mode()).to.equal('factor');
      expect(Variable.read('2.34,1.23e,"4.52e1"').mode()).to.equal('factor');
      expect(Variable.read('-.').mode()).to.equal('factor');
      expect(Variable.read('-1.,12,+12,-12').mode()).to.equal('scalar');
   });
});
