
var Predicate = require('./../../../lib/core/predicates/predicates.js');
var _ = require('underscore');
var assert = require('assert');

describe("Verify search predicates [UNIT]", function () {

    it ('Should return correct AND predicate for two functions', function () {
        var firstPredicate = new Predicate(_.constant(true));
        var secondPredicate = new Predicate(_.constant(false));

        var resultPredicate = firstPredicate.and(secondPredicate);

        assert.equal(resultPredicate.fn(), false);
    });

    it ('Should return correct OR predicate for two functions', function () {
        var firstPredicate = new Predicate(_.constant(true));
        var secondPredicate = new Predicate(_.constant(false));

        var resultPredicate = firstPredicate.or(secondPredicate);

        assert.equal(resultPredicate.fn(), true);
    });

});