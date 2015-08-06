
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_password').computeServices();
var assert = require('assert');


vcr.describe('Create Shared Load Balancer Operation [UNIT]', function () {
    var timeout = 10 * 1000;

    var balancerName = 'Balancer';
    var balancerDescription = 'Test Balancer';
    var dataCenter = compute.DataCenter.DE_FRANKFURT;

    it('Should create Balancer in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        compute
            .balancers()
            .groups()
            .create({
                dataCenter: dataCenter,
                name: balancerName,
                description: balancerDescription
            })
            .then(assertThatBalancerRefIsCorrect)
            .then(compute.balancers().groups().findSingle)
            .then(assertBalancer)

            .then(deleteBalancer)
            .then(assertThatBalancerRefIsCorrect)

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
        assert(balancer.ipAddress);
        assert.equal(balancer.status, "enabled");
        assert.equal(balancer.name, balancerName);
        assert.equal(balancer.description, balancerDescription);

        assert.equal(balancer.dataCenter.id, dataCenter.id);

        return balancer;
    }

    function deleteBalancer (balancerCriteria) {
        return compute.balancers().groups().delete(balancerCriteria);
    }
});
