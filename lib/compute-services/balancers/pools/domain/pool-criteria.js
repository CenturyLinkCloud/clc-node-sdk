
var SingleCriteria = require('./single-pool-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = LoadBalancerPoolCriteria;

/**
 * Class that used to filter load balancer pools
 * @typedef LoadBalancerPoolCriteria
 * @type {(SingleLoadBalancerPoolCriteria|CompositeCriteria)}
 *
 */
function LoadBalancerPoolCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}