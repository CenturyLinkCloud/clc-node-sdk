
var _ = require('underscore');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = CompositeSharedLoadBalancerCriteria;

/**
 * The type of {@link SharedLoadBalancerCriteria} that represents composite search criteria.
 * @typedef CompositeLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {Array<SharedLoadBalancerCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<SharedLoadBalancerCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              name: 'Balancer',
 *              dataCenterId: 'de1'
 *          },
 *          {
 *              description: "123test123",
 *              dataCenter: [{id:'test'}, {nameContains: 'blah'}]
 *          }
 *  ]
 * }
 *
 */

function CompositeSharedLoadBalancerCriteria(criteria) {
    var SharedLoadBalancerCriteria = require('./balancer-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(SharedLoadBalancerCriteria, path);
    };
}