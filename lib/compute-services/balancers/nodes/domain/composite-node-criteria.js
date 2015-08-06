
var _ = require('underscore');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = CompositeLoadBalancerNodeCriteria;

/**
 * The type of {@link LoadBalancerNodeCriteria} that represents composite search criteria.
 * @typedef CompositeLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {Array<LoadBalancerNodeCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<LoadBalancerNodeCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              status: ['enabled', 'disabled', 'deleted'],
 *              ipAddress: '66.1.25.52',
 *              port: [45, 8080]
 *          },
 *          {
 *              pool: {
 *                  method: "leastConnection",
 *                  balancer: {
 *                      dataCenterId: 'de1'
 *                  }
 *              }
 *          }
 *  ]
 * }
 *
 */

function CompositeLoadBalancerNodeCriteria(criteria) {
    var LoadBalancerNodeCriteria = require('./node-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(LoadBalancerNodeCriteria, path);
    };
}