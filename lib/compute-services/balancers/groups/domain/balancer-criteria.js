
var SingleCriteria = require('./single-balancer-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = SharedLoadBalancerCriteria;

/**
 * Class that used to filter shared load balancers
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeCriteria)}
 *
 */
function SharedLoadBalancerCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}