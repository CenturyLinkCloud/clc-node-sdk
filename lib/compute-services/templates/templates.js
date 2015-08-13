
var Promise = require('bluebird');
var _ = require('underscore');
var SearchSupport = require('./../../core/search/search-support.js');
var TemplateCriteria = require('./domain/template-criteria.js');

var Criteria = require('./../../core/search/criteria.js');

module.exports = Templates;

/**
 * @typedef TemplateMetadata
 * @type {object}
 * @property {string} name - Underlying unique name for the template.
 * @property {string} description - Description of the template.
 * @property {int} storageSizeGB - The amount of storage allocated for the primary OS root drive.
 * @property {Array<string>} capabilities - List of capabilities supported by this specific OS template
 * (example: whether adding CPU or memory requires a reboot or not).
 * @property {Array<string>} reservedDrivePaths - List of drive path names reserved by the OS
 * that can't be used to name user-defined drives.
 * @property {int} drivePathLength - Length of the string for naming a drive path, if applicable.
 */

/**
 * @typedef ServerImportMetadata
 * @type {object}
 * @property {string} id - ID of the OVF.
 * @property {string} name - Name of the OVF.
 * @property {int} storageSizeGB - Number of GB of storage the server is configured with.
 * @property {int} cpuCount - Number of processors the server is configured with.
 * @property {int} memorySizeMB - Number of MB of memory the server is configured with.
 */

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
     * @returns {Promise<Array<TemplateMetadata>>} That
     *
     * @memberof Templates
     * @instance
     * @function find
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
     * @param {DataCenterCriteria} args - Search criteria that specify single target datacenter
     * @returns {Promise<Array<ServerImportMetadata>>} Promise of available server imports list
     *
     * @memberof Templates
     * @instance
     * @function findAvailableServerImports
     */
    self.findAvailableServerImports = function () {
        return dataCenterService
            .findSingle(self._searchCriteriaFrom(arguments))
            .then(_.property('id'))
            .then(serverClient.findAvailableServerImports);
    };

    init();
}
