var Variable  = require('../../base/variable');
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var moment = require('moment');

var vs = [
   new Variable([2.12, -12.2, 3, undefined]),
   new Variable(['2.12', '-12.2','3']),
   new Variable(['2.12', '-12.2', ,'3'], { mode: 'string' }),
   new Variable([true, false, , true]),
   new Variable(['23-10-2007', '22-09-2008'], { mode: 'date', format: 'DD-MM-YYYY' }),
   new Variable(['A', 'A', 'B', 'D'], { mode: 'ord', levels: ['C', 'A', 'D', 'B'] })
];

describe('Variable Conversion:', function() {
   it('asScalar', function() {
      vs.forEach(function(v) {
         expect(v).to.respondTo('asScalar');
         expect(v.asScalar().mode()).to.equal('scalar');
         expect(v.asScalar().length()).to.equal(v.length());
      });
      expect(vs[0].asScalar().get(2)).to.equal(-12.2);
      expect(vs[1].asScalar().get(2)).to.not.equal(-12.2);
      expect(vs[2].asScalar().get(2)).to.equal(-12.2);
      expect(vs[3].asScalar().get(2)).to.equal(0);
      expect(vs[5].asScalar().get(2)).to.equal(2);
      expect(utils.isMissing(vs[0].asScalar().get(4))).to.be.true;
      expect(utils.isMissing(vs[2].asScalar().get(3))).to.be.true;
      expect(utils.isMissing(vs[3].asScalar().get(3))).to.be.true;
   });
   it('asString', function() {
      vs.forEach(function(v) {
         expect(v).to.respondTo('asString');
         expect(v.asString().mode()).to.equal('string');
         expect(v.asString().length()).to.equal(v.length());
      });
      expect(vs[0].asString().get(2)).to.equal('-12.2');
      expect(vs[1].asString().get(2)).to.equal('-12.2');
      expect(vs[2].asString().get(2)).to.equal('-12.2');
      expect(vs[3].asString().get(2)).to.equal('false');
      expect(vs[5].asString().get(2)).to.equal('A');
      expect(utils.isMissing(vs[0].asScalar().get(4))).to.be.true;
      expect(utils.isMissing(vs[2].asScalar().get(3))).to.be.true;
      expect(utils.isMissing(vs[3].asScalar().get(3))).to.be.true;
   });
});
describe('Name labels', function() {
   var v = new Variable([2.12, -12.2, 3, undefined]);
   it('can be set via names(newValues)', function() {
      expect(v).to.respondTo('names');
      expect(function() { v.names(['A', 'B', 'C', 'X']); }).to.not.throw(Error);
   });
   it('can be gotten via names()', function() {
      var names = v.names();
      expect(names).to.be.instanceof(Variable.StringVar);
      expect(names.get()).to.deep.equal(['A', 'B', 'C', 'X']);
   });
   it('can be cleared via names(null/missing)', function() {
      expect(function() { v.names(null); }).to.not.throw(Error);
      expect(utils.isMissing(v.names())).to.be.ok;
      expect(utils.isMissing(v.names(['A', 'B', 'C', 'X']).names(utils.missing).names())).to.be.ok;
   });
});
