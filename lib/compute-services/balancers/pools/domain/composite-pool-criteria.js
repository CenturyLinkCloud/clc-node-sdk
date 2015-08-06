
var _ = require('underscore');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = CompositeLoadBalancerPoolCriteria;

/**
 * The type of {@link LoadBalancerPoolCriteria} that represents composite search criteria.
 * @typedef CompositeLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {Array<LoadBalancerPoolCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<LoadBalancerPoolCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              port: 80,
 *              balancerName: 'My balancer'
 *          },
 *          {
 *              method: "roundRobin",
 *              balancerDescriptionContains: 'Test'
 *          }
 *  ]
 * }
 *
 */

function CompositeLoadBalancerPoolCriteria(criteria) {
    var LoadBalancerPoolCriteria = require('./pool-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(LoadBalancerPoolCriteria, path);
    };
}