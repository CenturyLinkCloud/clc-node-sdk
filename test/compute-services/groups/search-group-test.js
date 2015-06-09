
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");

describe('Search group by name and datacenter [INTEGRATION]', function () {
    var assertThatGroupIsDefault = new TestAsserts().assertThatGroupIsDefault;

    it('Should found "Default group"', function (done) {
        this.timeout(10000);

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