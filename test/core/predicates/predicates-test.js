
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

    it ('Should return constant predicate that always return true', function () {
        var predicate = Predicate.alwaysTrue();

        assert.equal(predicate.fn(), true);
    });

    it ('Should return correct AND predicate for multiple atomic leaf predicates', function () {
        var firstPredicate = new Predicate(_.constant(true));
        var secondPredicate = new Predicate(_.constant(false));
        var thirdPredicate = new Predicate(_.constant(false));

        var resultPredicate = Predicate.and(firstPredicate, secondPredicate, thirdPredicate);

        assert.equal(resultPredicate.fn(), false);
    });

    it ('Should return correct OR predicate for multiple atomic leaf predicates', function () {
        var firstPredicate = new Predicate(_.constant(true));
        var secondPredicate = new Predicate(_.constant(false));
        var thirdPredicate = new Predicate(_.constant(false));

        var resultPredicate = Predicate.and(firstPredicate, secondPredicate, thirdPredicate);

        assert.equal(resultPredicate.fn(), false);
    });

});