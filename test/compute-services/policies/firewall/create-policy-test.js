
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Create firewall policy Operation [UNIT]', function () {
    var timeout = 2 * 1000;

    it('Should create firewall policy in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        var Port = compute.policies().firewall().Port;

        compute
            .policies()
            .firewall()
            .create({
                dataCenter: compute.DataCenter.DE_FRANKFURT,
                source: '10.110.37.0/24',
                destination: '10.110.37.0/24',
                ports: [Port.PING, Port.TCP(123, 125)]
            })
            .then(assertThatPolicyRefIsCorrect)

            .then(deletePolicy)

            .then(function () {
                done();
            });
    });

    function assertThatPolicyRefIsCorrect (ref) {
        assert(!_.isUndefined(ref.id));

        return ref;
    }

    function deletePolicy (policyCriteria) {
        return compute
            .policies()
            .firewall()
            .delete(policyCriteria);
    }
});
