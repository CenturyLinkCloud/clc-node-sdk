var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');

module.exports = Filters;

function Filters(criteria) {
    var self = this;

    self.byId = function() {
        if (propertyIsPresent(criteria, 'id')) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    };

    self.byParamAnyOf = function(criteriaProperty, metadataProperty, ignoreCase) {
        if (metadataProperty === true || metadataProperty === false) {
            ignoreCase = metadataProperty;
            metadataProperty = undefined;
        }

        if (metadataProperty === undefined) {
            metadataProperty = criteriaProperty;
        }

        return propertyIsPresent(criteria, criteriaProperty) &&
            Predicate.equalToAnyOf(_.asArray(criteria[criteriaProperty]), metadataProperty, ignoreCase) ||
            Predicate.alwaysTrue();
    };

    function propertyIsPresent(obj, property) {
        return obj[property] !== undefined && obj[property] !== null;
    }

    self.byCustomPredicate = function() {
        return criteria.where &&
            new Predicate(criteria.where) ||
            Predicate.alwaysTrue();
    };

    self.byParamMatch = function(criteriaProperty, metadataProperty) {
        return Predicate.match(criteria[criteriaProperty], metadataProperty);
    };

    self.byRootParam = function(SearchCriteriaClass, criteriaProperty, path) {
        if (path === undefined) {
            path = criteriaProperty;
        }

        return criteria[criteriaProperty] &&
            new SearchCriteriaClass(criteria[criteriaProperty]).predicate(path) ||
            Predicate.alwaysTrue();
    };


}