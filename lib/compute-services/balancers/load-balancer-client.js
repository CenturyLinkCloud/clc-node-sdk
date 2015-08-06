
var _ = require('underscore');
var util = require('util');

module.exports = LoadBalancerClient;

function LoadBalancerClient(rest) {
    var self = this;

    self.createLoadBalancer = function (dataCenterId, createRequest) {
        return rest.postJson(generateBalancerUrl(dataCenterId), createRequest);
    };

    self.deleteLoadBalancer = function (balancerId, dataCenterId) {
        return rest.delete(generateBalancerUrl(dataCenterId, balancerId));
    };

    self.findLoadBalancerById = function (balancerId, dataCenterId) {
        return rest.get(generateBalancerUrl(dataCenterId, balancerId));
    };

    self.findLoadBalancers = function (dataCenterId) {
        return rest.get(generateBalancerUrl(dataCenterId));
    };

    self.modifyLoadBalancer = function (balancerId, dataCenterId, updateRequest) {
        return rest.putJson(generateBalancerUrl(dataCenterId, balancerId), updateRequest);
    };

    function generateBalancerUrl(dataCenterId, balancerId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s%s',
            dataCenterId,
            balancerId ? ('/' + balancerId) : ""
        );
    }


    self.createLoadBalancerPool = function (dataCenterId, balancerId, createRequest) {
        return rest.postJson(generatePoolUrl(dataCenterId, balancerId),
            createRequest);
    };

    self.deleteLoadBalancerPool = function (poolId, dataCenterId, balancerId) {
        return rest.delete(generatePoolUrl(dataCenterId, balancerId, poolId));
    };

    self.findLoadBalancerPoolById = function (poolId, dataCenterId, balancerId) {
        return rest.get(generatePoolUrl(dataCenterId, balancerId, poolId));
    };

    self.findLoadBalancerPools = function (dataCenterId, balancerId) {
        return rest.get(generatePoolUrl(dataCenterId, balancerId));
    };

    self.modifyLoadBalancerPool = function (poolId, dataCenterId, balancerId, updateRequest) {
        return rest.putJson(generatePoolUrl(dataCenterId, balancerId, poolId), updateRequest);
    };

    function generatePoolUrl(dataCenterId, balancerId, poolId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s/%s/pools%s',
            dataCenterId,
            balancerId,
            poolId ? '/' + poolId : ""
        );
    }


    self.findLoadBalancerNodes = function (poolId, balancerId, dataCenterId) {
        return rest.get(generateNodesUrl(poolId, balancerId, dataCenterId));
    };

    self.modifyLoadBalancerNodes = function (poolId, balancerId, dataCenterId, updateRequest) {
        return rest.putJson(generateNodesUrl(poolId, balancerId, dataCenterId), updateRequest);
    };

    function generateNodesUrl(poolId, balancerId, dataCenterId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s/%s/pools/%s/nodes',
            dataCenterId,
            balancerId,
            poolId
        );
    }
}
