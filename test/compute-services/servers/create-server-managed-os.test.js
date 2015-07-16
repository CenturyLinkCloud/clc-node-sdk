
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var ServerBuilder = require('./../server-builder.js');

vcr.describe('Create server with managed OS operation  [UNIT]', function () {

    it('Should create new server', function (done) {
        this.timeout(1000 * 6);

        var DataCenter = compute.DataCenter;
        var Group = compute.Group;

        var builder = new ServerBuilder(compute);

        builder.createCentOsVm({
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
                }
            })
            .then(compute.servers().findSingle)
            .then(assertThatServerIsManagedOS)
            .then(builder.deleteServer(done));
    });

    function assertThatServerIsManagedOS(server) {
        assert.equal(server.isManagedOS, true);
        assert.equal(server.status, "active");

        return server;
    }

});