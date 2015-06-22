
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");

vcr.describe('Search group by name and datacenter [UNIT]', function () {
    var assertThatGroupIsDefault = TestAsserts.assertThatGroupIsDefault;

    it('Should found Default group', function (done) {
        this.timeout(100000);

        var DataCenter = compute.DataCenter;
        var Group = compute.Group;

        compute
            .groups()
            .findByNameAndDatacenter({
                datacenter: DataCenter.DE_FRANKFURT,
                name: Group.DEFAULT
            })
            .then(assertThatGroupIsDefault)
            .then(function () {
                done();
            });
    });

});