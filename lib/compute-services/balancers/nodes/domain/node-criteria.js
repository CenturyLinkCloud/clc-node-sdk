
var SingleCriteria = require('./single-node-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = LoadBalancerNodeCriteria;

/**
 * Class that used to filter load balancer nodes
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeCriteria)}
 *
 */
function LoadBalancerNodeCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}