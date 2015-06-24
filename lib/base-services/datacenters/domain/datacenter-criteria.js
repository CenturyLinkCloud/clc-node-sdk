
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = DataCenterCriteria;


/**
 * @typedef DataCenterSearchCriteria
 * @type {object}
 *
 * @property {string} id - a IDs of target datacenters
 * @property {string} name - a name of target datacenters
 * @property {string} nameContains - search datacenters which name contains specified keyword
 */
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
        // extract only 1st criteria
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

    function filterById() {
        if (criteria.id) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    }

    function filterByName () {
        return criteria.name && Predicate.equalTo(criteria.name, 'name') || Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return new Predicate(function (data) {
            var dataCenter = Predicate.extractValue(data, path);

            if (!filterById().and(filterByName()).and(filterByCustomPredicate()).fn(dataCenter)) {
                return false;
            }

            if (criteria.nameContains) {
                var found = _.filter(_.asArray(criteria.nameContains), function (value) {
                    return Predicate.compareIgnoreCase(value, dataCenter.name);
                }).length;

                if (found === 0) {
                    return false;
                }
            }

            return true;
        });

    };
}