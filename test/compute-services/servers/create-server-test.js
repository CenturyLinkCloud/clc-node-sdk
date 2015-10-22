
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var ServerBuilder = require('./../server-builder.js');

vcr.describe('Create server operation [UNIT]', function () {

    var DataCenter = compute.DataCenter;
    var Server = compute.Server;
    var Group = compute.Group;
    var builder = new ServerBuilder(compute);

    it('Should create new server', function (done) {
        this.timeout(10000);

        builder.createCentOsVm({
            customFields: [
                {
                    name: "Type",
                    value: 0
                }
            ]
        })
        .then(builder.deleteServer(done));
    });

    it('Should create new hyperscale server with anti-affinity policy', function (done) {
        this.timeout(10000);

        builder.createCentOsVm({
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
                    { size: 2 },
                    { path: "/data", size: 4 }
                ],
                antiAffinity: {
                    nameContains: 'policy'
                }
            },
            type: Server.HYPERSCALE
        })
        .then(compute.servers().findSingle)
        .then(assertThatServerIsHyperscale)
        .then(assertThatAntiAffinityPolicyIsSpecified)
        .then(builder.deleteServer(done));
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

});