
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");
var TestAsserts = require("./../../../test-asserts.js");

vcr.describe('Search Load Balancer Pool operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var pools = compute.balancers().pools();
    var DataCenter = compute.DataCenter;

    it('Should found pools by method', function (done) {
        this.timeout(timeout);

        pools
            .find({
                method: 'roundRobin'
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                _.each(result, function(pool) {
                    assert.equal(pool.method, 'roundRobin');
                });
            })
            .then(done);
    });

    it('Should found pools by persistence', function (done) {
        this.timeout(timeout);

        pools
            .find({
                persistence: 'standard'
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                _.each(result, function(pool) {
                    assert.equal(pool.persistence, 'standard');
                });
            })
            .then(done);
    });

    it('Should found balancer by load balancer', function (done) {
        this.timeout(timeout);

        pools
            .find({
                balancer: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: 'Balancer'
                }
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                _.each(result, function(pool) {
                    assert.equal(pool.balancer.name, 'Balancer');
                });
            })
            .then(done);
    });

    it('Should found all pools', function (done) {
        this.timeout(timeout);

        pools
            .find()
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(done);
    });

    it('Should not found any balancer', function (done) {
        this.timeout(timeout);

        pools
            .find({
                port: 100500
            })
            .then(TestAsserts.assertThatArrayIsEmpty)
            .then(done);
    });

    it('Should found pool with composite criteria', function (done) {
        this.timeout(timeout);

        pools
            .find({
                and: [
                    {
                        port: compute.Server.Port.HTTP,
                        balancerName: 'Balancer'
                    },
                    {
                        balancerDescriptionContains: "Test",
                        method: 'roundRobin'
                    }
                ]
            })
            .then(function(result) {
                assert.equal(result.length, 1);

                assert.equal(result[0].port, compute.Server.Port.HTTP);
                assert.equal(result[0].balancer.name, 'Balancer');
                assert.equal(result[0].method, 'roundRobin');
            })
            .then(done);
    });

});