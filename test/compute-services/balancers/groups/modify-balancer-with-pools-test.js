//
//var _ = require('underscore');
//var vcr = require('nock-vcr-recorder-mocha');
//var Sdk = require('./../../../../lib/clc-sdk.js');
//var compute = new Sdk(/*'cloud_user', 'cloud_password'*/).computeServices();
//var assert = require('assert');
//
//
//vcr.describe('Modify Shared Load Balancer with Pools Operation [UNIT]', function () {
//    var timeout = 1000 * 1000;
//
//    var balancerName = 'Super Balancer';
//    var dataCenter = compute.DataCenter.CA_TORONTO_1;
//
//    it('Should update Balancer in GB1', function (done) {
//        this.timeout(timeout);
//
//        compute
//            .balancers()
//            .groups()
//            .modify(
//                {
//                    name: balancerName
//                },
//                {
//                name: balancerName + " updated",
//                pool:[
//                    {
//                        port: compute.Server.Port.HTTP,
//                        method: compute.balancers().pools().Method.LEAST_CONNECTION,
//                        nodes: [{
//                            ipAddress: '66.155.18.22',
//                            privatePort: 8087
//                        }, {
//                            ipAddress: '66.155.18.22',
//                            privatePort: 8088
//                        }]
//                    }
//                ]
//            })
//            .then(assertThatBalancerRefIsCorrect)
//            .then(compute.balancers().groups().findSingle)
//            .then(assertBalancer)
//
//            .then(deleteBalancer)
//
//            .then(function () {
//                done();
//            });
//    });
//
//    function assertThatBalancerRefIsCorrect (refValue) {
//        var ref = refValue instanceof Array ? refValue[0] : refValue;
//        assert(!_.isUndefined(ref.id));
//
//        return ref;
//    }
//
//    function assertBalancer(balancer) {
//        assert.equal(balancer.status, "enabled");
//        assert.equal(balancer.name, balancerName);
//
//        assert.equal(balancer.dataCenter.id, dataCenter.id);
//
//        assert.equal(balancer.pools.length, 2);
//
//        _.each(balancer.pools, function(pool) {
//            assert.equal(pool.nodes.length, 2);
//            assert.equal(pool.method, compute.balancers().pools().Method.LEAST_CONNECTION);
//
//            if (pool.port === compute.Server.Port.HTTP) {
//                assert.equal(pool.persistence, compute.balancers().pools().Persistence.STICKY);
//            } else {
//                assert.equal(pool.persistence, compute.balancers().pools().Persistence.STANDARD);
//            }
//        });
//
//        return balancer;
//    }
//
//    function deleteBalancer (balancerCriteria) {
//        return compute.balancers().groups().delete(balancerCriteria);
//    }
//});
