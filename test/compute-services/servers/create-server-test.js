
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

        promise = compute
            .servers()
            .create({
                name: "web",
                description: "My web server",
                groupId: "2dda7958f3ad4d819914e8d3cb643120",
                sourceServerId: "RHEL-6-64-TEMPLATE",
                primaryDns: "172.17.1.26",
                secondaryDns: "172.17.1.27",
                cpu: 1,
                memoryGB: 1,
                type: "standard",
                storageType: "standard",
                ttl:ttl.toISOString()
            });

        promise.then(function() {
            done();
        });
    });

});