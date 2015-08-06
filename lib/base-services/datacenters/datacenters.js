var _ = require('underscore');
var DataCenterCriteria = require('./domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

var DataCenterMetadata = require('./domain/datacenter-metadata.js');

module.exports = DataCenters;


/**
 * Object provide access to datacenters functionality of CenturyLink Cloud
 *
 * @param dataCenterClient
 * @constructor
 */
function DataCenters (dataCenterClient) {
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
     * @param {DataCenterCriteria} arguments - set of datacenter criterias
     * @returns {Promise}
     *
     * @memberof DataCenters
     * @instance
     * @function find
     */
    self.find = function () {
        var criteria = self._searchCriteriaFrom(arguments);

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, new DataCenterCriteria(criteria).predicate().fn);
            })
            .then(_.partial(_.applyMixin, DataCenterMetadata));
    };

    self._dataCenterClient = function() {
        return dataCenterClient;
    };

    init ();
}