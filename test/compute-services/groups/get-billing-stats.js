
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Get group billing stats [UNIT]', function () {

    it('Should return stats for Default group in DE1', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .getBillingStats({
                dataCenter: compute.DataCenter.DE_FRANKFURT,
                name: compute.Group.DEFAULT
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