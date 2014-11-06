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
      expect(utils.isMissing(dSet.names())).to.be.ok;
      expect(dSet.get(1).toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get(2).toArray()).to.deep.equal([5,6,7]);
   });
   it('accepts an object of variable-like things', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      expect(dSet).to.be.instanceof(Dataset);
      expect(dSet.length()).to.equal(2);
      expect(dSet.names().toArray()).to.deep.equal(['a', 'b']);
      expect(dSet.get('a').toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get('b').toArray()).to.deep.equal([5,6,7]);
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
      expect(dSet.get("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(dSet.get("b.g").toArray()).to.deep.equal([7,8,9]);
      var D = new Dataset(dSet);
      expect(D.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(D.get("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(D.get("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(D.get("b.g").toArray()).to.deep.equal([7,8,9]);
      var M = new Variable.Matrix([[1,2,3],[3,4,5],[7,8,9]]);
      D = new Dataset(M);
      expect(D.get(1).toArray()).to.deep.equal([1,2,3]);
      expect(D.get(2).toArray()).to.deep.equal([3,4,5]);
      expect(D.get(3).toArray()).to.deep.equal([7,8,9]);
      var vec = new Variable.Vector([3, 4, 5]);
      D = new Dataset(vec);
      expect(D.length()).to.equal(1);
      expect(D.get(1).toArray()).to.deep.equal([3,4,5]);
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
      expect(D.get(1).toArray()).to.deep.equal([1,2,3]);
      expect(D.get(2).toArray()).to.deep.equal([3,4,5]);
      expect(D.get(3).toArray()).to.deep.equal([7,8,9]);
      expect(D.get(4).toArray()).to.deep.equal([1,2,3]);
      expect(D.get(5).toArray()).to.deep.equal([4,4,4]);
      var vec1, vec2;
      vec1 = new Variable.Vector([2, 4, 6]);
      vec2 = new Variable.Vector([1, 2, 3]);
      D = new Dataset(vec1, vec2);
      expect(D.length()).to.equal(2);
      expect(D.get(1).toArray()).to.deep.equal([2, 4, 6]);
      expect(D.get(2).toArray()).to.deep.equal([1, 2, 3]);
      expect(utils.isMissing(D.names())).to.be.true;
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
      expect(dSet.get("a.c").toArray()).to.deep.equal([1,2,3]);
      expect(dSet.get("a.d.f").toArray()).to.deep.equal([3,4,5]);
      expect(dSet.get("b.g").toArray()).to.deep.equal([7,8,9]);
   });
   it('throws error for unequal-length variables', function() {
      expect(function() {new Dataset([1, 2, 3], [4, 5]);}).to.throw(Error);
   });
   it('clones any Variables which are provided', function() {
      var v = new Variable([6,7,8]).names(['a','b','c']);
      var D = new Dataset(v, v);
      // List.get does now clone
      expect(D.get(1)).to.not.equal(D.get(1));
      expect(D.get(1)).to.not.equal(D.get(2));
      D.get(1).set(2, 5);
      expect(D.get(2).get(2)).to.equal(7);
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
      expect(D.get(1)).to.not.equal(L.get(1));
      expect(D.get(1)).to.not.equal(D.get(4));
      D.get(1).set(3, 10);
      expect(D.get(4).get(3)).to.equal(3);
   });
});
describe("Dataset clone", function() {
   it('actually clones', function() {
      var dSet = new Dataset({ a: new Variable([1,2,3]), b: new Variable.Vector([5,6,7]) });
      var dSet2 = dSet.clone();
      expect(dSet2.nrow).to.equal(dSet.nrow);
      expect(dSet2.ncol).to.equal(dSet.ncol);
      expect(dSet2.get('b').toArray()).to.deep.equal(dSet.get(2).toArray());
      dSet2.set(2,2,Math.random());
      expect(dSet2.get(2,2)).to.not.equal(dSet.get(2,2));
   });
});