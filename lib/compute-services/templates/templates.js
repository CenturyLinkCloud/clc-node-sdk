
var Promise = require('bluebird');
var _ = require('underscore');
var SearchSupport = require('./../../core/search/search-support.js');
var TemplateCriteria = require('./domain/template-criteria.js');

var Criteria = require('./../../core/search/criteria.js');

module.exports = Templates;

/**
 * The service that works with template
 *
 * @constructor
 */
function Templates (dataCenterService, serverClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Search template
     * @param {...TemplateCriteria}
     * @returns {Promise} That
     *
     * @memberof Templates
     */
    self.find = function () {
        var criteria = new TemplateCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            //filter by data center
            .then(function(dataCenters) {
                return findByDataCenterIds({
                    dataCenters: _.asArray(dataCenters)
                });
            })
            .then(function(templates) {
                if (!templates || templates.length === 0) {
                    return [];
                }
                return _.filter(templates, new TemplateCriteria(criteria).predicate().fn);
            });
    };

    function findByDataCenterIds(criteria) {
        var dataCenters = criteria.dataCenters || [];
        if (criteria.dataCenterId) {
            _.each(_.asArray(criteria.dataCenterId), function(dataCenterId) {
                dataCenters.push({id: dataCenterId});
            });
        }
        return _.chain([dataCenters])
            .flatten()
            .map(function (dataCenter) {
                return Promise.props({
                    dataCenter: dataCenter,
                    capabilities: dataCenterService.getDeploymentCapabilities(dataCenter.id)
                });
            })
            .arrayPromise()
            .then(function (list) {
                _.each(list, function(res) {
                    _.each(res.capabilities.templates, function(t) {
                        t.dataCenter = res.dataCenter;
                    });
                });
                return _.pluck(_.pluck(list, 'capabilities'), 'templates');
            })
            .then(_.flatten)
            .value();
    }

    /**
     * Method returns list of available server imports for specified datacenter
     *
     * @param {DataCenterSearchCriteria} Search criteria that specify single target datacenter
     * @returns {Promise<ServerImportMetadata>} Promise of available server imports list
     *
     * @memberof Templates
     */
    self.findAvailableServerImports = function () {
        return dataCenterService
            .findSingle(self._searchCriteriaFrom(arguments))
            .then(_.property('id'))
            .then(serverClient.findAvailableServerImports);
    };

    init();
}
