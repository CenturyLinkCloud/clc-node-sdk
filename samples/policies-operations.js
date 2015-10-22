var assert = require('assert');
var _ = require('underscore');
var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var SampleUtils = require('./sample-utils');

var sdk = new Sdk();
var compute = sdk.computeServices();

var dataCenter = compute.DataCenter.US_EAST_NEW_YORK;

var policyName = 'Policy for Sample';
var newPolicyName = 'Updated Policy for Sample';

function clearAll() {
    return compute.policies().alert().delete({})
        .then(function() {
            return compute.policies().antiAffinity().delete({});
        });
}

function createPolicies() {
    return Promise.join(
        compute.policies().antiAffinity()
            .create({
                name: policyName,
                dataCenter: dataCenter
            }),
        compute.policies().alert().create({
            name: policyName,
            actions: [
                {
                    action: "email",
                    settings: {
                        recipients: [
                            "user@company.com"
                        ]
                    }
                }
            ],
            triggers: [
                {
                    metric: compute.Policy.Alert.Metric.DISK,
                    duration: 15,
                    threshold: 80
                }
            ]
        })
    )
}

function createServer() {
    var name = "plc";
    console.log("Create server " + name);

    return SampleUtils.createServer(compute,
        {
            name: 'plc',
            dataCenter: dataCenter,
            type: compute.Server.HYPERSCALE,
            machine: {
                cpu: 1,
                memoryGB: 1,
                antiAffinity: {
                    nameContains: 'policy'
                }
            }
        }
    );
}

function checkServerPolicy(server) {
    return compute.policies().antiAffinity().findSingle({id: server.details.antiAffinityPolicy.id})
        .then(function(policy) {
            var srvPolicy = server.details.antiAffinityPolicy;
            assert(srvPolicy.name, policy.name);
            assert(server.locationId, policy.location);
        })
        .then(function() {
            return server;
        });
}

function checkAlertPolicy(name, metric, duration, threshold) {
    return function() {
        return compute.policies().alert().findSingle({})
            .then(function(policy) {
                console.log("Check alert policy " + policy.name);

                assert(name, policy.name);

                var trigger = policy.triggers[0];
                assert(metric, trigger.metric);
                assert(duration, trigger.duration);
                assert(threshold, trigger.threshold);
            });
    }
}

function checkAntiAffinityPolicy(name) {
    return function() {
        return compute.policies().antiAffinity().findSingle({})
            .then(function(policy) {
                console.log("Check anti-affinity policy " + policy.name);

                assert(name, policy.name);
            });
    }
}

function modifyAlertPolicy(name, metric, duration, threshold) {
    return function() {
        return compute.policies().alert().findSingle({})
            .then(function(policy) {
                console.log("Modify alert policy " + policy.name);

                return compute.policies().alert().modify(policy,
                    {
                        name: name,
                        triggers: [
                            {
                                metric: metric,
                                duration: duration,
                                threshold: threshold
                            }
                        ]
                    });
            })
            .then(checkAlertPolicy(name, metric, duration, threshold));
    }
}

function modifyAntiAffinityPolicy(name) {
    return function() {
        return compute.policies().antiAffinity().findSingle({})
            .then(function(policy) {
                console.log("Modify anti-affinity policy " + policy.name);

                return compute.policies().antiAffinity().modify(policy, {
                    name: name
                });
            });
    }
}

function findServerByRef(serverRef) {
    return compute.servers().findSingle(serverRef);
}

function run() {
    clearAll()
        .then(createPolicies)
        .then(checkAlertPolicy(policyName, compute.Policy.Alert.Metric.DISK, 15 , 80))
        .then(checkAntiAffinityPolicy(policyName))
        .then(createServer)
        .then(findServerByRef)
        .then(checkServerPolicy)
        .then(modifyAlertPolicy(newPolicyName, compute.Policy.Alert.Metric.CPU, 10, 50))
        .then(modifyAntiAffinityPolicy(newPolicyName))
        .then(clearAll)
        .then(_.partial(console.log, "Finished!"));
}

run();