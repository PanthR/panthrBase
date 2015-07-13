var Variable  = require('../../index').Variable;
var stats  = require('../../index').stats;
var List      = require('../../index').List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

function randomNum(max) {
   return Math.random() * max;
}

function randomInt(max) {
   return Math.floor(randomNum(max));
}

var epsilon = .00001;

describe('available distributions: ', function() {
   describe('uniform', function() {
      var arr = ['runif', 'dunif', 'punif', 'qunif'];
      it('[rdpq]unif exist and are functions', function() {
         arr.forEach(function(key) {
            expect(stats).to.have.ownProperty(key);
            expect(stats[key]).to.be.a('function');
         });
      });
      it('[rdpq]unif return a scalar Variable of correct length', function() {
         var len;
         len = randomInt(100);
         [
            stats.runif(len),
            stats.dunif(Variable.tabulate(function() { return 1; }, 1, len)),
            stats.punif(Variable.tabulate(function() { return 1; }, 1, len)),
            stats.qunif(Variable.tabulate(function() { return 1; }, 1, len))
         ].forEach(function(v) {
            expect(v).to.be.an.instanceOf(Variable);
            expect(v.length()).to.equal(len);
            expect(v.mode()).to.equal('scalar');
         });
      });
      it('parameters `a` and `b` default to 0 and 1, resp.', function() {
         stats.runif(100).each(function(val) {
            expect(val >= 0 && val <= 1).to.be.true;
         });
         expect(stats.dunif([-0.1, 0.1, 0.9, 1.1]).toArray()).to.deep.equal(
            [0,1,1,0]);
         expect(stats.punif([-0.1, 0, 0.5, 1, 1.1]).toArray()).to.deep.equal(
            [0,0,.5,1,1]);
         expect(stats.qunif([0, 0.5, 1]).toArray()).to.deep.equal(
            [0, 0.5, 1]);
      });
      it('[rdpq]unif parameters are read properly', function() {
         var a, b, x, v, ps;
         a = randomNum(100);
         b = a + randomNum(20);
         x = new Variable(function() {
            return 2 * a - b + randomNum(3 * (b - a));
         }, { length: 100 });
         // runif
         stats.runif(100, { min: a, max: b }).each(function(val) {
            expect(val >= a && val <= b).to.be.true;
         });
         // dunif
         v = stats.dunif(x, { min: a, max: b });
         v.each(function(val, i) {
            expect(val).to.equal(
               x.get(i) >= a && x.get(i) <= b ? 1 / (b - a) : 0
            );
         });
         stats.dunif(x, { min: a, max: b, log: true })
           .each(function(val, i) {
               expect(Math.exp(val)).to.be.closeTo(v.get(i), epsilon);
         });
         // punif
         v = stats.punif(x, { min: a, max: b });
         v.each(function(val, i) {
            var xval = x.get(i);
            if (xval <= a) { expect(val).to.equal(0); }
            else if (xval >= b) { expect(val).to.equal(1); }
            else { expect(val).to.be.within(0, 1); }
         });
         stats.punif(x, { min: a, max: b, lowerTail: false })
              .each(function(val, i) {
            expect(val).to.be.closeTo(1 - v.get(i), epsilon);
         });
         stats.punif(x, { min: a, max: b, log: true })
             .each(function(val, i) {
           expect(Math.exp(val)).to.be.closeTo(v.get(i), epsilon);
         });
         // qunif -- inverse CDF
         ps = stats.runif(100);
         v = stats.qunif(ps, { min: a, max: b });
         v.each(function(val, i) {
            expect(val).to.be.within(a, b);
         });
         stats.qunif(ps.map(function(p) { return 1 - p; }),
                     { min: a, max: b, lowerTail: false })
            .each(function(val, i) {
               expect(val).to.be.closeTo(v.get(i), epsilon);
            });
         stats.qunif(ps.map(function(p) { return Math.log(p); }),
                     { min: a, max: b, log: true })
            .each(function(val, i) {
               expect(val).to.be.closeTo(v.get(i), epsilon);
            });
      });
      // TODO make an `it` for whether p and q are inverse functions
      // TODO make an `it` for out-of-range input
   });
});