
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk(/*'cloud_user', 'cloud_password'*/).computeServices();
var assert = require('assert');


vcr.describe('Modify Shared Load Balancer with Pools Operation [UNIT]', function () {
    var timeout = 1000 * 1000;

    var balancerName = 'Super Balancer';
    var newBalancerName = balancerName + " updated";
    var dataCenter = compute.DataCenter.CA_TORONTO_1;
    var ports = [8087, 8088];
    var ip = "66.155.96.53";

    var modificationConfig = {
        name: newBalancerName,
        pool: [
            {
                port: compute.Server.Port.HTTP,
                method: compute.balancers().pools().Method.LEAST_CONNECTION,
                nodes: [{
                    ipAddress: ip,
                    privatePort: ports[0]
                }, {
                    ipAddress: ip,
                    privatePort: ports[1],
                    status: compute.balancers().nodes().Status.DISABLED
                }]
            }
        ]
    };

    it('Should update Balancer in CA2', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .groups()
            .modify(
                {
                    name: balancerName
                },
                modificationConfig
            )
            .then(assertThatBalancerRefIsCorrect)
            .then(compute.balancers().groups().findSingle)
            .then(assertBalancer)

            .then(deleteBalancer)

            .then(function () {
                done();
            });
    });

    it('Should update Balancer and add pool in CA2', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .groups()
            .modify(
                {
                    name: balancerName
                },
                modificationConfig
            )
            .then(assertThatBalancerRefIsCorrect)
            .then(compute.balancers().groups().findSingle)
            .then(assertBalancer)

            .then(deleteBalancer)

            .then(function () {
                done();
            });
    });

    function assertThatBalancerRefIsCorrect (refValue) {
        var ref = refValue instanceof Array ? refValue[0] : refValue;
        assert(!_.isUndefined(ref.id));

        return ref;
    }

    function assertBalancer(balancer) {
        assert.equal(balancer.status, "enabled");
        assert.equal(balancer.name, newBalancerName);

        assert.equal(balancer.dataCenter.id, dataCenter.id);

        assert.equal(balancer.pools.length, 1);

        _.each(balancer.pools, function(pool) {
            assert.equal(pool.nodes.length, 2);
            assert.equal(pool.method, compute.balancers().pools().Method.LEAST_CONNECTION);

            _.each(pool.nodes, function(node) {
                assert(ports.indexOf(node.privatePort) > -1);
            });
        });

        return balancer;
    }

    function deleteBalancer (balancerCriteria) {
        return compute.balancers().groups().delete(balancerCriteria);
    }
});
