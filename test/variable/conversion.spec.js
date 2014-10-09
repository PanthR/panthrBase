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