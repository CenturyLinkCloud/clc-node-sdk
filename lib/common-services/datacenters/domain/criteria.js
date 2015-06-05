var _ = require('underscore');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = DataCenterCriteria;

function DataCenterCriteria(criteria) {
    var self = this;

    self.extractPredicateFromCriteria = function() {
        if (isConditionalCriteria(criteria)) {
            return resolveConditionalCriteria(criteria);
        }
        return resolveFilterCriteria(criteria, 'and');
    };

    function isConditionalCriteria(criteria) {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    }

    function selectDefaultPredicate(condition) {
        return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

    function resolveConditionalCriteria(criteria) {
        //extract only 1st criteria
        var value = _.pairs(criteria)[0];
        var condition = value[0];
        var expressions = [].concat(value[1]);

        var predicate = selectDefaultPredicate(condition);

        console.log('resolve conditional criteria :::' + condition);

        _.each(expressions, function(expression) {
            if (isConditionalCriteria(expression)) {
                predicate = predicate[condition](resolveConditionalCriteria(expression));
            } else {
                predicate = predicate[condition](resolveFilterCriteria(expression, condition));
            }
        });

        return predicate;
    }

    function resolveFilterCriteria(criteria, condition) {
        var predicate = selectDefaultPredicate(condition);
        if (criteria.id) {
            predicate = predicate[condition](Predicate.containsValue(criteria.id, "id"));
        }
        if (criteria.name) {
            predicate = predicate[condition](Predicate.containsValue(criteria.name, "name"));
        }
        if (criteria.nameContains) {
            predicate = predicate[condition](Predicate.contains(criteria.nameContains, "name"));
        }
        if (criteria.where) {
            if (typeof criteria.where !== "function") {
                throw new Error("Criteria.where property must be a function");
            }
            predicate = predicate[condition](new Predicate(criteria.where));
        }

        return predicate;
    }
}