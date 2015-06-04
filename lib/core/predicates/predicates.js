
var _ = require('underscore');
var BasePredicate = require('./predicate.js');
var CommonPredicates = require('./common-predicates.js');

module.exports = BasePredicate;

BasePredicate.equalTo = function (value) {
    return new CommonPredicates.EqualPredicate(value);
};

BasePredicate.contains = function (value, property) {
    return new CommonPredicates.ContainsPredicate(value, property);
};

BasePredicate.containsValue = function (value, property) {
    return new CommonPredicates.ArrayContainsPredicate(value, property);
};

BasePredicate.extractFromCriteria = function(criteria) {
    var predicate = BasePredicate.alwaysTrue();
    if (criteria.id) {
        predicate = predicate.and(BasePredicate.containsValue(criteria.id, "id"));
    }
    if (criteria.name) {
        predicate = predicate.and(BasePredicate.containsValue(criteria.name, "name"));
    }
    if (criteria.nameContains) {
        predicate = predicate.and(BasePredicate.contains(criteria.nameContains, "name"));
    }
    if (criteria.where) {
        if (typeof criteria.where !== "function") {
            throw new Error("Criteria.where property must be a function");
        }
        predicate = predicate.and(new BasePredicate(criteria.where));
    }

    return predicate;
};
