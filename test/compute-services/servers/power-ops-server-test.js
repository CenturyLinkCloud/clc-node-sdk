
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Power operations server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    var timeout = 10000;

    var criteria = {
        dataCenter: DataCenter.DE_FRANKFURT,
        nameContains: 'web58'
    };

    it('Should power off servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOff(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "stopped"))
            .then(done);
    });

    it('Should power on servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOn(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should pause servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .pause(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "paused"))
            .then(done);
    });

    it('Should start maintenance servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .startMaintenance(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInMaintenanceMode, true))
            .then(done);
    });

    it('Should stop maintenance servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .stopMaintenance(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInMaintenanceMode, false))
            .then(done);
    });



    it('Should shut down servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .shutDown(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "stopped"))
            .then(done);
    });

    it('Should reboot servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .powerOn(criteria)
            .then(_.partial(compute.servers().reboot, criteria))
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should reset servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .reset(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInPowerState, "started"))
            .then(done);
    });

    it('Should archive servers', function (done) {
        this.timeout(timeout);

        compute.servers()
            .archive(criteria)
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInState, "archived"))
            .then(done);
    });

    it('Should restore servers to Default Group', function (done) {
        this.timeout(timeout);

        compute.servers()
            .restore(criteria,
            {
                dataCenter: DataCenter.DE_FRANKFURT,
                name: Group.DEFAULT
            })
            .then(loadServerDetails)
            .then(assertServersState(assertThatServerInState, "active"))
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