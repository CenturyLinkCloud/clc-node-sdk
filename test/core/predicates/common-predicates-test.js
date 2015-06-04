var Predicate = require('./../../../lib/core/predicates/predicates.js');
var _ = require('underscore');
var assert = require('assert');

describe('Verify common predicates [UNIT]', function () {

    describe ('Equal predicate', function () {

        var data = [{
            desc: 'Should reject values that not equal to source',
            src: 'DE1ALTDWEB101', matchTo: 'de1altdweb101', expected: false
        }, {
            desc: 'Should pass value that equal to source',
            src: 'DE1ALTDWEB101', matchTo: 'DE1ALTDWEB101', expected: true
        }, {
            desc: 'Should return true when both objects is null or both undefined',
            src: null, matchTo: null, expected: true
        }, {
            desc: 'Should return false when objects has different type',
            src: '1', matchTo: 1, expected: false
        }];

        data.map(function (data) {
            it (data.desc, function () {
                var predicate = Predicate.equalTo(data.matchTo);

                var result = predicate.fn(data.src);

                assert.equal(result, data.expected);
            });
        });

    });

    describe ('Contains predicate', function () {

        var data = [{
            desc: 'Should match value that contains in source',
            src: 'DE1ALTDWEB101', matchTo: 'web', expected: true
        }, {
            desc: 'Should do not match value that is not in source',
            src: 'DE1ALTDWEB101', matchTo: 'altr', expected: false
        }, {
            desc: 'Should return false when both objects is null or undefined',
            src: null, matchTo: undefined, expected: false
        }, {
            desc: 'Should return false when any arguments is not a string',
            src: 1, matchTo: '1', expected: false
        }];

        data.map(function (data) {
            it (data.desc, function () {
                var predicate = Predicate.contains(data.matchTo);

                var result = predicate.fn(data.src);

                assert.equal(result, data.expected);
            });
        });

    });

});