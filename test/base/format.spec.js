var List  = require('../../index').List;
var Dataset  = require('../../index').Dataset;
var Variable  = require('../../index').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;

describe('Variable#toHTML', function() {
   it('generates correct tags', function() {
      var var1 = new Variable([1.2, 3.4, -5.2]).names(['a','b','c']);
      var var2 = Variable.tabulate(function(i) { return i*i; }, 0, 9);
      var s1 = var1.toHTML({withNames: true});
      var s2 = var2.toHTML({ncol: 3});
      var m1 = s1.match(/<tr.*?<\/tr>/gm);
      expect(m1.length).to.equal(3);
      var m2 = s2.match(/<tr.*?<\/tr>/gm);
      expect(m2.length).to.equal(4);
      m1.forEach(function(row) {
         expect(row.match(/<td.*?<\/td>/gm).length).to.equal(2);
      });
      m2.slice(0, 3).forEach(function(row) {
         expect(row.match(/<td.*?<\/td>/gm).length).to.equal(3);
      });

   })
});

describe('Variable#format', function() {
   it('creates fixed-point numbers with specified number of decimals', function() {
      var v = Variable.tabulate(function() { return 1 + Math.random(); }, 50);
      v.format({type: 'fixed', decimals: 6}).each(function(str) {
         expect(str).to.match(/^1\.\d{6}$/);
      });
      v.format({decimals: 6}).each(function(str) {
         expect(str).to.match(/^1\.\d{6}$/);
      });
      expect(new Variable([5, 2.501,,3.3]).format().get(3)).to.equal('NaN');
   });
   it('creates scientific notation with specified number of decimals', function() {
      var v = Variable.tabulate(function() { return 1 + Math.random(); }, 50);
      v.format({type: 'scientific', decimals: 6}).each(function(str) {
         expect(str).to.match(/^1\.\d{6}e+0$/);
      });
      v.map(function(x) { return x - 1; })
      .format({type: 'scientific', decimals: 6}).each(function(str) {
         expect(str).to.match(/^\d\.\d{6}e-1$/);
      });
   });
   it('keeps the names of the variable intact', function() {
      var v = new Variable([1.2, 3.4, -5.6]).names(['a','b','c']);
      expect(utils.isMissing(v.format().names())).to.be.false;
      expect(v.format().names().toArray()).to.deep.equal(v.names().toArray());
   });
});
