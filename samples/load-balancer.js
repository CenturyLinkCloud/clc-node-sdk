var assert = require('assert');
var _ = require('underscore');
var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var SampleUtils = require('./sample-utils.js');

var sdk = new Sdk();
var compute = sdk.computeServices();

var DataCenter = compute.DataCenter;

var contains = function (str, substr) { return str.indexOf(substr) > -1; };

var loadBalancer1Name = "balancer1";
var loadBalancer2Name = "balancer2";
var dataCenter = DataCenter.US_EAST_STERLING;
var poolMethod = "roundRobin";
var poolPersistence = "sticky";

var loadBalancers = [];
var loadBalancerPool;

var server;

var serverConfig = {
    dataCenter: dataCenter,
    publicIp: {
        openPorts: [
            compute.Server.Port.HTTP
        ]
    },
    ttl: 2
};

function __checkLoadBalancers(loadBalancers) {
    assert.equal(loadBalancers.length, 2);

    _.each(loadBalancers, function(loadBalancer) {
        assert(
            contains(loadBalancer.name, loadBalancer1Name) ||
            contains(loadBalancer.name, loadBalancer2Name)
        );
    });
}

function __displayResult(result) {
    _.each(result, function(element) {
        console.log("    " + element.id);
    });

    return result;
}

/* List all available load balancer by datacenter */
function __findLoadBalancers() {
    return compute.balancers().groups().find({
        dataCenter: DataCenter.US_EAST_STERLING
    })
    .then(function(balancers) {
        console.log("Load Balancers:");
        return balancers;
    })
    .then(__displayResult)
    .then(__checkLoadBalancers);
}

/* Find load balancer pools by load balancer */
function __findLoadBalancerPools() {
    return compute.balancers().pools().find({
        balancer: loadBalancers[0]
    })
    .then(function(pools) {
        console.log("Load balancer pool:");
        return pools;
    })
    .then(__displayResult);
}

/* Find load balancer nodes by load balancer pool */
function __findLoadBalancerNodes() {
    return compute.balancers().pools().find({
        balancer: loadBalancers[0]
    })
    .then(function(pools) {
        console.log("Load balancer nodes:");
        _.each(pools, function(pool) {
            console.log(JSON.stringify(pool.nodes, null, 2));
        });
    });
}

function __findServerWithPublicIp() {
    return compute.servers().findSingle(server);
}

function run() {

    SampleUtils
        .deleteLoadBalancers(compute, {dataCenter: dataCenter})
        .then(function() {
            return Promise.join(
                SampleUtils.createLoadBalancer(compute, dataCenter, loadBalancer1Name),
                SampleUtils.createLoadBalancer(compute, dataCenter, loadBalancer2Name),
                SampleUtils.createServer(compute, serverConfig),

                function(loadBalancer1, loadBalancer2, serverRef) {
                    server = serverRef;
                    loadBalancers.push(loadBalancer1);
                    loadBalancers.push(loadBalancer2);
                }
            )
        })
        .then(__findLoadBalancers)
        .then(function() {
            return SampleUtils.createLoadBalancerPool(compute, loadBalancers[0], 80, poolMethod, poolPersistence);
        })
        .then(function(pool) {
            loadBalancerPool = pool;
        })
        .then(__findLoadBalancerPools)
        .then(__findServerWithPublicIp)
        .then(function(server) {
            var publicIp = _.chain(server.details.ipAddresses)
                .pluck("public")
                .compact()
                .value();
            return SampleUtils.setLoadBalancerNodes(
                compute,
                loadBalancerPool,
                [
                    {ipAddress: publicIp[0], privatePort: 8088},
                    {ipAddress: publicIp[0], privatePort: 8089}
                ]
            );
        })
        .then(__findLoadBalancerNodes)
        .then(function() {
            return Promise.join(
                SampleUtils.deleteLoadBalancers(compute, {dataCenter: dataCenter}),
                compute.servers().delete(server)
            );
        })
        .then(Promise.resolve("Finished!"));
}

run();