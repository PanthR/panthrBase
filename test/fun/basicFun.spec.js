var fun  = require('../../index').fun;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('function constructors', function() {
	it('interpolate', function() {
		expect(fun).itself.to.respondTo('interpolate');
		var f = fun.interpolate([1, 2], [4, 8]);
		expect(utils.isMissing(f(-1)));
		expect(f(1)).to.equal(4);
		expect(f(2)).to.equal(8);
		expect(f(1.5)).to.equal(6);
		expect(f(1.1)).to.equal(4 * 0.9 + 8 * 0.1);
	});
});