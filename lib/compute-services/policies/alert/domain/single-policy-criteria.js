
var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleAlertPolicyCriteria;


/**
 * The type of {@link AlertPolicyCriteria} that represents single search criteria.
 *
 * @typedef SingleAlertPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - an alert policy id restriction.
 * @property {String | Array<String>} name - an alert policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy
 * which name contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {Array<string>} actions - restriction that pass only policy which actions
 * contains specified criteria.
 * @property {Array<string>} metrics - restriction that pass only policy which trigger actions
 * contains specified criteria.
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
function SingleAlertPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();
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
            filters.byId()
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filterByActions())
            .and(filterByMetrics()),

            path
        );
    };

    self.parseCriteria = function () {
        return criteria;
    };

    init();
}