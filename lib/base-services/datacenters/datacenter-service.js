var _ = require('underscore');
var Criteria = require('./domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

module.exports = DataCenterService;


function DataCenterService (dataCenterClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    self.getDeploymentCapabilities = function(dataCenter) {
        return dataCenterClient.getDeploymentCapabilities(dataCenter instanceof Object ? dataCenter.id : dataCenter);
    };

    self.find = function() {
        var criteria = self._toCriteriaObject(arguments);

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, new Criteria(criteria).predicate().fn);
            });
    };

    self._dataCenterClient = function() {
        return dataCenterClient;
    };

    init ();
}