
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

vcr.describe('Create server operation [UNIT]', function () {

    it('Should create new server', function (done) {
        this.timeout(1000 * 60 * 15);

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

    function deleteServer (done, server) {
        compute
            .servers()
            .delete(server)
            .then(function () {
                done();
            });
    }

});