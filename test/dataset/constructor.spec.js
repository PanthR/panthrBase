var Base = require('../../index');
var Dataset  = Base.Dataset;
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('Dataset constructor', function() {
   it('accepts an array of variable-like things', function() {
      var dSet = new Dataset([[1,2,3], [5,6,7]]);
      expect(dSet).to.be.instanceof(Dataset);
      expect(dSet.length()).to.equal(2);
      expect(dSet.getVar(1).toArray()).to.deep.equal([1,2,3]);
      expect(dSet.getVar(2).toArray()).to.deep.equal([5,6,7]);
   });
   it('accepts an object of variable-like things', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      expect(dSet).to.be.instanceof(Dataset);
      expect(dSet.length()).to.equal(2);
      expect(dSet.names().toArray()).to.deep.equal(['a', 'b']);
      expect(dSet.getVar('a').toArray()).to.deep.equal([1,2,3]);
      expect(dSet.getVar('b').toArray()).to.deep.equal([5,6,7]);
   });
   it('accepts a single List, Dataset, Matrix, or Vector / mult. args', function() {
      var L;
      L = new List({ a: new List({
                        c: new Variable([1,2,3]),
                        d: new List({
                           f: new Variable([3,4,5])
                        })
                     }),
                     b: new List({
                        g: new Variable([7,8,9]).names(["A", "B", "C"])
                     })
                  });
      var dSet = new Dataset(L);
      expect(dSet.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(dSet.getVar("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(dSet.getVar("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(dSet.getVar("b.g").toArray()).to.deep.equal([7,8,9]);
      var D = new Dataset(dSet);
      expect(D.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(D.getVar("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(D.getVar("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(D.getVar("b.g").toArray()).to.deep.equal([7,8,9]);
      var M = new Variable.Matrix([[1,2,3],[3,4,5],[7,8,9]]);
      D = new Dataset(M);
      expect(D.getVar(1).toArray()).to.deep.equal([1,2,3]);
      expect(D.getVar(2).toArray()).to.deep.equal([3,4,5]);
      expect(D.getVar(3).toArray()).to.deep.equal([7,8,9]);
      var vec = new Variable.Vector([3, 4, 5]);
      D = new Dataset(vec);
      expect(D.length()).to.equal(1);
      expect(D.getVar(1).toArray()).to.deep.equal([3,4,5]);
      L = new List({ a: new List({
                        c: new Variable([1,2,3]),
                        d: new List({
                           f: new Variable([3,4,5])
                        })
                     }),
                     b: new List({
                        g: new Variable([7,8,9]).names(["A", "B", "C"])
                     })
                  });
      D = new Dataset(L,new List({x: [1,2,3], y: [4,4,4]}));
      expect(D.length()).to.equal(5);
      expect(D.names().toArray()).to.deep.equal(
         ["a.c", "a.d.f", "b.g","x", "y"]);
      expect(D.getVar(1).toArray()).to.deep.equal([1,2,3]);
      expect(D.getVar(2).toArray()).to.deep.equal([3,4,5]);
      expect(D.getVar(3).toArray()).to.deep.equal([7,8,9]);
      expect(D.getVar(4).toArray()).to.deep.equal([1,2,3]);
      expect(D.getVar(5).toArray()).to.deep.equal([4,4,4]);
      var vec1, vec2;
      vec1 = new Variable.Vector([2, 4, 6]);
      vec2 = new Variable.Vector([1, 2, 3]);
      D = new Dataset(vec1, vec2);
      expect(D.length()).to.equal(2);
      expect(D.getVar(1).toArray()).to.deep.equal([2, 4, 6]);
      expect(D.getVar(2).toArray()).to.deep.equal([1, 2, 3]);
   });
   it('accepts a nested list of variable-like things', function() {
      var L;
      L = new List({ a: new List({
                        c: new Variable([1,2,3]),
                        d: new List({
                           f: new Variable([3,4,5])
                        })
                     }),
                     b: new List({
                        g: new Variable([7,8,9]).names(["A", "B", "C"])
                     })
                  });
      var dSet = new Dataset([L]);
      expect(dSet.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(dSet.getVar("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(dSet.getVar("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(dSet.getVar("b.g").toArray()).to.deep.equal([7,8,9]);
   });
   it('throws error for unequal-length variables', function() {
      expect(function() {new Dataset([1, 2, 3], [4, 5]);}).to.throw(Error);
   });
   it('clones any Variables which are provided', function() {
      var v = new Variable([6,7,8]).names(['a','b','c']);
      var D = new Dataset(v, v);
      // List.get does now clone
      expect(D.getVar(1)).to.not.equal(D.getVar(1));
      expect(D.getVar(1)).to.not.equal(D.getVar(2));
      D.getVar(1).set(2, 5);
      expect(D.getVar(2).get(2)).to.equal(7);
      var L;
      L = new List({ a: new List({
                        c: new Variable([1,2,3]),
                        d: new List({
                           f: new Variable([3,4,5])
                        })
                     }),
                     b: new List({
                        g: new Variable([7,8,9]).names(["A", "B", "C"])
                     })
                  });
      D = new Dataset(L, L);
      expect(D.length()).to.equal(6);
      expect(D.getVar(1)).to.not.equal(L.get(1));
      expect(D.getVar(1)).to.not.equal(D.getVar(4));
      D.getVar(1).set(3, 10);
      expect(D.getVar(4).get(3)).to.equal(3);
   });
});
describe("Dataset clone", function() {
   it('actually clones', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      var dSet2 = dSet.clone();
      expect(dSet2.nrow).to.equal(dSet.nrow);
      expect(dSet2.ncol).to.equal(dSet.ncol);
      expect(dSet2.getVar('b').toArray()).to.deep.equal(dSet.getVar(2).toArray());
      dSet2.set(2,2,Math.random());
      expect(dSet2.get(2,2)).to.not.equal(dSet.get(2,2));
   });
});
describe("Dataset names", function() {
   it('preserved if possible', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      expect(dSet.names().toArray()).to.deep.equal(['a', 'b']);
      expect(dSet.appendCols('c', Math.random).names().toArray()).to.deep.equal(['a', 'b', 'c']);
   });
   it('sanitized on creation', function() {
      var dSet = new Dataset({ 'a.b': new Variable([1,2,3]),
                                 a: new List({ b: new Variable.Vector([5,6,7]) }) })
                        .appendCols(Math.random)
                        .appendCols('a.b', Math.random);
      expect(dSet.names().toArray()).to.deep.equal(['a.b', 'a.b.1', 'X1', 'a.b.2']);
   });
   it('sanitized on calls to names', function() {
      var dSet = new Dataset(new Variable.Matrix(Math.random, { nrow: 3, ncol: 6 }));
      expect(dSet.names().toArray()).to.deep.equal(["X1","X2","X3","X4","X5","X6"]);
      expect(dSet.names(["a","a","a","a","a","a"]).names().toArray())
                .to.deep.equal(["a", "a.1","a.2","a.3","a.4","a.5"]);
      expect(dSet.names(["a","b","b","a","a.1","a"]).names().toArray())
                .to.deep.equal(["a", "b","b.1","a.1","a.1.1","a.2"]);
   });
   it('sanitized on appendCols', function() {
      var dSet = new Dataset({ 'a.b': new Variable([1,2,3]),
                                 a: new List({ b: new Variable.Vector([5,6,7]) }) })
                        .appendCols(['a', 'a'], Variable.Matrix(Math.random, { nrow: 3, ncol: 2 }))
                        .appendCols(Variable.Matrix(Math.random, { nrow: 3, ncol: 2 }));
      expect(dSet.names().toArray()).to.deep.equal(['a.b', 'a.b.1', 'a', 'a.1', 'X1', 'X2']);
   });
});
