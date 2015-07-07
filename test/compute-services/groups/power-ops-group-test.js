
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Power operations group operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    var timeout = 100000000;

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
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "stopped"));
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
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "started"));
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
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "paused"));
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

    it('Should reboot servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .reboot(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "started"));
            })
            .then(done);
    });

    it('Should reset servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .reset(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "started"));
            })
            .then(done);
    });

    it('Should shut down servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .shutDown(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInPowerState, _, "stopped"));
            })
            .then(done);
    });



    it('Should archive servers', function (done) {
        this.timeout(timeout);

        compute.groups()
            .archive(criteria)
            .then(function (serverRefs) {
                assert.equal(!_.isEmpty(serverRefs), true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                _.each(modifiedServers, _.partial(assertThatServerInState, _, "archived"));
            })
            .then(done);
    });

    //it('Should restore servers to Power operations group', function (done) {
    //    this.timeout(timeout);
    //
    //    criteria.nameContains = Group.ARCHIVE;
    //
    //    compute.groups()
    //        .restore(criteria,
    //        {
    //            dataCenter: DataCenter.DE_FRANKFURT,
    //            nameContains: "power"
    //        })
    //        .then(function (serverRefs) {
    //            assert.equal(!_.isEmpty(serverRefs), true);
    //
    //            return compute.servers().find(serverRefs);
    //        })
    //        .then(function(modifiedServers) {
    //            _.each(modifiedServers, _.partial(assertThatServerInState, _, "active"));
    //        })
    //        .then(done);
    //});

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