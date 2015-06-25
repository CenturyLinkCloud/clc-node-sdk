var _ = require('underscore');
var BasePredicate = require('./predicate.js');
var CommonPredicates = require('./common-predicates.js');

module.exports = BasePredicate;

BasePredicate.equalTo = function (value, property) {
    return new CommonPredicates.EqualPredicate(value, property);
};

BasePredicate.contains = function (value, property) {
    return new CommonPredicates.ContainsPredicate(value, property);
};

BasePredicate.equalToAnyOf = function (value, property) {
    return new CommonPredicates.ArrayContainsPredicate(value, property);
};

BasePredicate.extractValue = function (data, path) {
    return CommonPredicates.extractValue(data, path);
};

BasePredicate.compareIgnoreCase = function (expected, actual) {
    return CommonPredicates.compareIgnoreCase(expected, actual);
};

BasePredicate.extract = function(predicate, path) {
    return new CommonPredicates.ExtractPredicate(predicate, path);
};
