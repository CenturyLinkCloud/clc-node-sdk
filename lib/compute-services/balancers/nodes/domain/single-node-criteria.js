
var Predicate = require('./../../../../core/predicates/predicates.js');
var PoolCriteria = require('./../../pools/domain/pool-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

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
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'pool';

        self.criteriaPropertiesMap = {
            id: 'poolId',
            method: 'poolMethod',
            persistence: 'poolPersistence',
            port: 'poolPort'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(PoolCriteria, 'pool')
                .and(filters.byParamAnyOf('status'))
                .and(filters.byParamAnyOf('privatePort'))
                .and(filters.byParamAnyOf('ipAddress')),
            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}