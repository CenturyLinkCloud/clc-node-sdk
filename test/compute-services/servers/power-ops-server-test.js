
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Power operations server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;

    var timeout = 1000000;

    it('Should power off servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOff(
            {
                dataCenter: DataCenter.DE_FRANKFURT,
                nameContains: 'web58'
            })
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "stopped"));
            })
            .then(done);
    });


    it('Should power on servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOn(
            {
                dataCenter: DataCenter.DE_FRANKFURT,
                nameContains: 'web58'
            })
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "started"));
            })
            .then(done);
    });

    it('Should pause servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .pause({
                dataCenter: DataCenter.DE_FRANKFURT,
                nameContains: 'web58'
            })
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "paused"));
            })
            .then(done);
    });

    function assertThatServerInState(modifiedServer, state) {

        assert.equal(modifiedServer.details.powerState, state);
    }
});