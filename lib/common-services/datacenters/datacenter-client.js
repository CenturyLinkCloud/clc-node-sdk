

module.exports = DataCenterClient;


function DataCenterClient (rest) {
    var self = this;

    self.findAllDataCenters = function () {
        return rest.get('/v2/datacenters/{ACCOUNT}?groupLinks=true');
    };

    self.getDeploymentCapabilities = function (dataCenterId) {
        return rest.get('/v2/datacenters/{ACCOUNT}/' + dataCenterId + '/deploymentCapabilities');
    };
}