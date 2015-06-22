
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = DataCenterCriteria;


function DataCenterCriteria (criteria) {
    var self = this;

    self.extractPredicateFromCriteria = function () {
        if (self.isConditionalCriteria()) {
            return self.resolveConditionalCriteria();
        }

        return self.predicate();
    };

    self.isConditionalCriteria = function () {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    };

    function selectDefaultPredicate(condition) {
        return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

    self.resolveConditionalCriteria = function () {
        //extract only 1st criteria
        var value = _.pairs(criteria)[0];
        var condition = value[0];
        var expressions = _.asArray(value[1]);

        var predicate = selectDefaultPredicate(condition);

        _.each(expressions, function(expression) {
            var subCriteria = new DataCenterCriteria(expression);

            if (subCriteria.isConditionalCriteria()) {
                predicate = predicate[condition](subCriteria.resolveConditionalCriteria());
            } else {
                predicate = predicate[condition](subCriteria.predicate());
            }
        });

        return predicate;
    };

    self.predicate = function (path) {
        return new Predicate(function (data) {
            var dataCenter = Predicate.extractValue(data, path);

            if (criteria.id) {
                var ids = [];
                _.each(_.asArray(criteria.id), function (value) {
                    if (value instanceof Object) {
                        ids.push(value.id);
                    } else {
                        ids.push(value);
                    }
                });
                if (ids.indexOf(dataCenter.id) === -1) {
                    return false;
                }
            }

            if (criteria.name) {
                if (criteria.name.indexOf(dataCenter.name) === -1) {
                    return false;
                }
            }

            if (criteria.nameContains) {
                var found = _.filter(_.asArray(criteria.nameContains), function (value) {
                    return Predicate.compareIgnoreCase(value, dataCenter.name);
                }).length;
                if (found === 0) {
                    return false;
                }
            }

            if (criteria.where) {
                if (typeof criteria.where !== "function") {
                    throw new Error("DataCenterCriteria.where property must be a function");
                }
                return criteria.where(dataCenter);
            }

            return true;
        });

    };
}