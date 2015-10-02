
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search network operation [UNIT]', function () {

    var timeout = 10 * 1000;

    function assertThatSingleResultNotEmpty(result) {
        assert.equal(result.length, 1);
        assertThatResultNotEmpty(result);

        return result[0];
    }

    function assertThatResultNotEmpty(result) {
        assert(!_.isEmpty(result));

        return result;
    }

    it('Should found network by id', function (done) {
        this.timeout(timeout);

        var networkId = '34567c36e2bf47d6afbba207a3a28a5c';

        compute
            .networks()
            .find({
                id: networkId
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.id, networkId);
            })
            .then(done);
    });

    it('Should found network by name', function (done) {
        this.timeout(timeout);

        var networkName = 'vlan_418_10.110.218';

        compute
            .networks()
            .find({
                name: networkName
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.name, networkName);
            })
            .then(done);
    });

    it('Should found network by gateway', function (done) {
        this.timeout(timeout);

        var gateway = '10.110.37.1';

        compute
            .networks()
            .find({
                gateway: gateway
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.gateway, gateway);
            })
            .then(done);
    });

    it('Should found network by netmask', function (done) {
        this.timeout(timeout);

        var netmask = '255.255.255.0';

        compute
            .networks()
            .find({
                netmask: netmask
            })
            .then(assertThatResultNotEmpty)
            .then(function(networks) {
                _.each(networks, function(network) {
                    assert.equal(network.netmask, netmask);
                });
            })
            .then(done);
    });

    it('Should found network by vlan', function (done) {
        this.timeout(timeout);

        var vlan = 719;

        compute
            .networks()
            .find({
                vlan: vlan
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                    assert.equal(network.vlan, vlan);
            })
            .then(done);
    });

    it('Should not found any network', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({
                dataCenterId: 'test'
            })
            .then(function(result) {
                assert.equal(result.length, 0);
            })
            .then(function () {
                done();
            });
    });

    it('Should found all networks', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({})
            .then(function (result) {
                assert.equal(result.length > 0, true);
                done();
            });
    });

    it('Should found network by composite criteria', function (done) {
        this.timeout(timeout);

        var netmask = '255.255.255.0';
        var gateway = '10.110.37.1';

        compute
            .networks()
            .find(
            {
                and: [
                    {netmask: netmask},
                    {gateway: gateway},
                    {dataCenter: compute.DataCenter.DE_FRANKFURT}
                ]
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.netmask, netmask);
                assert.equal(network.gateway, gateway);
                assert.equal(network.dataCenter.id, compute.DataCenter.DE_FRANKFURT.id);
            })
            .then(done);
    });

});