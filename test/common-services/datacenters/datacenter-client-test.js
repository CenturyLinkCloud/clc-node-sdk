
var AuthenticatedClient = require('./../../../lib/core/client/authenticated-client.js');
var DataCenterClient = require('./../../../lib/base-services/datacenters/datacenter-client.js');
var DataCenter = require('./../../../lib/compute-services/domain/datacenter.js');

describe('Test DataCenter client functions [INTEGRATION]', function () {
    var dataCenterClient = new DataCenterClient(new AuthenticatedClient());

    it('Should return list of all datacenters', function (done) {
        this.timeout(5000);

        dataCenterClient
            .findAllDataCenters()
            .then(function () {
                done();
            });
    });

    it('Should return datacenter deployment capabilities', function (done) {
        this.timeout(15000);

        dataCenterClient
            .getDeploymentCapabilities(DataCenter.DE_FRANKFURT.id)
            .then(function (result) {
                done();
            });
    });
});