
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Search server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;

    var timeout = 10000;

    it('Should find server by ID reference', function (done) {
        this.timeout(timeout);

        compute.servers()
            .findSingle({ id: 'de1altdweb580' })
            .then(function (result) {
                assert.equal(result != null, true);

                done();
            });
    });

    it('Should search servers', function (done) {
        this.timeout(timeout);

        compute
            .servers()
            .find({
                nameContains:'web',
                onlyActive: true,
                powerStates: ['started'],
                dataCenter: [{id : 'ca1'}],
                dataCenterId: 'de1',
                dataCenterName: DataCenter.DE_FRANKFURT.name,
                group: {name: 'Default Group'}
            })
            .then(function(servers) {
                assert.equal(_.every(servers, function(srv) {
                    return srv.status === "active" &&
                        srv.name.indexOf('WEB') > -1 &&
                        ["DE1", "CA1"].indexOf(srv.locationId) > -1 &&
                        srv.details.powerState === "started";
                }), true);

                done();
            });
    });

    it('Should search all servers', function (done) {
        this.timeout(timeout);

        compute
            .servers()
            .find()
            .then(function(servers) {
                assert(servers.length > 0);

                done();
            });
    });

    it('Should not found any server by name', function (done) {
        this.timeout(timeout);

        compute
            .servers()
            .find({
                name: ''
            })
            .then(function(servers) {
                assert.equal(servers.length, 0);
                done();
            });
    });

    it('Should not found any server by id', function (done) {
        this.timeout(timeout);

        compute
            .servers()
            .find({
                id: 0
            })
            .then(function(servers) {
                assert.equal(servers.length, 0);
                done();
            });
    });

    it('Should find for null and undefined criteria values', function (done) {
        this.timeout(timeout);

        compute
            .servers()
            .find({
                name: null,
                powerStates: undefined
            })
            .then(function(servers) {
                assert.equal(servers.length, 0);
                done();
            });
    });
});