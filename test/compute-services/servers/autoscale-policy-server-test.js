
var _ = require('underscore');
var assert = require('assert');
var vcr = require('nock-vcr-recorder-mocha');

var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

vcr.describe('Autoscale policy server operation [UNIT]', function () {
    var timeout = 1000;

    it('Should create a server with vertical auto scale policy', function (done) {
        this.timeout(timeout);

        compute.servers()
            .create({
                name: "tmp",
                description: "Server with autoscale policy",
                group: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 },
                        { path: "/data", size: 4 }
                    ],
                    autoScale: {
                        vertical: {
                            thresholdPeriod: 15
                        }
                    }
                },
                template: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    operatingSystem: {
                        family: compute.OsFamily.CENTOS,
                        version: "6",
                        architecture: compute.Machine.Architecture.X86_64
                    }
                }
            })
            .then(compute.servers().findSingle)
            .then(function(server) {
                isAutoScalePolicyPresent(server, true);

                return server;
            })
            .then(compute.servers().delete)
            .then(_.noop)
            .then(done);
    });

    it('Should set vertical autoscale policy to a server', function (done) {
        this.timeout(timeout);

        var serverCriteria = {
            dataCenter: compute.DataCenter.GB_PORTSMOUTH,
            nameContains: 'srv'
        };
        var policyCriteria = {nameContains: 'my'};

        compute.servers()
            .find(serverCriteria)
            .then(function(servers) {
                _.each(servers, _.partial(isAutoScalePolicyPresent, _, false));
            })
            .then(_.partial(compute.servers().setAutoScalePolicy, serverCriteria, policyCriteria))
            .then(compute.servers().find)
            .then(function (servers) {
                _.each(servers, _.partial(isAutoScalePolicyPresent, _, true));

                return servers;
            })
            .then(compute.servers().removeAutoScalePolicy)
            .then(compute.servers().find)
            .then(function (servers) {
                _.each(servers, _.partial(isAutoScalePolicyPresent, _, false));

                done();
            });
    });

    it('Should modify server', function (done) {
        this.timeout(timeout);

        var newMemory = 2;
        var newCpu = 2;
        var policyNameContains = "my";

        compute.servers()
            .modify(
            {dataCenter: compute.DataCenter.US_EAST_STERLING},
            {
                cpu: newCpu,
                memory: newMemory,
                autoScale: {
                    vertical: {
                        nameContains: policyNameContains
                    }
                }
            })
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                var autoScalePolicyId;

                assert(modifiedServers.length > 0);

                _.each(modifiedServers, function(modifiedServer) {
                    assert.equal(modifiedServer.details.cpu, newCpu);
                    assert.equal(modifiedServer.details.memoryMB, newMemory * 1024);
                    assert.equal(modifiedServer.locationId, compute.DataCenter.US_EAST_STERLING.id.toUpperCase());
                    assert(modifiedServer.details.cpuAutoscalePolicy != null);

                    autoScalePolicyId = modifiedServer.details.cpuAutoscalePolicy.id;
                });

                return compute.policies()
                    .autoScale()
                    .vertical()
                    .findSingle({id: autoScalePolicyId});
            })
            .then(_.partial(assertPolicy, _, policyNameContains))
            .then(done);
    });

    function assertPolicy(policy, nameContains) {
        assert(policy.name.toLowerCase().indexOf(nameContains) > -1);
    }

    function isAutoScalePolicyPresent(server, shouldPresent) {
        assert.equal(server.details.cpuAutoscalePolicy !== undefined, shouldPresent);
    }

});
