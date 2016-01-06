
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify Network Operation [UNIT]', function () {

    var timeout = 10 * 1000;

    vcr.it('Should modify network name', function (done) {
        this.timeout(timeout);

        var networkName = 'test network';

        compute.networks().findSingle({id: '302e98170e31408189ff1aab417bc8b4'})

            .then(_.partial(modifyNetwork, {name: networkName}))

            .then(assertThatRefIsCorrect)
            .then(assertThatNetworkNameIs(networkName))

            .then(releaseNetwork(done));
    });

    vcr.it('Should modify network name, description', function (done) {
        this.timeout(timeout);

        var networkName = 'network1';
        var networkDescription = 'description 1';

        compute.networks().findSingle({id: 'e789ed6495eb433a9ebc82f4bf095dea'})
            .then(_.partial(modifyNetwork,
                {
                    name: networkName,
                    description: networkDescription
                }))

            .then(assertThatNetworkNameIs(networkName))
            .then(assertThatDescriptionIs(networkDescription))

            .then(releaseNetwork(done));
    });

    function assertNetwork (callback) {
        return function (network) {
            return compute.networks()
                .findSingle(network)
                .then(function (metadata) {
                    return callback(metadata) || network;
                });
        };
    }

    function assertThatDescriptionIs(expectedDescription) {
        return assertNetwork(function (metadata) {
            assert.equal(metadata.description, expectedDescription);
        });
    }

    function assertThatNetworkNameIs (name) {
        return assertNetwork(function (metadata) {
            assert.equal(metadata.name, name);
        });
    }

    function modifyNetwork(config, network) {
        return compute.networks().modify(network, config);
    }

    function assertThatRefIsCorrect (ref) {
        assert(!_.isUndefined(ref.id || ref[0].id));

        return ref;
    }

    function releaseNetwork (done) {
        return function (networkCriteria) {
            return compute.networks().release(networkCriteria).then(_.partial(done, undefined));
        };
    }
});