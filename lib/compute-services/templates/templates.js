
var DataCenterService = require('./../../base-services/datacenters/datacenter-service.js');
var Promise = require('bluebird').Promise;
var _ = require('./../../core/underscore.js');
var TemplateCriteria = require('./domain/template-criteria.js');


module.exports = Templates;

/**
 * The service that works with template
 *
 * @param rest the REST client
 * @constructor
 */
function Templates (rest) {
    var self = this;
    var dataCenterService = new DataCenterService(rest);

    function getOnlySingleResult(result) {
        if (!result || result.length === 0) {
            throw new Error("Can't resolve any template");
        }

        if (result.length > 1) {
            throw new Error("Please specify more concrete search criteria");
        }

        return result[0];
    }

    /**
     * Search template
     * @param {TemplateSearchCriteria} criteria
     *
     * @memberof Templates
     */
    self.find = function (criteria) {
        if (!criteria) {
            throw new Error("The search template criteria must be provided");
        }
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

    self.findSingle = function(criteria) {
        return self.find(criteria).then(getOnlySingleResult);
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

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    self._dataCenterService = function() {
        return dataCenterService;
    };
}
