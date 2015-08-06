
var _ = require('underscore');
var SingleCriteria = require('./single-node-criteria.js');
var CompositeCriteria = require('./composite-node-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = LoadBalancerNodeCriteria;

/**
 * Class that used to filter load balancer nodes
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeLoadBalancerNodeCriteria)}
 *
 */
function LoadBalancerNodeCriteria (criteria) {
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).getPredicate(path, CompositeCriteria, SingleCriteria);
    };

    self.parseCriteria = function() {
        return new Criteria(criteria).parseCriteria(LoadBalancerNodeCriteria, SingleCriteria);
    };
}