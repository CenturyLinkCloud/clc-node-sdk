
var DataCenterClient = require('./datacenter-client.js');
var _ = require('underscore');

module.exports = DataCenterService;


function DataCenterService (rest) {

    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    self.findByRef = function (reference) {

        var filterById = function(dataCenter) {
            return dataCenter.id == reference.id
        };

        var filterByName = function(dataCenter) {
            return dataCenter.name
                    .toLowerCase()
                    .indexOf(reference.name.toLowerCase()) > -1
        };

        var filter = reference.id ? filterById : filterByName;

        return dataCenterClient
            .findAllDataCenters()
            .then(
                function (list) {
                    return _.filter(list, filter);
                }
            )
    };
}