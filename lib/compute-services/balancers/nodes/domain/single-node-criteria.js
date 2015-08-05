
var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var PoolCriteria = require('./../../pools/domain/pool-criteria.js');

module.exports = SingleLoadBalancerNodeCriteria;


/**
 * The type of {@link LoadBalancerNodeCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>pool</b> search criteria and the properties
 * <b>poolId, poolMethod, poolPersistence, poolPort</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {string} status - a node status restriction.
 * @property {number} ipAddress - a node ip address restriction.
 * @property {string} privatePort - a node private port restriction.
 * @property {SharedLoadBalancerCriteria} pool - restrict load balancer pools in which need to execute search.
 *
 * @property {string} poolId - a pool id restriction.
 * @property {string} poolMethod - a pool method restriction.
 * @property {string} poolPersistence - a pool persistence restriction.
 * @property {string} poolPort - a pool port number restriction.
 *
 * @example node criteria
 * {
 *   status: ['enabled', 'disabled', 'deleted'],
 *   ipAddress: '66.1.25.52',
 *   privatePort: [45, 8080],
 *   poolMethod: 'roundRobin'
 * }
 */
function SingleLoadBalancerNodeCriteria(criteria) {
    var self = this;

    function filterByStatus() {
        return criteria.status &&
            Predicate.equalToAnyOf(_.asArray(criteria.status), 'status') ||
            Predicate.alwaysTrue();
    }

    function filterByPort() {
        return criteria.privatePort &&
            Predicate.equalToAnyOf(_.asArray(criteria.privatePort), 'privatePort') ||
            Predicate.alwaysTrue();
    }

    function filterByIpAddress() {
        return criteria.ipAddress &&
            Predicate.equalToAnyOf(_.asArray(criteria.ipAddress), 'ipAddress') ||
            Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            (criteria.pool ?
                new PoolCriteria(criteria.pool).predicate("pool") : Predicate.alwaysTrue())
                .and(filterByStatus())
                .and(filterByIpAddress())
                .and(filterByPort()),
            path
        );
    };

    self.parseCriteria = function () {
        var poolCriteria = collectCriteriaFromProperties();

        var parsedCriteria = _.omit(criteria, ['poolId', 'poolMethod', 'poolPersistence', 'poolPort']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.pool ? _.asArray(poolCriteria)
            : _.asArray(parsedCriteria.pool, poolCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            if (nonEmptyOperands.length === 1) {
                parsedCriteria.pool = nonEmptyOperands[0];
            } else {
                parsedCriteria.pool = {or: nonEmptyOperands};
            }
        }

        //if criteria is empty - should find overall
        if (_.isEmpty(parsedCriteria) || _.isUndefined(parsedCriteria.pool)) {
            parsedCriteria.pool = {};
        }

        return parsedCriteria;
    };

    //instantiate object from properties
    function collectCriteriaFromProperties() {

        return {
            id: getCriteriaValue('poolId'),
            method: getCriteriaValue('poolMethod'),
            persistence: getCriteriaValue('poolPersistence'),
            port: getCriteriaValue('poolPort')
        };
    }

    function getCriteriaValue(property) {
        return criteria[property] ? _.asArray(criteria[property]) : null;
    }
}