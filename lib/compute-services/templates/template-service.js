
var DataCenterClient = require('./../../common-services/datacenters/datacenter-client.js');
var Promise = require('bluebird').Promise;
var _ = require('underscore');


module.exports = TemplateService;

function TemplateService (rest) {
    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    self.find = function (criteria) {
        var capabilitiesPromises = _.chain([criteria.dataCenterIds])
            .flatten()
            .map(function (dataCenterId) {
                return dataCenterClient.getDeploymentCapabilities(dataCenterId);
            })
            .value();

        return Promise.all(capabilitiesPromises)
            .then(function (list) {
                return _.chain(list)
                    .map(function (item) {
                        return item.templates;
                    })
                    .flatten();
            });
    };

}


