
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Claim Network Operation [UNIT]', function () {
    var timeout = 10 * 1000;

    it('Should claim network in CA Vancouver', function (done) {
        this.timeout(timeout);

        var networksCount = 0;
        var dcCriteria = {dataCenterId: compute.DataCenter.CA_VANCOUVER.id};

        compute.networks()
            .find(dcCriteria)
            .then(function(result) {
                networksCount = result.length;
            })
            .then(function() {
                return compute.networks()
                    .claim({
                        id: [compute.DataCenter.CA_VANCOUVER.id]
                    });
            })
            .then(_.partial(compute.networks().find, dcCriteria))
            .then(function(result) {
                assert.equal(networksCount + 1, result.length);
            })
            .then(callDone(done));
    });

    it('Should claim network in IL1, CA2 DataCenters', function (done) {
        this.timeout(timeout);

        var networksCount = 0;
        var dcCriteria = {dataCenterId: [compute.DataCenter.US_CENTRAL_CHICAGO.id, compute.DataCenter.CA_TORONTO_2.id]};

        compute.networks()
            .find(dcCriteria)
            .then(function(result) {
                networksCount = result.length;
            })
            .then(function() {
                return compute.networks()
                    .claim(compute.DataCenter.US_CENTRAL_CHICAGO, compute.DataCenter.CA_TORONTO_2);
            })
            .then(_.partial(compute.networks().find, dcCriteria))
            .then(function(result) {
                assert.equal(networksCount + 2, result.length);
            })
            .then(callDone(done));
    });

    function callDone(done) {
        return function() {
            done();
        };
    }
});
