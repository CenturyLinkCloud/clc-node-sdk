
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require("underscore");
var TestAsserts = require("./../../../test-asserts.js");

vcr.describe('Search Load Balancer Node operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var nodes = compute.balancers().nodes();

    it('Should found nodes', function (done) {
        this.timeout(timeout);

        nodes
            .find({
                privatePort: [8080],
                status: ['enabled'],
                ipAddress: ['66.155.4.73']
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                var node = _.first(result);
                assert.equal(node.privatePort, 8080);
                assert.equal(node.status, 'enabled');
                assert.equal(node.ipAddress, '66.155.4.73');
            })
            .then(done);
    });

    it('Should found nodes by pool', function (done) {
        this.timeout(timeout);

        nodes
            .find({
                poolPort: compute.Server.Port.HTTP
            })
            .then(function(result) {
                TestAsserts.assertThatResultNotEmpty(result);

                _.each(result, function(node) {
                    assert.equal(node.pool.port, compute.Server.Port.HTTP);
                });
            })
            .then(done);
    });

    it('Should found all nodes', function (done) {
        this.timeout(timeout);

        nodes
            .find()
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(done);
    });

    it('Should not found any node', function (done) {
        this.timeout(timeout);

        nodes
            .find({
                privatePort: 100500
            })
            .then(TestAsserts.assertThatArrayIsEmpty)
            .then(done);
    });

    it('Should found nodes with composite criteria', function (done) {
        this.timeout(timeout);

        nodes
            .find({
                and: [
                    {
                        privatePort: 8080,
                        poolMethod: 'roundRobin'
                    },
                    {
                        poolPersistence: 'standard',
                        status: 'enabled'
                    }
                ]
            })
            .then(function(result) {
                assert.equal(result.length, 1);

                var node = result[0];

                assert.equal(node.privatePort, 8080);
                assert.equal(node.pool.method, 'roundRobin');
                assert.equal(node.pool.persistence, 'standard');
                assert.equal(node.status, 'enabled');
            })
            .then(done);
    });

});