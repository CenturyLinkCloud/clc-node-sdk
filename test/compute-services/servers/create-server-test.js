
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();

describe('Create server operation [INTEGRATION, LONG_RUNNING]', function () {
    var promise;

    after(function(done) {
        this.timeout(1000 * 60 * 3);
        compute
            .servers()
            .delete(promise.value())
            .then(function() {
                done();
            });
    });

    it('Should create new server', function (done) {
        this.timeout(1000 * 60 * 15);
        var ttl = new Date();
        ttl.setHours(ttl.getHours()+3);

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
                    datacenter: compute.DataCenter.DE_FRANKFURT,
                    os: compute.Os.CENTOS,
                    version: "6",
                    architecture: compute.Machine.Architecture.X86_64
                },
                network: {
                    primaryDns: "172.17.1.26",
                    secondaryDns: "172.17.1.27"
                },
                cpu: 1,
                memoryGB: 1,
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD,
                ttl: ttl.toISOString()
            });

        promise.then(function() {
            done();
        });
    });

});