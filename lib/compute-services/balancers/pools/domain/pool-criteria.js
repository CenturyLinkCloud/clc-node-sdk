
var _ = require('underscore');
var SingleCriteria = require('./single-pool-criteria.js');
var CompositeCriteria = require('./composite-pool-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = LoadBalancerPoolCriteria;

/**
 * Class that used to filter load balancer pools
 * @typedef LoadBalancerPoolCriteria
 * @type {(SingleLoadBalancerPoolCriteria|CompositeLoadBalancerPoolCriteria)}
 *
 */
function LoadBalancerPoolCriteria (criteria) {
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).getPredicate(path, CompositeCriteria, SingleCriteria);
    };

    self.parseCriteria = function() {
        return new Criteria(criteria).parseCriteria(LoadBalancerPoolCriteria, SingleCriteria);
    };
}