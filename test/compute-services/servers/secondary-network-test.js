
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');

vcr.describe('Secondary Networks Operations [UNIT]', function () {

    var timeout = 10000;

    var searchCriteria = {
        dataCenter: compute.DataCenter.DE_FRANKFURT,
        nameContains: 'cln'
    };

    var networkConfig = {
        dataCenter: compute.DataCenter.DE_FRANKFURT,
        name: "vlan_309_10.110.109"
    };

    it('Should add secondary network', function (done) {
        this.timeout(timeout);

        loadServerDetails(searchCriteria)
            .then(assertServersHasNoSecondaryNetwork)
            .then(_.partial(compute.servers().addSecondaryNetwork, searchCriteria, networkConfig))
            .then(loadServerDetails)
            .then(function(servers) {
                _.each(servers, function(server) {
                    assert.equal(server.details.secondaryIPAddresses.length, 1);
                });
            })
            .then(done);
    });

    it('Should remove all secondary networks', function (done) {
        this.timeout(timeout);

        compute.servers()
            .removeSecondaryNetwork(searchCriteria, networkConfig)
            .then(loadServerDetails)
            .then(assertServersHasNoSecondaryNetwork)
            .then(done);
    });

    function assertServersHasNoSecondaryNetwork(servers) {
        _.each(servers, function(server) {
            assert(
                _.isEmpty(
                    _.chain(server.details.secondaryIPAddresses)
                        .value()
                )
            );
        });
    }

    function loadServerDetails(serverRefs) {
        assert(!_.isEmpty(serverRefs));

        return compute.servers().find(serverRefs);
    }
});