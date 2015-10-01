
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");
var toCidr = require('./../../../../lib/compute-services/policies/firewall/domain/ip-converter');

vcr.describe('Search firewall policy operation [UNIT]', function () {

    var DataCenter = compute.DataCenter;
    var Port = compute.policies().firewall().Port;

    var timeout = 1000;

    it('Should found policies by status', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenter: DataCenter.DE_FRANKFURT,
            status: 'active'
        };

        testPolicies(criteria, done);
    });

    it('Should found policies by data center', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenter: DataCenter.DE_FRANKFURT
        };

        testPolicies(criteria, done);
    });

    it('Should found all policies for account', function (done) {
        this.timeout(timeout);

        var criteria = {};

        testPolicies(criteria, done);
    });

    it('Should found disabled policies', function (done) {
        this.timeout(timeout);

        var criteria = {
            enabled: false
        };

        testPolicies(criteria, done);
    });

    it('Should found policies by destination account', function (done) {
        this.timeout(timeout);

        var criteria = {
            destinationAccount: 'ALTD'
        };

        testPolicies(criteria, done);
    });

    it('Should found policies by source', function (done) {
        this.timeout(timeout);

        var criteria = {
            source: ['10.110.37.0/24', {ip: '10.110.192.128', mask: '255.255.255.128'}]
        };

        testPolicies(criteria, done);
    });

    it('Should found policies by destination', function (done) {
        this.timeout(timeout);

        var criteria = {
            destination: ['10.110.37.0/24', {ip: '10.110.192.0', mask: '255.255.255.240'}]
        };

        testPolicies(criteria, done);
    });

    it('Should found policies by ports', function (done) {
        this.timeout(timeout);

        var criteria = {
            ports: [Port.PING, Port.TCP(123,125)]
        };

        testPolicies(criteria, done);
    });

    it('Should not found any policies by incorrect criteria', function (done) {
        this.timeout(timeout);

        var criteria = {
            dataCenterId: "fakeId"
        };

        compute
            .policies()
            .firewall()
            .find(criteria)
            .then(function(result) {
                assert.equal(result.length, 0);
            })
            .then(done);
    });

    it('Should found policies by composite criteria', function (done) {
        this.timeout(timeout);

        var criteria = {
            and: [
                {
                    status: "active",
                    dataCenter: DataCenter.DE_FRANKFURT
                },
                {
                    enabled: false,
                    where: function(metadata) {
                        return metadata.source.length === 2;
                    }
                }
            ]
        };

        compute
            .policies()
            .firewall()
            .find(criteria)
            .then(function(result) {
                assert.equal(result.length, 1);

                var policy = result[0];
                assert.equal(policy.status, 'active');
                assert.equal(policy.dataCenter.id, DataCenter.DE_FRANKFURT.id);
                assert.equal(policy.enabled, false);
                assert.equal(policy.source.length, 2);
            })
            .then(done);
    });

    function testPolicies(criteria, done) {
        compute
            .policies()
            .firewall()
            .find(criteria)
            .then(assertPolicies(criteria))
            .then(done);
    }

    function assertPolicies(criteria) {
        return function(policies) {
            assert.notEqual(policies.length, 0);

            assertValue(policies, criteria, 'dataCenter', assertDataCenter);
            assertValue(policies, criteria, 'status', assertStatus);
            assertValue(policies, criteria, 'enabled', assertEnabled);
            assertValue(policies, criteria, 'destinationAccount', assertAccount);
            assertValue(policies, criteria, 'source', assertSource);
            assertValue(policies, criteria, 'destination', assertDestination);
            assertValue(policies, criteria, 'ports', assertPorts);
        };
    }

    function assertValue(policies, criteria, property, assertFn) {
        if (criteria[property]) {
            _.each(policies, _.partial(assertFn, _, criteria[property]));
        }
    }

    function assertDataCenter(policy, dataCenter) {
        assert.equal(policy.dataCenter.id.toUpperCase(), dataCenter.id.toUpperCase());
    }

    function assertStatus(policy, status) {
        assert.equal(policy.status, status);
    }

    function assertEnabled(policy, status) {
        assert.equal(policy.enabled, status);
    }

    function assertAccount(policy, account) {
        assert.equal(policy.destinationAccount.toUpperCase(), account.toUpperCase());
    }

    function assertSource(policy, source) {
        assert(_.intersection(policy.source, toCidr(source)).length > 0);
    }

    function assertDestination(policy, destination) {
        assert(_.intersection(policy.destination, toCidr(destination)).length > 0);
    }

    function assertPorts(policy, ports) {
        assert(_.intersection(policy.ports, ports).length > 0);
    }

});