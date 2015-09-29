
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search anti-affinity policy operation [UNIT]', function () {

    var DataCenter = compute.DataCenter;

    var timeout = 10000;

    it('Should found policies by name', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenter: DataCenter.DE_FRANKFURT,
            name: 'My Policy'
        };

        compute
            .policies()
            .antiAffinity()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found policies by data center', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenter: DataCenter.DE_FRANKFURT
        };

        compute
            .policies()
            .antiAffinity()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should found all policies for account', function (done) {
        this.timeout(timeout);

        var criteria = {};

        compute
            .policies()
            .antiAffinity()
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
            .antiAffinity()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    });

    it('Should not found any policies by incorrect criteria', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenterId: "fakeId"
        };

        compute
            .policies()
            .antiAffinity()
            .find(criteria)
            .then(function(result) {
                assert.equal(result.length, 0);
            })
            .then(done);
    });

    function assertPolicies(criteria) {
        return function(policies) {
            assert.notEqual(policies.length, 0);

            if (criteria.dataCenter) {
                _.each(policies, _.partial(assertDataCenter, _, criteria.dataCenter));
            }

            if (criteria.name) {
                _.each(policies, _.partial(assertName, _, criteria.name));
            }

            if (criteria.nameContains) {
                _.each(policies, _.partial(assertNameContains, _, criteria.nameContains));
            }
        };
    }

    function assertDataCenter(policy, dataCenter) {
        assert.equal(policy.location, dataCenter.id.toUpperCase());
    }

    function assertName(policy, name) {
        assert.equal(policy.name, name);
    }

    function assertNameContains(policy, pattern) {
        assert(policy.name.toUpperCase().indexOf(pattern.toUpperCase()) > -1);
    }

});