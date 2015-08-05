
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify Load Balancer Node Operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var balancers = compute.balancers();

    vcr.it('Should modify all nodes', function (done) {
        this.timeout(timeout);

        var privatePort = 8088;

        balancers.nodes().find()
            .then(function(nodes) {
                return balancers.nodes().modify(nodes, {privatePort: privatePort});
            })
            .then(findNodes({}))
            .then(function(result) {
                _.each(result, function(node) {
                    assert.equal(node.privatePort, privatePort);
                });
            })

            .then(done);
    });

    vcr.it('Should modify node', function (done) {
        this.timeout(timeout);

        var criteria = {
            status: 'disabled'
        };

        balancers.nodes().find({poolPort: 80})
            .then(_.partial(balancers.nodes().modify, _, {status: 'disabled'}))
            .then(findNodes(criteria))
            .then(function(result) {
                assert.notEqual(result.length, 0);

                return result;
            })
            .then(_.partial(balancers.nodes().modify, _, {status: 'enabled'}))
            .then(findNodes(criteria))
            .then(function(result) {
                assert.equal(result.length, 0);
            })
            .then(done);
    });

    function findNodes(criteria) {
        return function() {
            return balancers.nodes().find(criteria);
        };
    }
});