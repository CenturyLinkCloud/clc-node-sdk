
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify Shared Load Balancer Operation [UNIT]', function () {

    var timeout = 10 * 1000;
    var groups = compute.balancers().groups();
    var DataCenter = compute.DataCenter;

    vcr.it('Should modify balancer name', function (done) {
        this.timeout(timeout);

        Promise.resolve()
            .then(_.partial(createBalancer, {name: 'Balancer1'}))

            .then(_.partial(modifyBalancer, {name: 'Balancer2'}))

            .then(assertThatBalancerRefIsCorrect)
            .then(assertThatNameIs('Balancer2'))

            .then(deleteBalancer(done));
    });

    vcr.it('Should modify group name, description together by one call', function (done) {
        this.timeout(timeout);

        Promise.resolve()
            .then(_.partial(createBalancer,
                {
                    name: 'Bal1',
                    description: 'Desc1'
                })
            )

            .then(_.partial(modifyBalancer,
                {
                    name: 'Bal2',
                    description: 'Desc2'
                }))

            .then(assertThatNameIs('Bal2'))
            .then(assertThatDescriptionIs('Desc2'))

            .then(deleteBalancer(done));
    });

    vcr.it('Should disable balancers', function (done) {
        this.timeout(timeout);

        Promise.resolve()
            .then(_.partial(createBalancer, {}))

            .then(_.partial(modifyBalancer, {enabled: false}))

            .then(assertThatStatusIs('disabled'))

            .then(deleteBalancer(done));
    });

    function assertBalancer (callback) {
        return function (balancer) {
            return groups
                .findSingle(balancer)
                .then(function (metadata) {
                    return callback(metadata) || balancer;
                });
        };
    }

    function assertThatStatusIs(expectedStatus) {
        return assertBalancer(function (metadata) {
            assert.equal(metadata.status, expectedStatus);
        });
    }

    function assertThatDescriptionIs(expectedDescription) {
        return assertBalancer(function (metadata) {
            assert.equal(metadata.description, expectedDescription);
        });
    }

    function createBalancer (config) {
        return groups
            .create(_.defaults(config, {
                dataCenter: DataCenter.DE_FRANKFURT,
                name: 'Balancer',
                description: 'Test Balancer'
            }))
            .then(assertThatBalancerRefIsCorrect);
    }

    function assertThatNameIs (name) {
        return assertBalancer(function (metadata) {
            assert.equal(metadata.name, name);
        });
    }

    function modifyBalancer(config, balancer) {
        return groups.modify(balancer, config);
    }

    function assertThatBalancerRefIsCorrect (ref) {
        assert(!_.isUndefined(ref.id || ref[0].id));

        return ref;
    }

    function deleteBalancer (done) {
        return function (balancerCriteria) {
            return groups.delete(balancerCriteria).then(_.partial(done, undefined));
        };
    }
});