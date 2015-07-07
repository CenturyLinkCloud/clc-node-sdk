
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Create server with managed OS operation  [UNIT]', function () {

    it('Should create new server', function (done) {
        this.timeout(1000 * 60);

        var DataCenter = compute.DataCenter;
        var Server = compute.Server;
        var Group = compute.Group;

        var promise = compute
            .servers()
            .create({
                name: "webOS",
                description: "My web server with managed OS",
                group: {
                    dataCenter: DataCenter.US_EAST_STERLING,
                    name: Group.DEFAULT
                },
                managedOS: true,
                template: {
                    dataCenter: DataCenter.US_EAST_STERLING,
                    operatingSystem: {
                        family: compute.OsFamily.RHEL,
                        version: "5",
                        architecture: compute.Machine.Architecture.X86_64
                    }
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 1 }
                    ]
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD
            })
            .then(compute.servers().findSingle)
            .then(assertThatServerIsManagedOS);

        promise.then(_.partial(deleteServer, done));
    });

    function assertThatServerIsManagedOS(server) {
        assert.equal(server.isManagedOS, true);
        assert.equal(server.status, "active");

        return server;
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