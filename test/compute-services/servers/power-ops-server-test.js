
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Power operations server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;

    var timeout = 10000;

    var criteria = {
        dataCenter: DataCenter.DE_FRANKFURT,
        nameContains: 'web58'
    };

    it('Should power off servers', function (done) {
        this.timeout(timeout);

        compute.servers()
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

        compute.servers()
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

        compute.servers()
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

        compute.servers()
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

        compute.servers()
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



    it('Should shut down servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .shutDown(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "stopped"));
            })
            .then(done);
    });

    it('Should reboot servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOn(criteria)
            .then(_.partial(compute.servers().reboot, criteria))
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "started"));
            })
            .then(done);
    });

    it('Should reset servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .reset(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "started"));
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