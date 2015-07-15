
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var assert = require('assert');

vcr.describe('Create anti-affinity policy Operation [UNIT]', function () {
    var timeout = 15 * 60 * 1000;

    it('Should create anti-affinity My Policy in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        compute
            .policies()
            .antiAffinity()
            .create({
                name: 'My Policy',
                dataCenter: [compute.DataCenter.DE_FRANKFURT, compute.DataCenter.CA_TORONTO_1]
            })
            .then(assertThatPoliciesRefIsCorrect)

            .then(deletePolicies)

            .then(function () {
                done();
            });
    });

    function assertThatPoliciesRefIsCorrect (refs) {
        assert.equal(refs.length, 2);
        _.each(refs, function(ref) {
            assert(!_.isUndefined(ref.id));
        });

        return refs;
    }

    function deletePolicies (policyCriteria) {
        return compute
            .policies()
            .antiAffinity()
            .delete(policyCriteria);
    }
});
