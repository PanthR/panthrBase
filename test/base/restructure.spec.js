var List  = require('../../index').List;
var Dataset  = require('../../index').Dataset;
var Variable  = require('../../index').Variable;
var utils  = require('../../base/utils');
var expect = require('chai').expect;
describe('split', function() {
   var dSet;
   beforeEach(function() {
      dSet = new Dataset({ a: [1, 2, 3, 4, 5, 6, 7, 8],
                           b: [2, 4, 8, 16, 32, 64, 128, 256],
                           c: new Variable(['A', 'B', 'B', 'C', 'A', 'B', 'B', 'B'])
                        });
   });
   it('can be called with a List', function() {
      var L1 = dSet.split(new List({x: [1, 3, 5],
                                    y: new Variable([2, 5, 6]),
                                    z: []}));
      expect(L1).to.be.instanceof(List);
      expect(L1.names().toArray()).to.deep.equal(['x','y','z']);
      expect(L1.get('x')).to.be.instanceof(Dataset);
      expect(L1.get('x').nrow).to.equal(3);
      expect(L1.get('y').nrow).to.equal(3);
      expect(L1.get('x').ncol).to.equal(3);
      expect(L1.get('x').get(2,'b')).to.equal(dSet.get(3,2));
      expect(L1.get('z').nrow).to.equal(0);
      expect(L1.get('y').get(true, 2).toArray()).to.deep.equal([4, 32, 64]);
   });
   it('can be called with a factor variable', function() {
      var L1 = dSet.split(dSet.getVar('c'));
      expect(L1).to.be.instanceof(List);
      expect(L1.names().toArray()).to.deep.equal(['A','B','C']);
      expect(L1.get('A')).to.be.instanceof(Dataset);
      expect(L1.get('A').nrow).to.equal(2);
      expect(L1.get('B').nrow).to.equal(5);
      expect(L1.get('C').nrow).to.equal(1);
      expect(L1.get('A').ncol).to.equal(3);
      expect(L1.get('A').get(2,'b')).to.equal(32);
      expect(L1.get('B').get(true, 2).toArray()).to.deep.equal([4, 8, 64, 128, 256]);
      expect(L1.get('A').get(true, 3).toArray()).to.deep.equal(['A','A']);
      expect(L1.get('B').get(true, 3).toArray()).to.deep.equal(['B','B','B','B','B']);
      expect(L1.get('C').get(true, 3).toArray()).to.deep.equal(['C']);
   });
   it('can be called with a function', function() {
      var count = 0;
      var L1 = dSet.split(function(row, i) {
         count += 1;
         expect(i).to.equal(count);
         expect(row(2)).to.equal(dSet.get(i, 2));
         expect(row('c')).to.equal(dSet.get(i, 3));
         return row(3);
      });
      expect(count).to.equal(dSet.nrow);
      expect(L1).to.be.instanceof(List);
      expect(L1.names().toArray()).to.deep.equal(['A','B','C']);
      expect(L1.get('A')).to.be.instanceof(Dataset);
      expect(L1.get('A').nrow).to.equal(2);
      expect(L1.get('B').nrow).to.equal(5);
      expect(L1.get('C').nrow).to.equal(1);
      expect(L1.get('A').ncol).to.equal(3);
      expect(L1.get('A').get(2,'b')).to.equal(32);
      expect(L1.get('B').get(true, 2).toArray()).to.deep.equal([4, 8, 64, 128, 256]);
      expect(L1.get('A').get(true, 3).toArray()).to.deep.equal(['A','A']);
      expect(L1.get('B').get(true, 3).toArray()).to.deep.equal(['B','B','B','B','B']);
      expect(L1.get('C').get(true, 3).toArray()).to.deep.equal(['C']);
   });
});