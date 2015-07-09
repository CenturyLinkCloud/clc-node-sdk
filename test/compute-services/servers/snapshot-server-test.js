
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk().computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Snapshot server operation [UNIT]', function () {
    var timeout = 10000;

    var criteria = {
        dataCenter: compute.DataCenter.DE_FRANKFURT,
        group: compute.Group.DEFAULT,
        nameContains: 'web57'
    };

    it('Should create snapshots', function (done) {
        this.timeout(timeout);

        compute.servers()
            .createSnapshot(criteria, 3)
            .then(loadServerDetails)
            .then(assertServers(assertSnapshotCount(1)))
            .then(done);
    });

    it('Should revert to snapshot', function (done) {
        this.timeout(timeout);

        compute.servers()
            .revertToSnapshot(criteria)
            .then(_.noop)
            .then(done);
    });

    it('Should delete snapshots', function (done) {
        this.timeout(timeout);

        compute.servers()
            .deleteSnapshot(criteria)
            .then(loadServerDetails)
            .then(assertServers(assertSnapshotCount(0)))
            .then(done);
    });


    function loadServerDetails(serverRefs) {
        assert(!_.isEmpty(serverRefs));

        return compute.servers().find(serverRefs);
    }

    function assertServers(assertFn) {
        return function(servers) {
            _.each(servers, assertFn);
        };
    }

    function assertSnapshotCount(count) {
        return function(server) {
            assert.equal(server.details.snapshots.length, count);
        };
    }
});