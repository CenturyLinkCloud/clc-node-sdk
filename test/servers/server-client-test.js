
var AuthenticatedClient = require('./../../lib/core/client/authenticated-client.js');
var DataCenterClient = require('./../../lib/common-services/datacenters/datacenter-client.js');
var ServerClient = require('./../../lib/compute-services/servers/server-client.js');
var _ = require('underscore');


describe('Test Server client functions', function () {
    var dataCenterClient = new DataCenterClient(new AuthenticatedClient());
    var serverClient = new ServerClient(new AuthenticatedClient());

    it('Should return group by ID', function (done) {
        this.timeout(10000);

        dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.findWhere(list, {id : 'de1'});
            })
            .then(function (dataCenter) {
                return _.findWhere(dataCenter.links, {rel: 'group'}).id;
            })
            .then(function (targetGroupId) {
                return serverClient.findGroupById(targetGroupId);
            })
            .then(function (result) {
                done();
            });
    });
});