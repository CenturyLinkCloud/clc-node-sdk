var DataCenterClient = require('./datacenter-client.js');
var _ = require('underscore');
var Criteria = require('./domain/datacenter-criteria.js');

module.exports = DataCenterService;


function DataCenterService (dataCenterClient) {
    var self = this;

    function prepareListResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    function getOnlySingleResult(result) {
        if (!result || result.length === 0) {
            throw new Error("Can't resolve any datacenter");
        }

        if (result.length > 1) {
            throw new Error("Please specify more concrete search criteria");
        }

        return result[0];
    }

    self.getDeploymentCapabilities = function(dataCenter) {
        return dataCenterClient.getDeploymentCapabilities(dataCenter instanceof Object ? dataCenter.id : dataCenter);
    };

    self.find = function(criteria) {
        return self._doFind(criteria).then(prepareListResult);
    };

    self.findSingle = function(criteria) {
        return self._doFind(criteria).then(getOnlySingleResult);
    };

    self._doFind = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, new Criteria(criteria).extractPredicateFromCriteria().fn);
            });
    };

    self._dataCenterClient = function() {
        return dataCenterClient;
    };
}