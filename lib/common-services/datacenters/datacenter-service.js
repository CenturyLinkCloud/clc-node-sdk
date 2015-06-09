
var DataCenterClient = require('./datacenter-client.js');
var _ = require('underscore');
var Criteria = require('./domain/criteria.js');

module.exports = DataCenterService;


function DataCenterService (rest) {
    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    function prepareListResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    self.findByRef = function (reference) {

        var filterById = function(dataCenter) {
            return dataCenter.id === reference.id;
        };

        var filterByName = function(dataCenter) {
            return dataCenter.name
                    .toLowerCase()
                    .indexOf(reference.name.toLowerCase()) > -1;
        };

        var filter = reference.id ? filterById : filterByName;

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, filter);
            })
            .then(prepareListResult);
    };

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, new Criteria(criteria).extractPredicateFromCriteria().fn);
            })
            .then(prepareListResult);
    };

    self._dataCenterClient = function() {
        return dataCenterClient;
    };
}