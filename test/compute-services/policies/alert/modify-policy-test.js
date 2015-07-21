
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify alert policy Operation [UNIT]', function () {
    var policies = compute.policies();

    vcr.it('Should modify policy name', function (done) {
        this.timeout(2 * 1000);

        createPolicy({name: 'Policy 1'})
            .then(_.partial(modifyPolicy, {
                name: 'Policy 2',
                triggers: [
                    {
                        metric:compute.Policy.Alert.Metric.DISK,
                        duration:5,
                        threshold: 80
                    }
                ]
            }))

            .then(assertThatPolicyRefIsCorrect)
            .then(_.partial(assertThatPolicyNameIs, 'Policy 2'))

            .then(deletePolicy(done));
    });

    function createPolicy (config) {
        return policies
            .alert()
            .create(_.defaults(config, {
                actions: [
                    "user@company.com"
                ],
                triggers: [
                    {
                        metric:compute.Policy.Alert.Metric.CPU,
                        duration:5,
                        threshold: 80
                    }
                ]
            }))
            .then(assertThatPolicyRefIsCorrect);
    }

    function assertThatPolicyNameIs (name, ref) {
        return policies
            .alert()
            .findSingle({name: name})
            .then(function(policy) {
                assert.equal(policy.name, name);
            })
            .then(_.partial(Promise.resolve, ref));
    }

    function modifyPolicy(config, policy) {
        return policies
            .alert()
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
                .alert()
                .delete(policyCriteria)
                .then(_.partial(done, undefined));
        };
    }
});