
var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');

module.exports = SinglePolicyCriteria;


/**
 * The type of {@link PolicyCriteria} that represents single search criteria.
 *
 * @typedef SinglePolicyCriteria
 * @type {object}
 *
 * @property {string} id - an alert policy id restriction.
 * @property {string} name - an alert policy name restriction.
 * @property {string} nameContains - restriction that pass only policy which name contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {Array<string>} actions - restriction that pass only policy which actions contains specified criteria.
 * @property {Array<string>} metrics - restriction that pass only policy which trigger actions contains specified criteria.
 *
 * @example policy criteria
 * {
 *     name: "My Policy",
 *     nameContains: "alert",
 *     where: function(policy) {
 *         return ["My Policy", "Custom Policy"].indexOf(policy.name) > -1;
 *     },
 *     actions: ["email"],
 *     metrics: ["memory", "cpu", "disk"] //compute.Policy.Alert.Metric.DISK
 * }
 */
function SinglePolicyCriteria(criteria) {
    var self = this;

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
        return criteria.name &&
            Predicate.equalToAnyOf(_.asArray(criteria.name), 'name') ||
            Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    function filterNameContains() {
        return Predicate.match(criteria.nameContains, "name");
    }

    function filterByActions() {
        return new Predicate(function(data) {
            var actions = data.actions;
            if (criteria.actions) {
                var found = _.intersection(_.asArray(criteria.actions), _.pluck(_.asArray(actions), "name"));

                return found.length > 0;
            }

            return true;
        });
    }

    function filterByMetrics() {
        return new Predicate(function(data) {
            var triggers = data.triggers;
            if (criteria.metrics) {
                var found = _.intersection(_.asArray(criteria.metrics), _.pluck(_.asArray(triggers), "metric"));

                return found.length > 0;
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
                filterById()
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterByActions())
                .and(filterByMetrics()),
            path
        );
    };

    self.get = function () {
        return criteria;
    };
}