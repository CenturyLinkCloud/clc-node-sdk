
var AuthenticatedClient = require('./../../lib/core/client/authenticated-client.js');
var DataCenterClient = require('./../../lib/common-management/datacenter-client.js');
var ServerClient = require('./../../lib/servers/server-client.js');
var _ = require('underscore');


describe('Test Server client functions', function () {
    var dataCenterClient = new DataCenterClient(new AuthenticatedClient());
    var serverClient = new ServerClient(new AuthenticatedClient());

    it('Should return list of all datacenters', function (done) {
        this.timeout(5000);

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