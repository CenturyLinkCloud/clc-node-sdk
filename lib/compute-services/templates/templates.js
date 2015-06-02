
var DataCenterClient = require('./../../common-services/datacenters/datacenter-client.js');
var Promise = require('bluebird').Promise;
var _ = require('./../../core/underscore.js');


module.exports = Templates;

function Templates (rest) {
    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    self.find = function (criteria) {
        return _.chain([criteria.dataCenterIds])
            .flatten()
            .map(function (dataCenterId) {
                return dataCenterClient.getDeploymentCapabilities(dataCenterId);
            })
            .arrayPromise()
            .then(function (list) {
                return _.pluck(list, 'templates');
            })
            .then(_.flatten)
            .value();
    };

}

