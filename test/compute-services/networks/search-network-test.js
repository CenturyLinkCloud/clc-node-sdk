
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk(/*'cloud_user', 'cloud_user_password'*/).computeServices();
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search network operation [UNIT]', function () {

    var timeout = 1000 * 1000;

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

        compute
            .networks()
            .find({
                id: '34567c36e2bf47d6afbba207a3a28a5c'
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.id, '34567c36e2bf47d6afbba207a3a28a5c');
            })
            .then(done);
    });

    it('Should found network by name', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({
                name: 'vlan_418_10.110.218'
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.name, 'vlan_418_10.110.218');
            })
            .then(done);
    });

    it('Should found network by gateway', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({
                gateway: '10.110.37.1'
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.gateway, '10.110.37.1');
            })
            .then(done);
    });

    it('Should found network by netmask', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({
                netmask: '255.255.255.0'
            })
            .then(assertThatResultNotEmpty)
            .then(function(networks) {
                _.each(networks, function(network) {
                    assert.equal(network.netmask, '255.255.255.0');
                });
            })
            .then(done);
    });

    it('Should found network by vlan', function (done) {
        this.timeout(timeout);

        compute
            .networks()
            .find({
                vlan: 719
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                    assert.equal(network.vlan, 719);
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

        compute
            .networks()
            .find(
            {
                and: [
                    {netmask: '255.255.255.0'},
                    {gateway: '10.110.37.1'},
                    {dataCenter: compute.DataCenter.DE_FRANKFURT}
                ]
            })
            .then(assertThatSingleResultNotEmpty)
            .then(function(network) {
                assert.equal(network.netmask, '255.255.255.0');
                assert.equal(network.gateway, '10.110.37.1');
                assert.equal(network.dataCenter.id, compute.DataCenter.DE_FRANKFURT.id)
            })
            .then(done);
    });

});