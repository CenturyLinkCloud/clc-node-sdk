
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify firewall policy Operation [UNIT]', function () {
    var policies = compute.policies();
    var DataCenter = compute.DataCenter;
    var Port = policies.firewall().Port;

    vcr.it('Should modify policy', function (done) {
        this.timeout(5 * 1000);

        createPolicy()
            .then(_.partial(modifyPolicy))
            .then(assertThatPolicyRefIsCorrect)
            .then(_.partial(assertPolicy))

            .then(deletePolicy(done));
    });

    function createPolicy () {
        return policies
            .firewall()
            .create({
                dataCenter: DataCenter.DE_FRANKFURT,
                source: '10.110.37.0/24',
                destination: '10.110.37.0/24',
                ports: [Port.PING, Port.TCP(123, 125), Port.UDP(555)]
            })
            .then(assertThatPolicyRefIsCorrect);
    }

    function assertPolicy (ref) {
        return policies
            .firewall()
            .findSingle(ref)
            .then(function(policy) {
                assert.equal(policy.source.length, 2);
                assert.equal(policy.destination[0], '10.110.37.0/26');
                assert.equal(policy.ports[0], Port.PING);
            })
            .then(_.partial(Promise.resolve, ref));
    }

    function modifyPolicy(policy) {
        return policies
            .firewall()
            .modify(policy, {
                source: ['10.110.37.0/26', '10.110.37.0/24'],
                destination: '10.110.37.0/26',
                ports: [Port.PING]
            })
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
                .firewall()
                .delete(policyCriteria)
                .then(_.partial(done, undefined));
        };
    }
});