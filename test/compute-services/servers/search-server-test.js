
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Search server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;

    it('Should find server by ID reference', function (done) {
        this.timeout(10000);

        compute.servers()
            .findByRef({ id: 'de1altdweb580' })
            .then(function (result) {
                assert.equal(result != null, true);

                done();
            });
    });

    it('Should search servers', function (done) {
        this.timeout(30000);

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
});