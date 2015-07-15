
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Get group billing stats [UNIT]', function () {
    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    it('Should return stats for Default group in DE1', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .getBillingStats({
                dataCenter: DataCenter.DE_FRANKFURT,
                name: Group.DEFAULT
            })
            .then(checkAsserts)
            .then(done);
    });

    function checkAsserts(stats) {
        console.log(JSON.stringify(stats, null, 2));

        assert.equal(stats.length, 1);
        var billingStats = stats[0];

        assert.notEqual(billingStats.date, undefined);
        assert.notEqual(billingStats.groups.size, 0);
    }

});