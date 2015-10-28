
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_password').computeServices();
var assert = require('assert');


vcr.describe('Create Shared Load Balancer with Pools Operation [UNIT]', function () {
    var timeout = 10 * 1000;

    var balancerName = 'Super Balancer';
    var balancerDescription = 'Test Balancer';
    var dataCenter = compute.DataCenter.CA_TORONTO_1;
    var publicIP = "66.155.96.53";

    it('Should create Balancer in CA2', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .groups()
            .create({
                dataCenter: dataCenter,
                name: balancerName,
                description: balancerDescription,
                pool:[
                    {
                        port: compute.Server.Port.HTTP,
                        method: compute.balancers().pools().Method.LEAST_CONNECTION,
                        persistence: compute.balancers().pools().Persistence.STICKY,
                        nodes: [
                            {
                                ipAddress: publicIP,
                                privatePort: 8080
                            },
                            {
                                ipAddress: publicIP,
                                privatePort: 8081
                            }
                        ]
                    }
                ]
            })
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
        assert.equal(balancer.name, balancerName);
        assert.equal(balancer.description, balancerDescription);

        assert.equal(balancer.dataCenter.id, dataCenter.id);

        assert.equal(balancer.pools.length, 1);

        _.each(balancer.pools, function(pool) {
            assert.equal(pool.nodes.length, 2);
            assert.equal(pool.method, compute.balancers().pools().Method.LEAST_CONNECTION);
            assert.equal(pool.persistence, compute.balancers().pools().Persistence.STICKY);
        });

        return balancer;
    }

    function deleteBalancer (balancerCriteria) {
        return compute.balancers().groups().delete(balancerCriteria);
    }
});
