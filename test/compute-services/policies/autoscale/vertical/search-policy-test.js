
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search vertical autoscale policy operation [UNIT]', function () {

    var timeout = 1000;

    function testPolicies(criteria, done) {
        return compute
            .policies()
            .autoScale()
            .vertical()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    }

    it('Should found policies by name', function (done) {
        this.timeout(timeout);

        testPolicies({
            name: 'My AutoScale Policy'
        }, done);
    });

    it('Should found policies by name contains', function (done) {
        this.timeout(timeout);

        testPolicies({
            nameContains: 'mY'
        }, done);
    });

    it('Should found policies by resource type', function (done) {
        this.timeout(timeout);

        testPolicies({
            resourceType: 'cpu'
        }, done);
    });

    it('Should found policies by threshold period', function (done) {
        this.timeout(timeout);

        testPolicies({
            thresholdPeriod: 15
        }, done);
    });

    it('Should found policies by scaleUp increment', function (done) {
        this.timeout(timeout);

        testPolicies({
            scaleUpIncrement: 2
        }, done);
    });

    it('Should found policies by scaleUp threshold', function (done) {
        this.timeout(timeout);

        testPolicies({
            scaleUpThreshold: 80
        }, done);
    });

    it('Should found policies by scaleDown threshold', function (done) {
        this.timeout(timeout);

        testPolicies({
            scaleDownThreshold: 20
        }, done);
    });

    it('Should found policies by custom predicate', function (done) {
        this.timeout(timeout);

        testPolicies({
            where: function(policy) {
                return policy.range.min === 2 && policy.range.max === 4 &&
                    policy.scaleDownWindow.start === '02:00' && policy.scaleDownWindow.end === '05:00';
            }
        }, done);
    });

    function assertPolicies(criteria) {
        return function(policies) {
            assert.notEqual(policies.length, 0);

            if (criteria.name) {
                _.each(policies, _.partial(assertProperty, _, 'name', criteria.name));
            }

            if (criteria.nameContains) {
                _.each(policies, _.partial(assertNameContains, _, criteria.nameContains));
            }

            if (criteria.resourceType) {
                _.each(policies, _.partial(assertProperty, _, 'resourceType', criteria.resourceType));
            }

            if (criteria.thresholdPeriod) {
                _.each(policies, _.partial(assertProperty, _, 'thresholdPeriodMinutes', criteria.thresholdPeriod));
            }

            if (criteria.scaleUpIncrement) {
                _.each(policies, _.partial(assertProperty, _, 'scaleUpIncrement', criteria.scaleUpIncrement));
            }

            if (criteria.scaleUpThreshold) {
                _.each(policies, _.partial(assertProperty, _, 'scaleUpThreshold', criteria.scaleUpThreshold));
            }

            if (criteria.scaleDownThreshold) {
                _.each(policies, _.partial(assertProperty, _, 'scaleDownThreshold', criteria.scaleDownThreshold));
            }

            if (criteria.where) {
                _.each(policies, function(policy) {
                    assert(criteria.where(policy));
                });
            }
        };
    }

    function assertNameContains(policy, pattern) {
        assert(policy.name.toUpperCase().indexOf(pattern.toUpperCase()) > -1);
    }

    function assertProperty(obj, property, value) {
        assert.equal(obj[property], value);
    }

});