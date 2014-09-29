var Variable  = require('../../base/variable');
var expect = require('chai').expect;
var moment = require('moment');

var v1 = new Variable([2.12, -12.2, 3, undefined]);
var v2 = new Variable(['2.12', '-12.2','3']);
var v3 = new Variable(['2.12', '-12.2', ,'3'], { mode: 'string' });
var v4 = new Variable([true, false, , true]);
var v5 = new Variable(['23-10-2007', '22-09-2008'], { mode: 'date', format: 'DD-MM-YYYY' });
var v6 = new Variable(['A', 'A', 'B', 'D'], { mode: 'ord', levels: ['C', 'A', 'D', 'B'] });

describe('Variable get', function() {
   it('exists', function() {
      expect(Variable).to.respondTo('get');
      expect(v1.get(2)).to.equal(-12.2);
      expect(v1.get([1, 2])).to.deep.equal([2.12, -12.2]);
      expect(v1.get([1, 5, 2])).to.deep.equal([2.12, null, -12.2]);
      expect(v1.get(4)).to.not.exist;
      expect(v3.get(3)).to.not.exist;
      expect(v4.get(3)).to.not.exist;
      expect(v4.get(4)).to.equal(true);
   });
   it('returns null when out of bounds', function() {
      expect(v1.get(0)).to.not.exist;
      expect(v1.get(5)).to.not.exist;
   });
   it('works for factors and ordered', function() {
      expect(v2.get(0)).to.not.exist;
      expect(v2.get(5)).to.not.exist;
      expect(v2.get(3)).to.equal('3');
      expect(v6.get(2)).to.equal('A');
      expect(v6.get(3)).to.equal('B');
      expect(v6.get(4)).to.equal('D');
      expect(v6.get([2, 3])).to.deep.equal(['A', 'B']);
      expect(v6.get()).to.deep.equal(['A', 'A', 'B', 'D']);
   });
   it('works for datetime', function() {
      expect(moment(v5.get(1)).year()).to.equal(2007);
      expect(moment(v5.get(1)).month()).to.equal(9);
      expect(moment(v5.get(1)).date()).to.equal(23);
      expect(v5.get(0)).to.not.exist;
      expect(v5.get([1, 2])).to.exist;
      expect(v5.get([1, 2]).length).to.equal(2);
   });
});
describe('Variable set', function() {
   it('exists', function() {
      expect(Variable).to.respondTo('set');
      expect(function() { v1.set(1, 1.2); }).to.not.throw(Error);
      expect(v1.get(1)).to.equal(1.2);
      expect(v1.set([1, 2], [3.42, 3.41]));
      expect(v1.get(2)).to.equal(3.41);
      expect(v1.get(1)).to.equal(3.42);
   });
   it('works for factors and ordered', function() {
      expect(function() { v2.set(1, '3'); }).to.not.throw(Error);
      expect(v2.get(1)).to.equal('3');
   });
   it('works datetime', function() {
      expect(function() { v5.set([1, 2], '2003-02-22') }).to.not.throw(Error);
      expect(moment(v5.get(1)).format('YYYY-MM-DD')).to.equal('2003-02-22');
      expect(moment(v5.get(2)).format('YYYY-MM-DD')).to.equal('2003-02-22');
   });
});