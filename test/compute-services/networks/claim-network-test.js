
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Claim Network Operation [UNIT]', function () {
    var timeout = 10 * 1000;

    it('Should claim network in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .claim({
                id: ['de1']
            })
            .then(assertThatRefIsCorrect)
            .then(compute.networks().find)
            .get(0)
            .then(assertThatNetworksInDataCenters(compute.DataCenter.DE_FRANKFURT))
            .then(releaseNetwork)
            .then(assertThatRefIsCorrect)

            .then(callDone(done));
    });

    it('Should claim network in VA1, GB1 DataCenters', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .claim(
                compute.DataCenter.US_EAST_STERLING, compute.DataCenter.GB_PORTSMOUTH
            )
            .then(compute.networks().find)
            .then(assertThatNetworksInDataCenters(compute.DataCenter.US_EAST_STERLING, compute.DataCenter.GB_PORTSMOUTH))
            .then(releaseNetwork)

            .then(callDone(done));
    });

    function assertThatNetworksInDataCenters() {
        var dataCenterIds = _.pluck(_.asArray(arguments), "id");
        return function(networks) {
            _.each(_.asArray(networks), function(network) {
                assert(dataCenterIds.indexOf(network.dataCenter.id) > -1);
            });

            return networks;
        };
    }

    function assertThatRefIsCorrect (refValue) {
        var ref = refValue instanceof Array ? refValue[0] : refValue;
        assert(!_.isUndefined(ref.id));

        return ref;
    }

    function releaseNetwork (networkCriteria) {
        return compute.networks().release(networkCriteria);
    }

    function callDone(done) {
        return function() {
            done();
        };
    }
});
