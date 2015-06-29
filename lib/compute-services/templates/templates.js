
var Promise = require('bluebird').Promise;
var _ = require('./../../core/underscore.js');
var SearchSupport = require('./../../core/search/search-support.js');
var TemplateCriteria = require('./domain/template-criteria.js');


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
     * @param {...TemplateSearchCriteria} criteria
     *
     * @memberof Templates
     */
    self.find = function () {
        var criteria = self._searchCriteriaFrom(arguments);

        //TODO maybe obsolete?
        if (criteria.dataCenterIds) {
            return findByDataCenterIds(criteria);
        }

        return dataCenterService.find(TemplateCriteria.extractDataCenterCriteria(criteria))
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
        if (criteria.dataCenterIds) {
            _.each(_.asArray(criteria.dataCenterIds), function(dataCenterId) {
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

    self.findAvailableServerImports = function () {
        return dataCenterService
            .findSingle(self._searchCriteriaFrom(arguments))
            .then(_.property('id'))
            .then(serverClient.findAvailableServerImports);
    };

    self._dataCenterService = function() {
        return dataCenterService;
    };

    init ();
}
