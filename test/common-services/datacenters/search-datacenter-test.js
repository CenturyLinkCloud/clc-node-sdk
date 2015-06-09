
var Sdk = require('./../../../lib/clc-sdk.js');
var common = new Sdk().commonServices();
var TestAsserts = require("./../../test-asserts.js");

describe('Search datacenter by reference [INTEGRATION]', function () {
    var assertThatDataCenterIsDe1 = new TestAsserts().assertThatDataCenterIsDe1;

    it('Should found "de1" datacenter by id', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ id: common.DataCenter.DE_FRANKFURT.id})
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by name substring', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ name: 'Frankfurt'})
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

});