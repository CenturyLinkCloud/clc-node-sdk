
var _ = require('underscore');
var assert = require('assert');
var moment = require('moment');

var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

vcr.describe('Create alert policy Operation [UNIT]', function () {
    var timeout = 2 * 1000;

    it('Should create My Alert Policy', function (done) {
        this.timeout(timeout);

        var criteria = {
            name: 'My Alert Policy',
            actions: [
                {
                    action:"email",
                    settings:{
                        recipients:[
                            "user@company.com"
                        ]
                    }
                }
            ],
            triggers: [
                {
                    metric:compute.Policy.Alert.Metric.DISK,
                    duration: 5,
                    threshold: 80
                }
            ]
        };

        compute
            .policies()
            .alert()
            .create(criteria)
            .then(compute.policies().alert().findSingle)
            .then(_.partial(assertThatPolicyIsCorrect, criteria))

            .then(deletePolicies)

            .then(function () {
                done();
            });
    });

    function assertThatPolicyIsCorrect (criteria, policy) {
        assert(!_.isUndefined(policy.id));
        assert.equal(policy.name, criteria.name);

        assert.deepEqual(policy.actions, criteria.actions);

        assertTriggers(policy.triggers, criteria.triggers);

        return policy;
    }

    function assertTriggers(actual, expected) {
        assert.equal(actual.length, 1);
        assert.equal(expected.length, 1);

        assert.equal(actual[0].metric, expected[0].metric);
        assert.equal(actual[0].threshold, expected[0].threshold);
        assert(moment.duration(actual[0].duration).minutes(), expected[0].duration);
    }

    function deletePolicies (policyCriteria) {
        return compute
            .policies()
            .alert()
            .delete(policyCriteria);
    }
});
