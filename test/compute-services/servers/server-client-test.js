
var AuthenticatedClient = require('./../../../lib/core/client/authenticated-client.js');
var DataCenterClient = require('./../../../lib/base-services/datacenters/datacenter-client.js');
var GroupClient = require('./../../../lib/compute-services/groups/group-client.js');
var _ = require('underscore');
var DataCenter = require('./../../../lib/base-services/datacenters/domain/datacenter.js');


describe('Test Server client functions [INTEGRATION]', function () {
    var authClient = new AuthenticatedClient();
    var dataCenterClient = new DataCenterClient(authClient);
    var groupClient = new GroupClient(authClient);

    it('Should return group by ID', function (done) {
        this.timeout(15 * 1000);

        dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.findWhere(list, {id: DataCenter.DE_FRANKFURT.id});
            })
            .then(function (dataCenter) {
                return _.findWhere(dataCenter.links, {rel: 'group'}).id;
            })
            .then(function (targetGroupId) {
                return groupClient.get(targetGroupId);
            })
            .then(function (result) {
                done();
            });
    });
});