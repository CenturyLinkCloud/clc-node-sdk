
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");
var TestAsserts = require("./../../../test-asserts.js");

vcr.describe('Search Shared Load Balancer operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var groups = compute.balancers().groups();
    var DataCenter = compute.DataCenter;

    it('Should found balancers by name', function (done) {
        this.timeout(timeout);

        groups
            .find({
                dataCenter: DataCenter.DE_FRANKFURT,
                name: 'Balancer'
            })
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(done);
    });

    it('Should found balancers by status', function (done) {
        this.timeout(timeout);

        groups
            .find({
                dataCenter: DataCenter.DE_FRANKFURT,
                status: 'enabled'
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                _.each(result, function(balancer) {
                    assert.equal(balancer.status, 'enabled');
                });
            })
            .then(done);
    });

    it('Should found balancer by ip', function (done) {
        this.timeout(timeout);

        groups
            .find({
                dataCenter: DataCenter.DE_FRANKFURT,
                ip: ['66.155.4.118']
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);
                assert.equal(result.length, 1);

                return result;
            })
            .then(_.first)
            .then(function(balancer) {
                assert.equal(balancer.ipAddress, '66.155.4.118');
            })
            .then(done);
    });

    it('Should found all balancers', function (done) {
        this.timeout(timeout);

        groups
            .find()
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(done);
    });

    it('Should not found any balancer', function (done) {
        this.timeout(timeout);

        groups
            .find({
                name: "Blah"
            })
            .then(TestAsserts.assertThatArrayIsEmpty)
            .then(done);
    });

    it('Should found balancer with composite criteria', function (done) {
        this.timeout(timeout);

        groups
            .find({
                and: [
                    {
                        name: 'Balancer',
                        dataCenterId: 'de1'
                    },
                    {
                        descriptionContains: "Test",
                        ip: '66.155.4.118'
                    }
                ]
            })
            .then(function(result) {
                assert.equal(result.length, 1);
                assert.equal(result[0].name, 'Balancer');
                assert.equal(result[0].ipAddress, '66.155.4.118');
                assert.equal(result[0].dataCenter.id, 'de1');
            })
            .then(done);
    });

});