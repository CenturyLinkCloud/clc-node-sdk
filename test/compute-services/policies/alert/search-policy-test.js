
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search alert policy operation [UNIT]', function () {

    var timeout = 2000;

    it('Should found policies by name', function (done) {
        this.timeout(timeout);

        var criteria = {
            name: 'My Alert Policy'
        };

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found policies by recipient', function (done) {
        this.timeout(timeout);

        var criteria = {
            where: function(policy) {
                return policy.actions[0].settings.recipients.indexOf("user@company.com") > -1;
            }
        };

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found all policies for account', function (done) {
        this.timeout(timeout);

        var criteria = {};

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found policies that name contains keyword', function (done) {
        this.timeout(timeout);

        var criteria = {
            nameContains: "PoLiCy"
        };

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found policies that contain metric', function (done) {
        this.timeout(timeout);

        var criteria = {
            metrics: compute.Policy.Alert.Metric.DISK
        };

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found policies that contain action', function (done) {
        this.timeout(timeout);

        var criteria = {
            actions: "email"
        };

        compute
            .policies()
            .alert()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    function assertPolicies(policies) {
        return function(criteria) {
            assert.notEqual(policies.length, 0);

            if (criteria.actions) {
                _.each(policies, _.partial(assertAction, _, criteria.actions));
            }

            if (criteria.metrics) {
                _.each(policies, _.partial(assertMetric, _, criteria.triggers));
            }

            if (criteria.name) {
                _.each(policies, _.partial(assertName, _, criteria.name));
            }

            if (criteria.nameContains) {
                _.each(policies, _.partial(assertNameContains, _, criteria.nameContains));
            }
        };
    }

    function assertAction(policy, actions) {
        assert(_.asArray(actions).indexOf(policy.actions[0].action) > -1);
    }

    function assertMetric(policy, triggers) {
        assert(_.asArray(triggers).indexOf(policy.triggers[0].metric) > -1);
    }

    function assertName(policy, name) {
        assert.equal(policy.name, name);
    }

    function assertNameContains(policy, pattern) {
        assert(policy.name.toUpperCase().indexOf(pattern) > -1);
    }

});