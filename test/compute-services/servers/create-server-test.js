
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

vcr.describe('Create server operation [UNIT]', function () {
    var promise;

//    after(function(done) {
//        this.timeout(1000 * 60 * 3);
//
//        compute
//            .servers()
//            .delete(promise.value());
//    });

    it('Should create new server', function (done) {
        this.timeout(1000 * 60 * 15);

        var DataCenter = compute.DataCenter;
        var Server = compute.Server;
        var Group = compute.Group;

        promise = compute
            .servers()
            .create({
                name: "web",
                description: "My web server",
                group: {
                    datacenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                template: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    os: compute.Os.CENTOS,
                    version: "6",
                    architecture: compute.Machine.Architecture.X86_64
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
                storageType: Server.StorageType.STANDARD
            });

        promise.then(function() {
            done();
        });
    });

});