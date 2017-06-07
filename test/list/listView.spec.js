var Base = require('../../index');
var List  = Base.List;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
var Variable = Base.Variable;

describe('List View', function() {
   it('can be constructed to view into another list', function() {
      var list = new List({ a: 4, b: 5, c: 8 });
      var listView = new List.View(list, [2, 1, 1, 3]);
      expect(listView).to.be.instanceOf(List.View);
      expect(listView.target).to.equal(list);
   });
   it('accesses the original list\'s names', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1, 3]);

      expect(listView.names().toArray()).to.deep.equal(['b', 'a', 'a', 'c']);
      expect(listView.names(4)).to.equal('c');
      listView.names(utils.missing);
      expect(utils.isMissing(list.names(1))).to.equal(true);
      expect(utils.isMissing(list.names(2))).to.equal(true);
      expect(utils.isMissing(list.names(3))).to.equal(true);
      expect(list.names(4)).to.equal('k');
      listView.names(['d', 'e', 'f', 'g']);
      expect(list.names().toArray()).to.deep.equal(['f', 'd', 'g', 'k']);
      listView.names(2, 'h');
      expect(list.names().toArray()).to.deep.equal(['h', 'd', 'g', 'k']);
   });
   it('has length given by the indices, not the target', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1]);

      expect(listView.length()).to.equal(3);
   });
   it('accesses the original list\'s values on "get"', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1]);

      expect(listView.get(1)).to.equal(list.get(2));
      expect(listView.get(3)).to.equal(list.get(1));
      expect(listView.get('a')).to.equal(4);
      expect(listView.get('b')).to.equal(5);
      expect(utils.isMissing(listView.get('c'))).to.equal(true);
      expect(listView.get()).to.deep.equal([5, 4, 4]);
   });
   it('alters the original list\'s values on "set"', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1]);

      listView.set(1, 10);
      expect(list.get(2)).to.equal(10);
      listView.set('b', 12);
      expect(list.get('b')).to.equal(12);
      listView.set({ a: 13, b: 3 });
      expect(list.get('a')).to.equal(13);
      expect(list.get('b')).to.equal(3);
      expect(function() { listView.set([2, 3]); }).to.throw(Error);
   });
   it('iterates over only its entries on "each"', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1]);

      var counter = 0;
      function iterate(value, index, name) {
         counter += 1;
         expect(listView.get(index)).to.equal(value);
         expect(listView.names(index)).to.equal(name);
         expect(list.get(name)).to.equal(value);
      }
      listView.each(iterate);
      expect(counter).to.equal(listView.length());
   });
   it('iterates over only its entries on "reduce"', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: 10 });
      var listView = new List.View(list, [2, 1, 1]);

      var sum = listView.reduce(function(acc, val) {
         return acc + val;
      }, 0);

      expect(sum).to.equal(5 + 4 + 4);
   });
   it('produces a concrete list on "clone"', function() {
      var list = new List({ a: 4, b: 5, c: 8, k: new List({ b: 2 }) });
      var listView = new List.View(list, [2, 1, 1, 4]);
      var newList = listView.clone();

      expect(newList).to.not.equal(list);
      expect(newList).to.be.instanceOf(List);
      expect(newList).to.not.equal(listView);
      expect(newList.length()).to.equal(4);
      expect(newList.names().toArray()).to.deep.equal(['b', 'a', 'a', 'k']);
      expect(newList.get(1)).to.equal(5);
      expect(newList.get(2)).to.equal(4);
      expect(newList.get(3)).to.equal(4);
      expect(newList.get(4)).to.not.equal(list.get(4));
      expect(newList.get(4).get('b')).to.equal(list.get(4).get('b'));
      newList.set(1, 10);
      expect(list.get(2)).to.equal(5);
      expect(newList.get(1)).to.equal(10);
   });
});
