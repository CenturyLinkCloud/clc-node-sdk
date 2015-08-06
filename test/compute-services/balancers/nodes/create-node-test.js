
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_password').computeServices();
var assert = require('assert');


vcr.describe('Create Load Balancer Node Operation [UNIT]', function () {
    var timeout = 10 * 1000;


    it('Should create node for pool', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .nodes()
            .create({
                pool: {port: compute.Server.Port.HTTP},
                nodes: [{
                    ipAddress: '66.155.4.73',
                    privatePort: 8082
                }]
            })
            .then(compute.balancers().nodes().findSingle)
            .then(assertNode)

            .then(deleteNode)

            .then(function () {
                done();
            });
    });

    function assertNode(node) {
        assert.equal(node.ipAddress, '66.155.4.73');
        assert.equal(node.privatePort, 8082);
        assert.equal(node.status, 'enabled');

        return node;
    }

    function deleteNode (nodeCriteria) {
        return compute.balancers().nodes().delete(nodeCriteria);
    }
});
