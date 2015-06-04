
var _ = require('underscore');
var BasePredicate = require('./predicate.js');
var CommonPredicates = require('./common-predicates.js');

module.exports = BasePredicate;

BasePredicate.equalTo = function (value) {
    return new CommonPredicates.EqualPredicate(value);
};

BasePredicate.contains = function (value) {
    return new CommonPredicates.ContainsPredicate(value);
};
