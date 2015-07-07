
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Power operations group operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;

    var timeout = 10000;

    var criteria = {
        dataCenter: DataCenter.DE_FRANKFURT,
        nameContains: 'Power'
    };

    it('Should power off servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .powerOff(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "stopped"));
            })
            .then(done);
    });

    it('Should power on servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .powerOn(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "started"));
            })
            .then(done);
    });

    it('Should pause servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .pause(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "paused"));
            })
            .then(done);
    });

    it('Should start maintenance servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .startMaintenance(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInMaintenanceMode, _, true));
            })
            .then(done);
    });

    it('Should stop maintenance servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .stopMaintenance(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInMaintenanceMode, _, false));
            })
            .then(done);
    });

    function assertThatServerInMaintenanceMode(server, flag) {
        assert.equal(server.details.inMaintenanceMode, flag);
    }

    function assertThatServerInState(server, state) {
        assert.equal(server.details.powerState, state);
    }
});