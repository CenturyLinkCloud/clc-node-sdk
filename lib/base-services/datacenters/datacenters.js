var _ = require('underscore');
var Criteria = require('./domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

module.exports = DataCenterService;


function DataCenterService (dataCenterClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Method returns the list of capabilities that a specific data center supports
     *
     * @param {DataCenter} dataCenter reference
     * @returns {Promise} Promise of the list of capabilities
     *
     * @memberof DataCenters
     * @instance
     * @function getDeploymentCapabilities
     */
    self.getDeploymentCapabilities = function(dataCenter) {
        return dataCenterClient.getDeploymentCapabilities(dataCenter instanceof Object ? dataCenter.id : dataCenter);
    };

    /**
     * Method returns the list of DataCenters by DataCenterSearchCriteria
     *
     * @param {...DataCenterCriteria}
     * @returns {Promise}
     *
     * @memberof DateCenters
     * @instance
     * @function find
     */
    self.find = function() {
        var criteria = self._searchCriteriaFrom(arguments);

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