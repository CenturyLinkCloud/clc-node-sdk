
var _ = require('underscore');

module.exports = DataCenterClient;


function DataCenterClient (rest) {
    var self = this;

    self.findAllDataCenters = _.memoize(function () {
        return rest.get('/v2/datacenters/{ACCOUNT}?groupLinks=true');
    });

    self.getDeploymentCapabilities = function (dataCenterId) {
        return rest.get('/v2/datacenters/{ACCOUNT}/' + dataCenterId + '/deploymentCapabilities');
    };
}