var Sdk = require('./../../../lib/clc-sdk.js');
var TestAsserts = require("./../../test-asserts.js");

describe('Find available server imports [UNIT]', function () {

    var compute = new Sdk().computeServices();
    var service = compute.servers();
    var DataCenter = compute.DataCenter;


    it('Should found list of server imports', function (done) {
        this.timeout(5000);

        service
            .findAvailableServerImports(DataCenter.DE_FRANKFURT)
            .then(function () {
                done();
            });
    });
});