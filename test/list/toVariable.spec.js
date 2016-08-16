var Base = require('../../index');
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('toVariable', function() {
   var v1 = (new Variable([5, 4, 3, 0])).names(["a","b","c","d"]);
   var v2 = new Variable([2, 5, 8, 11]);
   var L1 = new List({one: v1, two: v1, three: v2});  // some named entries
   var L2 = new List({a: v2, b: v2, c: 5}); // all unnamed entries
   var L3 = new List([v1, v2, 5]);
   var M1 = L1.toVariable();
   var M2 = L2.toVariable();
   var M3 = L3.toVariable();
   it('returns a variable', function() {
      expect(M1).to.be.instanceof(Variable);
   });
   it('returns correct values and names', function() {
      expect(M1.get()).to.deep.equal([5, 4, 3, 0, 5, 4, 3, 0, 2, 5, 8, 11]);
      expect(M1.names().toArray()).to.deep.equal(["one.a","one.b","one.c","one.d"
         , "two.a","two.b","two.c","two.d","three.1","three.2","three.3","three.4"]);
      expect(M2.get()).to.deep.equal([2, 5, 8, 11, 2, 5, 8, 11, 5]);
      expect(M2.names().toArray()).to.deep.equal(["a.1","a.2","a.3","a.4",
         "b.1","b.2","b.3","b.4", "c"]);
      expect(M3.get()).to.deep.equal([5,4,3,0,2,5,8,11,5]);
      expect(utils.areEqualArrays(M3.names().toArray(), ["a","b","c","d",
         utils.missing,utils.missing,utils.missing,utils.missing,
         utils.missing]
         )).to.be.true;
   });
   it('doesn\'t change the elements in the list itself', function() {
      expect(v1.names().toArray()).to.deep.equal(["a","b","c","d"]);
      expect(utils.isMissing(v2.names())).to.be.true;
   });
   it('works with nested lists', function() {
      var L4 = new List({ m: L1, g: L1 });
      var M4 = L4.toVariable();
      expect(M4.get()).to.deep.equal(M1.get().concat(M1.get()));
      expect(M4.names().toArray()).to.deep.equal(
         M1.names().toArray().map(function(s) { return 'm.' + s; }).concat(
            M1.names().toArray().map(function(s) { return 'g.' + s; })
         )
      );
   });
   it('works with arrays and vectors', function() {
      var L4 = new List({ a: [4, 1, 2], b: new Variable.Vector([5, 6, 3]) });
      var M4 = L4.toVariable();
      expect(M4.get()).to.deep.equal([4, 1, 2, 5, 6, 3]);
      expect(M4.names().toArray()).to.deep.equal(
         ["a.1","a.2","a.3","b.1","b.2","b.3"]
      );
   });
});
describe('unnest', function() {
   var L;
   beforeEach(function() {
      L = new List({ a: new List({
                        c: new Variable([1,2,3]),
                        d: new List({
                           f: new Variable([3,4,5])
                        })
                     }),
                     b: new List({
                        g: new Variable([1,2,3]).names(["A", "B", "C"])
                     })
                  });
   });
   it('changes nothing when level 0', function() {
      L.unnest(0);
      expect(L.names().toArray()).to.deep.equal(["a", "b"]);
      expect(L.get("a").names().toArray()).to.deep.equal(["c", "d"]);
      expect(L.get("a").get("d").names().toArray()).to.deep.equal(["f"]);
      expect(L.get("b").get("g").names().toArray()).to.deep.equal(["A", "B", "C"]);
      expect(L.get("b").get("g").get()).to.deep.equal([1, 2, 3]);
      expect(L.get("a").get("d").get("f").get()).to.deep.equal([3, 4, 5]);
   });
   it('unravels top level when level = 1', function() {
      L.unnest(1);
      expect(L.names().toArray()).to.deep.equal(["a.c", "a.d", "b.g"]);
      expect(L.get("a.d").names().toArray()).to.deep.equal(["f"]);
      expect(L.get("b.g").names().toArray()).to.deep.equal(["A", "B", "C"]);
      expect(L.get("b.g").get()).to.deep.equal([1, 2, 3]);
      expect(L.get("a.d").get("f").get()).to.deep.equal([3, 4, 5]);
      expect(L.get("a.c").get()).to.deep.equal([1, 2, 3]);
   });
   it('unravels more levels when level > 1', function() {
      L.unnest(2);
      expect(L.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(utils.isMissing(L.get("a.d.f").names())).to.be.ok;
      expect(L.get("b.g").names().toArray()).to.deep.equal(["A", "B", "C"]);
      expect(L.get("b.g").get()).to.deep.equal([1, 2, 3]);
      expect(L.get("a.d.f").get()).to.deep.equal([3, 4, 5]);
      expect(L.get("a.c").get()).to.deep.equal([1, 2, 3]);
   });
   it('higher than available level is ok', function() {
      L.unnest(4);
      expect(L.names().toArray()).to.deep.equal(["a.c", "a.d.f", "b.g"]);
      expect(utils.isMissing(L.get("a.d.f").names())).to.be.ok;
      expect(L.get("b.g").names().toArray()).to.deep.equal(["A", "B", "C"]);
      expect(L.get("b.g").get()).to.deep.equal([1, 2, 3]);
      expect(L.get("a.d.f").get()).to.deep.equal([3, 4, 5]);
      expect(L.get("a.c").get()).to.deep.equal([1, 2, 3]);
   });
   it('works with an array of lists', function() {
      var newList = new List([new List({a: [1,2,3], b: [4,5,6]}),
                              new List({x: [7,8,9]})]);
      expect(newList.unnest(Infinity).names().toArray()).to.deep.equal(['a','b','x']);
   });
});
describe('List#clone', function() {
   it('top-level variables are cloned', function() {
      var l1 = new List({ a: new Variable([1,2,3]), b: new Variable(['a', 'b', 'c']) });
      var l2 = l1.clone();
      expect(l2.get('a')).to.not.equal(l1.get('a'));
      l2.get('a').set(2, 4);
      expect(l1.get('a').get(2)).to.not.equal(4);
   });
   it('lists within lists are cloned', function() {
      var l1 = new List({ a: new List([new Variable([1,2,3]), 56]), b: new Variable(['a', 'b', 'c']) });
      var l2 = l1.clone();
      expect(l2.get('a').get(1)).to.not.equal(l1.get('a').get(1));
      expect(l2.get('a').get(2)).to.equal(l1.get('a').get(2));
      expect(utils.isMissing(l2.get('a').names())).to.be.true;
   });
});

describe('concat', function() {
   var v1 = new Variable([3, 5, 8]);
   var v2 = new Variable([true, true, false]);

   it('returns correct variable if all elements are 1-dim', function() {
      var l1 = new List({ a: v1, b: v2 });
      expect(l1.concat()).to.be.an.instanceof(Variable);
      expect(l1.concat().toArray()).to.deep.equal([3, 5, 8, 1, 1, 0]);
   });
   it('returns a list if not all elements are 1-dim', function() {
      var l1 = new List({ a: v1, b: new List({ c: v2 }) });
      var l2 = new List({ a: v1, b: function() {} });

      expect(l1.concat()).to.be.an.instanceof(List);
      expect(l1.get('a')).to.equal(v1);
      expect(l1.get('b').get('c')).to.equal(v2);
      expect(l1.length()).to.equal(2);

      expect(l2.concat()).to.be.an.instanceof(List);
      expect(l2.concat(true)).to.be.an.instanceof(List);
   });
   it('unnests when it should', function() {
      var l1 = new List({ a: v1, b: new List({ c: v2 }) });
      var l2 = l1.concat(true);
      expect(l2).to.be.an.instanceof(Variable);
      expect(l2.toArray()).to.deep.equal([3, 5, 8, 1, 1, 0]);
   });
   it('returns an empty list when called on an empty list', function() {
      expect((new List()).concat()).to.be.an.instanceof(List);
      expect((new List()).concat().length()).to.equal(0);
   });
});
