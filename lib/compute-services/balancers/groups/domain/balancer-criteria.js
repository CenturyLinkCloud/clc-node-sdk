
var _ = require('underscore');
var SingleCriteria = require('./single-balancer-criteria.js');
var CompositeCriteria = require('./composite-balancer-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SharedLoadBalancerCriteria;

/**
 * Class that used to filter shared load balancers
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeLoadBalancerNodeCriteria)}
 *
 */
function SharedLoadBalancerCriteria (criteria) {
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).getPredicate(path, CompositeCriteria, SingleCriteria);
    };

    self.parseCriteria = function() {
        return new Criteria(criteria).parseCriteria(SharedLoadBalancerCriteria, SingleCriteria);
    };
}