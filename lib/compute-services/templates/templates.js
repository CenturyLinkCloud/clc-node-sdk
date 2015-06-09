
var DataCenterService = require('./../../common-services/datacenters/datacenter-service.js');
var Promise = require('bluebird').Promise;
var _ = require('./../../core/underscore.js');
var TemplateCriteria = require('./domain/criteria.js');


module.exports = Templates;

function Templates (rest) {
    var self = this;
    var dataCenterService = new DataCenterService(rest);

    self.find = function (criteria) {
        return _.chain([criteria.dataCenterIds])
            .flatten()
            .map(function (dataCenterId) {
                return dataCenterService.getDeploymentCapabilities(dataCenterId);
            })
            .arrayPromise()
            .then(function (list) {
                return _.pluck(list, 'templates');
            })
            .then(_.flatten)
            .value();
    };

    self.findByRef = function(templateCriteria) {
        if (!templateCriteria) {
            throw new Error("The search template criteria must be provided");
        }

        return dataCenterService.find(extractDataCenterCriteria(templateCriteria))
            //filter by data center
            .then(function(dataCenters) {
                return self.find({dataCenterIds: _.pluck([].concat(dataCenters), 'id')});
            })
            .then(function(templates) {
                return _.filter(templates, new TemplateCriteria(templateCriteria).extractPredicateFromCriteria().fn);
            })
            .then(preprocessResult);
    };

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    function extractDataCenterCriteria(templateCriteria) {
        var dataCenterIds = [];
        if (templateCriteria.dataCenter) {
            var values = [].concat(templateCriteria.dataCenter);
            _.each(values, function(value) {
                dataCenterIds.push((value instanceof Object) ? value.id : value);
            });
        }

        return {
            id: dataCenterIds,
            nameContains: templateCriteria.dataCenterNameContains,
            where: templateCriteria.dataCenterWhere
        };
    }

}
