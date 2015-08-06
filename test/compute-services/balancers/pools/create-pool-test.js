
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_password').computeServices();
var assert = require('assert');


vcr.describe('Create Load Balancer Pool Operation [UNIT]', function () {
    var timeout = 10 * 1000;

    var balancerName = 'Balancer';
    var dataCenter = compute.DataCenter.DE_FRANKFURT;
    var method = "roundRobin";
    var persistence = "sticky";
    var balancerIp = '66.155.94.20';

    it('Should create pool in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .pools()
            .create({
                balancer: {
                    dataCenter: dataCenter,
                    name: balancerName,
                    ip: balancerIp
                },
                port: compute.Server.Port.HTTP,
                method: method,
                persistence: persistence
            })
            .then(assertThatPoolRefIsCorrect)
            .then(compute.balancers().pools().findSingle)
            .then(assertPool)

            .then(deletePool)
            .then(assertThatPoolRefIsCorrect)

            .then(function () {
                done();
            });
    });

    function assertThatPoolRefIsCorrect (refValue) {
        var ref = refValue instanceof Array ? refValue[0] : refValue;
        assert(!_.isUndefined(ref.id));

        return ref;
    }

    function assertPool(pool) {
        assert.equal(pool.method, method);
        assert.equal(pool.persistence, persistence);

        assert.equal(pool.balancer.ipAddress, balancerIp);
        assert.equal(pool.balancer.dataCenter.id, dataCenter.id);
        assert.equal(pool.balancer.name, balancerName);

        return pool;
    }

    function deletePool (poolCriteria) {
        return compute.balancers().pools().delete(poolCriteria);
    }
});
