
var AuthenticatedClient = require('./../../lib/core/client/authenticated-client.js');
var DataCenterClient = require('./../../lib/common-services/datacenters/datacenter-client.js');

describe('Test DataCenter client functions', function () {
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
        this.timeout(5000);

        dataCenterClient
            .getDeploymentCapabilities('DE1')
            .then(function (result) {
                done();
            });
    });
});