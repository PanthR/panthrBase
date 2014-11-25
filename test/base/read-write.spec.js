var List  = require('../../index').List;
var Dataset  = require('../../index').Dataset;
var Variable  = require('../../index').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var fs = require('fs');  // filesystem
var path = require('path');

function readFile(file) {
   return fs.readFileSync(path.join(__dirname, 'datafiles', file), {encoding: 'utf8'});
}

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
describe('Variable write', function() {
   it('plays nicely with variable read (basic examples)', function() {
      var vars = [];
      vars.push(new Variable([1.3, -2.5, 17, 5]));
      vars.push(new Variable(['b', 'a', 'a', 'c']));
      vars.forEach(function(var1) {
         var var2 = Variable.read(var1.write());
         expect(var1.toArray()).to.deep.equal(var2.toArray());
      });
   });
   it('deals with weird characters', function() {
      var vars = [];
      vars.push(new Variable(['x','\'y','\nz','z']));
      vars.push(new Variable(['b', 'a\t', 'a', 'c']));
      vars.forEach(function(var1) {
         var var2 = Variable.read(var1.write());
         expect(var1.toArray()).to.deep.equal(var2.toArray());
         var2 = Variable.read(var1.write({quote: true}));
         expect(var1.toArray()).to.deep.equal(var2.toArray());
      });
   });
      it('can use spaces or tabs for separators', function() {
      var vars = [];
      vars.push(new Variable(['x','\'y','\nz','z']));
      vars.push(new Variable(['b', 'a\t', 'a', 'c']));
      vars.forEach(function(var1) {
         var var2 = Variable.read(var1.write({quote: true, sep: ' '}));
         expect(var1.toArray()).to.deep.equal(var2.toArray());
         var2 = Variable.read(var1.write({quote: true, sep: '\t'}));
         expect(var1.toArray()).to.deep.equal(var2.toArray());
      });
   });
});
describe('Dataset read', function() {
   it('reads standard csv format', function() {
      var d = Dataset.read(readFile('sampleData.csv'), {header: true});
      expect(d.ncol).to.equal(2);
      expect(d.nrow).to.equal(7);
      expect(d.names().toArray()).to.deep.equal(['Name', 'Age']);
      expect(utils.areEqualArrays(
         d.getVar(1).toArray(),
         ['Jo;e', "Be\"tty", "S\"am", "Ka\tr''en", 'Andy', NaN, "Zac\nh"]
      )).to.be.true;
      expect(utils.areEqualArrays(
         d.getVar(2).toArray(),
         [10.005, -15.32, -23E-5, 4.4e10, +.17, 22., NaN]
      )).to.be.true;
   });
   it('reads standard csv2 format', function() {
      var d = Dataset.read(readFile('sampleData.csv2'), {header: true});
      expect(d.ncol).to.equal(2);
      expect(d.nrow).to.equal(7);
      expect(d.names().toArray()).to.deep.equal(['Name', 'Age']);
      expect(utils.areEqualArrays(
         d.getVar(1).toArray(),
         ['Jo,e', "Be\"tty", "S\"am", "Ka\tr''en", 'Andy', NaN, "Zac\nh"]
      )).to.be.true;
      expect(utils.areEqualArrays(
         d.getVar(2).toArray(),
         [10.005, -15.32, -23E-5, 4.4e10, +.17, 22., NaN]
      )).to.be.true;
   });
   it('reads standard tab-separated format', function() {
      var d = Dataset.read(readFile('sampleDataTabs.txt'), {header: true});
      expect(d.ncol).to.equal(2);
      expect(d.nrow).to.equal(7);
      expect(d.names().toArray()).to.deep.equal(['Name', 'Age']);
      expect(utils.areEqualArrays(
         d.getVar(1).toArray(),
         ['Jo,e', "Be\"tty", "S\"am", "Ka\tr''en", 'Andy', NaN, "Zac\nh"]
      )).to.be.true;
      expect(utils.areEqualArrays(
         d.getVar(2).toArray(),
         [10.005, -15.32, -23E-5, 4.4e10, +.17, 22., NaN]
      )).to.be.true;
   });
   it('reads standard space-separated format', function() {
      var d = Dataset.read(readFile('sampleDataSpaces.txt'), {header: true});
      expect(d.ncol).to.equal(2);
      expect(d.nrow).to.equal(7);
      expect(d.names().toArray()).to.deep.equal(['Name', 'Age']);
      expect(utils.areEqualArrays(
         d.getVar(1).toArray(),
         ['Jo,e', "Be\"tty", "S\"am", "Ka\tr''en", 'Andy', NaN, "Zac\nh"]
      )).to.be.true;
      expect(utils.areEqualArrays(
         d.getVar(2).toArray(),
         [10.005, -15.32, -23E-5, 4.4e10, +.17, 22., NaN]
      )).to.be.true;
   });
});
describe('Dataset write', function() {
   it('agrees with read', function() {
      var dSet1 = Dataset.read(readFile('sampleData.csv'), { header: true });
      var dSet2;
      ['\t', ',', ';'].forEach(function(sep) {
         dSet2 = Dataset.read(dSet1.write({ quote: true, sep: sep }), { header: true });
         expect(dSet1.names().toArray()).to.deep.equal(dSet2.names().toArray());
         dSet1.each(function(col, j) {
            expect(utils.areEqualArrays(col.toArray(), dSet2.getVar(j).toArray())).to.be.ok;
         });
      });
      dSet1 = dSet1.deleteRows(dSet1.nrow);
      dSet2 = Dataset.read(dSet1.write({ quote: false, sep: ',' }), { header: true });
      expect(dSet1.names().toArray()).to.deep.equal(dSet2.names().toArray());
      dSet1.each(function(col, j) {
         expect(utils.areEqualArrays(col.toArray(), dSet2.getVar(j).toArray())).to.be.ok;
      });
   });
});
