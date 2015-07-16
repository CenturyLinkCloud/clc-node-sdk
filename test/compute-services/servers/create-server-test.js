
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Create server operation [UNIT]', function () {

    var DataCenter = compute.DataCenter;
    var Server = compute.Server;
    var Group = compute.Group;

    it('Should create new server', function (done) {
        this.timeout(10000);

        var promise = compute
            .servers()
            .create({
                name: "web",
                description: "My web server",
                group: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                template: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    operatingSystem: {
                        family: compute.OsFamily.CENTOS,
                        version: "6",
                        architecture: compute.Machine.Architecture.X86_64
                    }
                },
                network: {
                    primaryDns: "172.17.1.26",
                    secondaryDns: "172.17.1.27"
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 },
                        { path: "/data", size: 4 }
                    ]
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD,
                customFields: [
                    {
                        name: "Type",
                        value: 0
                    }
                ]
            });

        promise.then(_.partial(deleteServer, done));
    });

    it('Should create new hyperscale server with anti-affinity policy', function (done) {
        this.timeout(10000);

        compute
            .servers()
            .create({
                name: "web",
                description: "My hyperscale server",
                group: {
                    dataCenter: DataCenter.CA_TORONTO_2,
                    name: Group.DEFAULT
                },
                template: {
                    dataCenter: DataCenter.CA_TORONTO_2,
                    operatingSystem: {
                        family: compute.OsFamily.CENTOS,
                        version: "6",
                        architecture: compute.Machine.Architecture.X86_64
                    }
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 }
                    ]
                },
                type: Server.HYPERSCALE,
                policy: {
                    antiAffinity: {
                        nameContains: 'policy'
                    }
                }
            })
            .then(compute.servers().findSingle)
            .then(assertThatServerIsHyperscale)
            .then(assertThatAntiAffinityPolicyIsSpecified)
            .then(_.partial(deleteServer, done));
    });

    function assertThatServerIsHyperscale(server) {
        assert.equal(server.type, Server.HYPERSCALE);
        assert.equal(server.storageType, Server.StorageType.HYPERSCALE);

        return server;
    }

    function assertThatAntiAffinityPolicyIsSpecified(server) {
        return compute.policies().antiAffinity()
            .findSingle({
                dataCenterId: server.locationId.toLowerCase(),
                nameContains: 'policy'
            })
            .then(function(policy) {
                var serverLink = _.findWhere(policy.links, {rel: 'server', id: server.id});
                assert(!_.isUndefined(serverLink));

                return server;
            });
    }

    function deleteServer (done, server) {
        compute
            .servers()
            .delete(server)
            .then(function () {
                done();
            });
    }

});