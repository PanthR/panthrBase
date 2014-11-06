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
         expect(dSet.get(1)).to.be.instanceof(Variable);
         expect(dSet.get(1)).to.not.equal(dSet.get(1));
         expect(dSet.get(1).get()).to.deep.equal([1,2,3]);
         expect(dSet.get("a").get()).to.deep.equal([1,2,3]);
         expect(dSet.get("c").get()).to.deep.equal(['A', 'B', 'B']);
         expect(dSet.get([1,2], 1)).to.be.instanceof(Variable);
         expect(dSet.get([1,2], "a").get()).to.deep.equal([1,2]);
      });
      it('returns a dataset when provided array of columns', function() {
         expect(dSet.get(["a", "c"]).length()).to.equal(2);
         expect(dSet.get(["a", "c"]).names().toArray()).to.deep.equal(["a","c"]);
         expect(dSet.get(["a", "c"]).get(1).get()).to.deep.equal([1,2,3]);
         expect(dSet.get([1, "a", "c"]).length()).to.equal(3);
         expect(dSet.get([1,2], [1, "a", "c"]).get(1).get()).to.deep.equal([1,2]);
      });
      it('allows logical variable for row/col specification', function() {
         expect(dSet.get(new Variable.logical([true, false, true]),true))
            .to.be.instanceof(Dataset);
         expect(dSet.get(new Variable.logical([true, false, true]),true).nRow()).to.equal(2);
         expect(dSet.get([true, false, true],true).nRow()).to.equal(2);
         expect(dSet.get(new Variable.logical([true, false, true]),true).nCol()).to.equal(3);
         expect(dSet.get(new Variable.logical([true, false, true]),true).get(1).get())
               .to.deep.equal([1,3]);
         expect(dSet.get(true, new Variable.logical([true, false, true])))
            .to.be.instanceof(Dataset);
         expect(dSet.get(true, new Variable.logical([true, false, true])).names().toArray())
            .to.deep.equal(["a", "c"]);
         expect(dSet.get(true, [true, false, true]).names().toArray())
            .to.deep.equal(["a", "c"]);
         expect(dSet.get(true, new Variable.logical([true, false, true])).get(2).get())
            .to.deep.equal(["A", "B", "B"]);
      });
      it('allows a function for column specification', function() {
         var c = 0;
         var newSet = dSet.get(function(colName, j) {
            c += 1;
            expect(j).to.equal(c);
            expect(dSet.names(j)).to.equal(colName);
            return j === 2;
         });
         expect(c).to.equal(dSet.length());
         expect(newSet.length()).to.equal(1);
         expect(newSet.names(1)).to.equal("b");
         expect(newSet.get(1).get()).to.deep.equal([5,6,7]);
      });
      it('allows a function for row specification', function() {
         var c = 0;
         var newSet = dSet.get(function(row, i) {
            c += 1;
            expect(i).to.equal(c);
            expect(row(1)).to.equal(dSet.get(1).get(i));
            expect(row("a")).to.equal(dSet.get(1).get(i));
            expect(row(3)).to.equal(dSet.get(3).get(i));
            return i % 2 === 1;
         }, true);
         expect(c).to.equal(dSet.nRow());
         expect(newSet.nCol()).to.equal(3);
         expect(newSet.nRow()).to.equal(2);
         expect(newSet.get(2).get()).to.deep.equal([5,7]);
      });
      it('allows vectors for both row and column', function() {
         var v = new Variable.Vector([1,3]);
         var newSet = dSet.get(v, v);
         expect(newSet.nRow()).to.equal(2);
         expect(newSet.nCol()).to.equal(2);
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
         expect(dSet.set('a', new Variable(['e', 'e', 'f']))
            .get('a').toArray()).to.deep.equal(['e', 'e', 'f']);
         expect(dSet.set('a', new Variable([4, 5, 6]))
            .get('a').toArray()).to.deep.equal([4, 5, 6]);
         expect(dSet.set(1,[14, 15, 16]).get('a').toArray()).to.deep.equal([14,15,16]);
         expect(dSet.set(2, function(i) { return i*i; }).get('b').toArray()).to.deep.equal([1, 4, 9]);
         expect(dSet.set(2, new Variable(['x','y','z']))
            .get('b').toArray()).to.deep.equal(['x','y','z']);
         // can't set two columns with one Variable
         expect(function() {dSet.set([1, 2], new Variable([1, 2, 3])); }).to.throw(Error);
         expect(function() {dSet.set(1, new Variable([1, 2, 3, 4])); }).to.throw(Error);
         expect(function() {dSet.set(1, [1, 2, 3, 4]); }).to.throw(Error);
      });
      it('can set part of a column', function() {
         expect(dSet.set([2, 3], 'a', [5, 6]).get('a').toArray()).to.deep.equal([1,5,6]);
         expect(dSet.set([false, true, true], 2, [15, 16]).get('b').toArray())
            .to.deep.equal([5,15,16]);
         expect(dSet.set([2, 3], 2, function(i) { return i*i; }).get('b').toArray())
            .to.deep.equal([5, 4, 9]);
         expect(function() {dSet.set(2, 1, new Variable([1, 2, 3])); }).to.throw(Error);
         expect(function() {dSet.set([1, 2], 1, [2, 3, 4]); }).to.throw(Error);
         expect(function() {dSet.set([1, 2], [1, 2], [1, 2, 3, 4]); }).to.throw(Error);
      });
      it('can set a 2-dimensional selection', function() {
         expect(dSet.set(2, true, dSet.get(1, true)).get(1).toArray()).to.deep.equal([1,1,3]);
         expect(dSet.get(2).toArray()).to.deep.equal([5,5,7]);
         expect(dSet.get(3).toArray()).to.deep.equal(['A','A','B']);
         expect(dSet.set([1,2],[1,2],function(i,j) { return i + 3*j; }).get(1).toArray())
            .to.deep.equal([4,5,3]);
         expect(dSet.get(2).toArray()).to.deep.equal([7, 8, 7]);
         expect(dSet.get(3).toArray()).to.deep.equal(['A','A','B']);
         expect(function() { return dSet.set([2, 3], true, dSet.get(1, true)); } ).to.throw(Error);
         expect(function() 
            { return dSet.set(2, true, dSet.get(1, [true,true,false])); } )
            .to.throw(Error);
         expect(function() { return dSet.set(1, dSet.get(1, true)); } ).to.throw(Error);
         expect(dSet.set(2, [1,2], dSet.get(1, [1,2])).get(1).toArray()).to.deep.equal([4,4,3]);
         expect(dSet.set(2, [1,2], dSet.get(1, [1,2])).get(2).toArray())
            .to.deep.equal([7,7,7]);
      });
   });
})