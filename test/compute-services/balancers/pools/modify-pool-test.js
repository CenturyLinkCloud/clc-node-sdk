
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify Load Balancer Pool Operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var pools = compute.balancers().pools();
    var DataCenter = compute.DataCenter;

    vcr.it('Should modify pool', function (done) {
        this.timeout(timeout);

        Promise.resolve()
            .then(_.partial(createPool, {}))

            .then(_.partial(modifyPool, {method: 'roundRobin', persistence: 'sticky'}))

            .then(assertThatPoolRefIsCorrect)
            .then(assertThatMethodIs('roundRobin'))
            .then(assertThatPersistenceIs('sticky'))

            .then(deletePool(done));
    });

    function assertPool (callback) {
        return function (pool) {
            return pools
                .findSingle(pool)
                .then(function (metadata) {
                    return callback(metadata) || pool;
                });
        };
    }

    function createPool (config) {
        return pools
            .create(_.defaults(config, {
                balancer: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: 'Balancer',
                    ip: '66.155.94.20'
                },
                port: compute.Server.Port.HTTP,
                method: 'leastConnection',
                persistence: 'standard'
            }))
            .then(assertThatPoolRefIsCorrect);
    }

    function assertThatMethodIs (method) {
        return assertPool(function (metadata) {
            assert.equal(metadata.method, method);
        });
    }

    function assertThatPersistenceIs(expectedPersistence) {
        return assertPool(function (metadata) {
            assert.equal(metadata.persistence, expectedPersistence);
        });
    }

    function modifyPool(config, pool) {
        return pools.modify(pool, config);
    }

    function assertThatPoolRefIsCorrect (ref) {
        assert(!_.isUndefined(ref.id || ref[0].id));

        return ref;
    }

    function deletePool (done) {
        return function (poolCriteria) {
            return pools.delete(poolCriteria).then(_.partial(done, undefined));
        };
    }
});