
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");

describe('Search group by name and datacenter [INTEGRATION]', function () {
    var assertThatGroupIsDefault = new TestAsserts().assertThatGroupIsDefault;

    it('Should found "Default group"', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .findByNameAndDatacenter(
                {
                    datacenter: {
                        id: 'de1',
                        name: 'DE1 - Germany (Frankfurt)'
                    },
                    name: 'Default Group'
                }
            )
            .then(assertThatGroupIsDefault)
            .then(function () {
                done();
            });
    });

});