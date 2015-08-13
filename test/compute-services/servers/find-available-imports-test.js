var Sdk = require('./../../../lib/clc-sdk.js');
var vcr = require('nock-vcr-recorder-mocha');
var TestAsserts = require("./../../test-asserts.js");

describe('Find available server imports [UNIT]', function () {
    var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
    var servers = compute.servers();
    var DataCenter = compute.DataCenter;

    vcr.it('Should found list of server imports', function (done) {
        this.timeout(5 * 1000);

        servers
            .findAvailableServerImports(DataCenter.DE_FRANKFURT)
            .then(TestAsserts.assertNotNull)
            .then(function () {
                done();
            });
    });

});
