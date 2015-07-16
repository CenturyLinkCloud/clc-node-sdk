
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify anti-affinity policy Operation [UNIT]', function () {
    var policies = compute.policies();
    var DataCenter = compute.DataCenter;

    vcr.it('Should modify policy name', function (done) {
        this.timeout(2 * 1000);

        createPolicy({name: 'Policy 1'})
            .then(_.partial(modifyPolicy, {name: 'Policy 2'}))

            .then(assertThatPolicyRefIsCorrect)
            .then(_.partial(assertThatPolicyNameIs, 'Policy 2'))

            .then(deletePolicy(done));
    });

    function createPolicy (config) {
        return policies
            .antiAffinity()
            .create(_.defaults(config, {
                dataCenter: DataCenter.DE_FRANKFURT
            }))
            .get(0)
            .then(assertThatPolicyRefIsCorrect);
    }

    function assertThatPolicyNameIs (name, refs) {
        return policies
            .antiAffinity()
            .findSingle({name: name})
            .then(function(policy) {
                assert.equal(policy.name, name);
            })
            .then(_.partial(Promise.resolve, refs));
    }

    function modifyPolicy(config, policy) {
        return policies
            .antiAffinity()
            .modify(policy, config)
            .get(0)
            .then(assertThatPolicyRefIsCorrect);
    }

    function assertThatPolicyRefIsCorrect (ref) {
        assert(!_.isUndefined(ref.id));

        return ref;
    }

    function deletePolicy (done) {
        return function (policyCriteria) {
            return policies
                .antiAffinity()
                .delete(policyCriteria)
                .then(_.partial(done, undefined));
        };
    }
});