
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
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "stopped"))
            .then(done);
    });

    it('Should power on servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .powerOn(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should pause servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .pause(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "paused"))
            .then(done);
    });

    it('Should start maintenance servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .startMaintenance(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInMaintenanceMode, true))
            .then(done);
    });

    it('Should stop maintenance servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .stopMaintenance(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInMaintenanceMode, false))
            .then(done);
    });

    it('Should reboot servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .reboot(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should reset servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .reset(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should shut down servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .shutDown(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "stopped"))
            .then(done);
    });



    it('Should archive servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .archive(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInState, "archived"))
            .then(done);
    });

    function loadServerDetails(serverRefs) {
        assert(!_.isEmpty(serverRefs));

        return compute.servers().find(serverRefs);
    }

    function assertServersState(assertFn, state) {
        return function(servers) {
            _.each(servers,  _.partial(assertFn, _, state));
        };
    }

    function assertThatServerInState(server, state) {
        assert.equal(server.status, state);
    }

    function assertThatServerInMaintenanceMode(server, flag) {
        assert.equal(server.details.inMaintenanceMode, flag);
    }

    function assertThatServerInPowerState(server, state) {
        assert.equal(server.details.powerState, state);
    }
});