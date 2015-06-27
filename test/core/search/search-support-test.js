
var SearchSupport = require('./../../../lib/core/search/search-support.js');
var assert = require('assert');

describe('SearchSupport mixin [UNIT]', function () {

    describe('._toSearchCriteria', function () {
        it('Should create criteria from array of criterias', function () {
            var args = [{id: 1}, {id: 2}, {id: 3}];

            var result = new SearchSupport()._toCriteriaObject(args);

            assert.deepEqual(result, {or: [
                {or: [
                    {or: [
                        {},
                        {id: 1}
                    ]},
                    {id: 2}
                ]},
                {id:3}
            ]});
        });

        it('Should create criteria from nested arrays of criterias', function () {
            var args = [[{id: 1}, {id: 2}]];

            var result = new SearchSupport()._toCriteriaObject(args);

            assert.deepEqual(result, {or: [
                {or: [
                    {},
                    {id: 1}
                ]},
                {id: 2}
            ]});
        });

    });

});