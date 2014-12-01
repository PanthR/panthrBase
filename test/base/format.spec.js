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
      var m1 = s1.match(/<tr.*<\/tr>/gm);
      expect(m1.length).to.equal(3);
      var m2 = s2.match(/<tr.*<\/tr>/gm);
      expect(m2.length).to.equal(4);
      m1.forEach(function(row) {
         expect(row.match(/<td.*?<\/td>/gm).length).to.equal(2);
      });
      m2.slice(0, 3).forEach(function(row) {
         expect(row.match(/<td.*?<\/td>/gm).length).to.equal(3);
      });

   })
});