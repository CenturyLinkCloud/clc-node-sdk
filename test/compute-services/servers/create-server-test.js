
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();

describe('Create server operation [INTEGRATION, LONG_RUNNING]', function () {
    var server;

    after(function(done) {
        this.timeout(1000 * 60 * 3);
        compute
            .servers()
            .delete(server)
            .on('complete', function () {
                done();
            });
    });

    it('Should create new server', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .servers()
            .create({
                name: "web",
                description: "My web server",
                groupId: "2dda7958f3ad4d819914e8d3cb643120",
                sourceServerId: "RHEL-6-64-TEMPLATE",
                primaryDns: "172.17.1.26",
                secondaryDns: "172.17.1.27",
                cpu: 2,
                memoryGB: 4,
                type: "standard",
                storageType: "standard"
            })
            .on('job-queue', function (server) {
                // empty
            })
            .on('complete', function (result) {
                compute
                    .servers()
                    .findByUuid(result.findSelfId())
                    .then(function(result) {
                        server = result;
                    })
                    .then(done);
            });
    });

});