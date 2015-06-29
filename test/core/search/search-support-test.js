
var SearchSupport = require('./../../../lib/core/search/search-support.js');
var assert = require('assert');

describe('SearchSupport mixin [UNIT]', function () {

    describe('._searchCriteriaFrom', function () {
        it('Should create criteria from array of criterias', function () {
            var args = [{id: 1}, {id: 2}, {id: 3}];

            var result = new SearchSupport()._searchCriteriaFrom(args);

            assert.deepEqual(result, {or: [
                {or: [
                    {id: 1},
                    {id: 2}
                ]},
                {id: 3}
            ]});
        });

        it('Should create criteria from nested arrays of criterias', function () {
            var args = [[{id: 1}, {id: 2}]];

            var result = new SearchSupport()._searchCriteriaFrom(args);

            assert.deepEqual(result, {or: [
                {id: 1},
                {id: 2}
            ]});
        });

        it('Should throw exception when leaf is not a criteria', function () {
            var args = [[{id: 1}, 2]];

            assert.throws(function () {
                new SearchSupport()._searchCriteriaFrom(args);
            });
        });

        it('Should create criteria from array with single item', function () {
            var args = [[{id: 1}]];

            var result = new SearchSupport()._searchCriteriaFrom(args);

            assert.deepEqual(result, {id: 1});
        });

        it('Should just return received object when it contains just a one criteria', function () {
            var args = [{id: 1}];

            var result = new SearchSupport()._searchCriteriaFrom(args);

            assert.deepEqual(result, {id: 1});
        });

    });

});