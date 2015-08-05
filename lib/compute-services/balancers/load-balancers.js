var _ = require('underscore');
var GroupBalancers = require('./groups/load-balancer-groups.js');
var PoolBalancers = require('./pools/load-balancer-pools.js');
var NodeBalancers = require('./nodes/load-balancer-nodes.js');

module.exports = SharedLoadBalancers;

/**
 * Service that allow to manage load balancers in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancers(dataCenterService, loadBalancerClient, queueClient) {
    var self = this;

    self.groups = _.memoize(function() {
        return new GroupBalancers(dataCenterService, loadBalancerClient, queueClient);
    });

    self.pools = _.memoize(function() {
        return new PoolBalancers(self.groups(), loadBalancerClient, queueClient);
    });

    self.nodes = _.memoize(function() {
        return new NodeBalancers(self.pools(), loadBalancerClient, queueClient);
    });
}