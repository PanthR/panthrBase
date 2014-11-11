var Base = require('../../index');
var Dataset  = Base.Dataset;
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('Dataset', function() {
   describe('get', function() {
      var dSet;
      beforeEach(function() {
         dSet = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
      });
      it('returns a cloned variable when provided a single column', function() {
         expect(dSet.getVar(1)).to.be.instanceof(Variable);
         expect(dSet.getVar(1)).to.not.equal(dSet.getVar(1));
         expect(dSet.getVar(1).get()).to.deep.equal([1,2,3]);
         expect(dSet.getVar("a").get()).to.deep.equal([1,2,3]);
         expect(dSet.getVar("c").get()).to.deep.equal(['A', 'B', 'B']);
         expect(dSet.get([1,2], 1)).to.be.instanceof(Variable);
         expect(dSet.get([1,2], "a").get()).to.deep.equal([1,2]);
      });
      it('returns a dataset when provided array of columns', function() {
         expect(dSet.get(true, ["a", "c"]).length()).to.equal(2);
         expect(dSet.get(true, ["a", "c"]).names().toArray()).to.deep.equal(["a","c"]);
         expect(dSet.get(true, ["a", "c"]).getVar(1).get()).to.deep.equal([1,2,3]);
         expect(dSet.get(true, [1, "a", "c"]).length()).to.equal(3);
         expect(dSet.get([1,2], [1, "a", "c"]).getVar(1).get()).to.deep.equal([1,2]);
      });
      it('allows logical variable for row/col specification', function() {
         expect(dSet.get(new Variable.logical([true, false, true]),true))
            .to.be.instanceof(Dataset);
         expect(dSet.get(new Variable.logical([true, false, true]),true).nrow).to.equal(2);
         expect(dSet.get([true, false, true],true).nrow).to.equal(2);
         expect(dSet.get(new Variable.logical([true, false, true]),true).ncol).to.equal(3);
         expect(dSet.get(new Variable.logical([true, false, true]),true).getVar(1).get())
               .to.deep.equal([1,3]);
         expect(dSet.get(true, new Variable.logical([true, false, true])))
            .to.be.instanceof(Dataset);
         expect(dSet.get(true, new Variable.logical([true, false, true])).names().toArray())
            .to.deep.equal(["a", "c"]);
         expect(dSet.get(true, [true, false, true]).names().toArray())
            .to.deep.equal(["a", "c"]);
         expect(dSet.get(true, new Variable.logical([true, false, true])).getVar(2).get())
            .to.deep.equal(["A", "B", "B"]);
      });
      it('allows a function for column specification', function() {
         var c = 0;
         var newSet = dSet.get(true, function(colName, j) {
            c += 1;
            expect(j).to.equal(c);
            expect(dSet.names(j)).to.equal(colName);
            return j === 2;
         });
         expect(c).to.equal(dSet.length());
         expect(newSet.length()).to.equal(1);
         expect(newSet.names(1)).to.equal("b");
         expect(newSet.getVar(1).get()).to.deep.equal([5,6,7]);
      });
      it('allows a function for row specification', function() {
         var c = 0;
         var newSet = dSet.get(function(row, i) {
            c += 1;
            expect(i).to.equal(c);
            expect(row(1)).to.equal(dSet.getVar(1).get(i));
            expect(row("a")).to.equal(dSet.getVar(1).get(i));
            expect(row(3)).to.equal(dSet.getVar(3).get(i));
            return i % 2 === 1;
         }, true);
         expect(c).to.equal(dSet.nrow);
         expect(newSet.ncol).to.equal(3);
         expect(newSet.nrow).to.equal(2);
         expect(newSet.getVar(2).get()).to.deep.equal([5,7]);
      });
      it('allows vectors for both row and column', function() {
         var v = new Variable.Vector([1,3]);
         var newSet = dSet.get(v, v);
         expect(newSet.nrow).to.equal(2);
         expect(newSet.ncol).to.equal(2);
         expect(newSet.get(2,1)).to.equal(3);
         expect(newSet.get(2,2)).to.equal("B");
      });
   })
   describe('set', function() {
      var dSet;
      beforeEach(function() {
         dSet = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
      });
      it('can set a single value', function() {
         expect(dSet.set(2, 'a', 10).get(2, 'a')).to.equal(10);
         expect(dSet.set(2, 1, function(i, j) { return i + (2*j); })
            .get(2, 'a')).to.equal(4);
         expect(dSet.set(2, 3, function(i, j) { return 1; }).get(2, 3)).to.equal('A');
         expect(function() {dSet.set(4, 1, 2); }).to.throw(Error);
      });
      it('can set a whole column', function() {
         expect(dSet.setVar('a', new Variable(['e', 'e', 'f']))
            .getVar('a').toArray()).to.deep.equal(['e', 'e', 'f']);
         expect(dSet.setVar('a', new Variable([4, 5, 6]))
            .getVar('a').toArray()).to.deep.equal([4, 5, 6]);
         expect(dSet.setVar(1,[14, 15, 16]).getVar('a').toArray()).to.deep.equal([14,15,16]);
         expect(dSet.set(true, 2, function(i) { return i*i; }).getVar('b').toArray()).to.deep.equal([1, 4, 9]);
         expect(dSet.setVar(2, new Variable(['x','y','z']))
            .getVar('b').toArray()).to.deep.equal(['x','y','z']);
         // can't set two columns with one Variable
         expect(function() {dSet.set(true, [1, 2], new Variable([1, 2, 3])); }).to.throw(Error);
         expect(function() {dSet.setVar(1, new Variable([1, 2, 3, 4])); }).to.throw(Error);
         expect(function() {dSet.set(true, 1, new Variable([1, 2, 3, 4])); }).to.throw(Error);
         expect(function() {dSet.setVar(1, [1, 2, 3, 4]); }).to.throw(Error);
         expect(function() {dSet.set(true, 1, [1, 2, 3, 4]); }).to.throw(Error);
      });
      it('can set part of a column', function() {
         expect(dSet.set([2, 3], 'a', [5, 6]).getVar('a').toArray()).to.deep.equal([1,5,6]);
         expect(dSet.set([false, true, true], 2, [15, 16]).getVar('b').toArray())
            .to.deep.equal([5,15,16]);
         expect(dSet.set([2, 3], 2, function(i) { return i*i; }).getVar('b').toArray())
            .to.deep.equal([5, 4, 9]);
         expect(function() {dSet.set(2, 1, new Variable([1, 2, 3])); }).to.throw(Error);
         expect(function() {dSet.set([1, 2], 1, [2, 3, 4]); }).to.throw(Error);
         expect(function() {dSet.set([1, 2], [1, 2], [1, 2, 3, 4]); }).to.throw(Error);
      });
      it('can set a 2-dimensional selection', function() {
         expect(dSet.set(2, true, dSet.get(1, true)).getVar(1).toArray()).to.deep.equal([1,1,3]);
         expect(dSet.getVar(2).toArray()).to.deep.equal([5,5,7]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','A','B']);
         expect(dSet.set([1,2],[1,2],function(i,j) { return i + 3*j; }).getVar(1).toArray())
            .to.deep.equal([4,5,3]);
         expect(dSet.getVar(2).toArray()).to.deep.equal([7, 8, 7]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','A','B']);
         expect(function() { return dSet.set([2, 3], true, dSet.get(1, true)); } ).to.throw(Error);
         expect(function()
            { return dSet.set(2, true, dSet.get(1, [true,true,false])); } )
            .to.throw(Error);
         expect(function() { return dSet.set(1, dSet.get(1, true)); } ).to.throw(Error);
         expect(dSet.set(2, [1,2], dSet.get(1, [1,2])).getVar(1).toArray()).to.deep.equal([4,4,3]);
         expect(dSet.set(2, [1,2], dSet.get(1, [1,2])).getVar(2).toArray())
            .to.deep.equal([7,7,7]);
      });
      it('errors when setting out of current dims', function() {
         expect(function() { dSet.set(4, [1,4,5]); }).to.throw(Error);
         expect(function() { dSet.set(4, true, [1,4,5]); }).to.throw(Error);
         expect(function() { dSet.set(4, 1, 2); }).to.throw(Error);
         expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3]);
         expect(dSet.getVar(2).toArray()).to.deep.equal([5,6,7]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A', 'B', 'B']);
      });
   });
   describe('appendRows', function() {
      var dSet, dSet2;
      beforeEach(function() {
         dSet = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
         dSet2 = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
      });
      it('by another dataset/matrix', function() {
         dSet.appendRows(dSet2);
         expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3,1,2,3]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','B','B','A','B','B']);
         dSet.appendRows(new Variable.Matrix([[4,4], [1,1], ['A', 'A']]));
         expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3,1,2,3,4,4]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','B','B','A','B','B','A','A']);
         expect(function() { dSet.appendRows(new Variable.Matrix([[4,4], ['A', 'A']])); })
            .to.throw(Error);
      });
      it('by a vector/array', function() {
         dSet.appendRows(new Variable.Vector([2,1,'A']));
         expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3,2]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','B','B','A']);
         dSet.appendRows([4,4,'B']);
         expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3,2,4]);
         expect(dSet.getVar(3).toArray()).to.deep.equal(['A','B','B','A','B']);
         expect(function() { dSet.appendRows([4,4,'A',2]); }).to.throw(Error);
         expect(function() { dSet.appendRows([4,4]); }).to.throw(Error);
         expect(dSet.nrow).to.equal(5);
         expect(dSet.getVar(1).length()).to.equal(5);
      });
      it('by single value/function', function() {
         dSet.appendRows(2, utils.missing);
         expect(dSet.nrow).to.equal(5);
         expect(utils.isMissing(dSet.get(4, 2))).to.be.true;
         expect(utils.isMissing(dSet.get(5, 3))).to.be.true;
         dSet.appendRows(2, function(i, j) { return dSet2.get(i, j); });
         expect(dSet.nrow).to.equal(7);
         expect(dSet.get(6, 2)).to.equal(dSet2.get(1, 2));
         expect(dSet.get(7, 3)).to.equal(dSet2.get(2, 3));
      });
   });
   describe('appendCols', function() {
      var dSet, dSet2;
      beforeEach(function() {
         dSet = new Dataset({ a: [1,2,3], b: [5,6,7], c: new Variable(['A', 'B', 'B']) });
         dSet2 = new Dataset({ x: [5, 10, 15], y: [8, 9, 10], z: new Variable(['A', 'B', 'B']) });
      });
      it('with matrix/dataset', function() {
         expect(dSet.appendCols(dSet2).ncol).to.equal(6);
         expect(dSet.names().toArray()).to.deep.equal(['a','b','c','x','y','z']);
         expect(dSet.getVar(4).toArray()).to.deep.equal([5, 10, 15]);
         expect(dSet.getVar('y').toArray()).to.deep.equal([8, 9, 10]);
         expect(dSet.getVar(6).toArray()).to.deep.equal(['A','B','B']);
         expect(dSet.getVar(2).toArray()).to.deep.equal([5,6,7]);
         var M = new Variable.Matrix(Math.random, {nrow: 3, ncol: 2});
         expect(dSet.appendCols(M).ncol).to.equal(8);
         expect(dSet.getVar(7).toArray()).to.deep.equal(M.colView(1).toArray());
         M = new Variable.Matrix(Math.random, {nrow: 2, ncol: 2});
         expect(function() { dSet.appendCols(M);}).to.throw(Error);
      });
      it('with vector/array/variable', function() {
         expect(dSet.appendCols(dSet2.getVar(1)).ncol).to.equal(4);
         expect(dSet.getVar(4).toArray()).to.deep.equal([5, 10, 15]);
         expect(dSet.appendCols(dSet2.getVar(2).values).ncol).to.equal(5);
         expect(dSet.getVar(5).toArray()).to.deep.equal([8,9,10]);
         expect(dSet.appendCols(dSet2.getVar(2).toArray()).ncol).to.equal(6);
         expect(dSet.getVar(5).toArray()).to.deep.equal([8,9,10]);
         expect(function() { dSet.appendCols([1, 2, 3, 4]); }).to.throw(Error);
      });
      it('with List of variables to append', function() {
         // list of list of one variable -- works?
         expect(dSet.appendCols(new List({a: new List({b: new Variable([0, 1, 2])})}))
            .ncol).to.equal(4);
         expect(dSet.names(4)).to.equal('a.b');
         expect(dSet.getVar(4).toArray()).to.deep.equal([0, 1, 2]);
      });
      it('with a function', function() {
         expect(dSet.appendCols(function(i) { return i*i; }).ncol).to.equal(4);
         expect(dSet.getVar(4).toArray()).to.deep.equal([1, 4, 9]);
      });
      it('can be used with supplied names for new columns', function() {
         expect(dSet.appendCols('X', function(i) { return i*i; }).ncol).to.equal(4);
         expect(dSet.getVar(4).toArray()).to.deep.equal([1, 4, 9]);
         expect(dSet.names(4)).to.equal('X');
         var M = new Variable.Matrix(Math.random, {nrow: 3, ncol: 2});
         expect(dSet.appendCols(['p','q','extra'],M).ncol).to.equal(6);
         expect(dSet.names().toArray()).to.deep.equal(['a','b','c','X','p','q']);
      });
   });
})