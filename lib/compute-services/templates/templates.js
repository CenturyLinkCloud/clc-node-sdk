
var DataCenterClient = require('./../../common-services/datacenters/datacenter-client.js');
var Promise = require('bluebird').Promise;
var _ = require('./../../core/underscore.js');
var TemplateCriteria = require('./domain/criteria.js');


module.exports = Templates;

function Templates (rest) {
    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    self.find = function (criteria) {
        return _.chain([criteria.dataCenterIds])
            .flatten()
            .map(function (dataCenterId) {
                return dataCenterClient.getDeploymentCapabilities(dataCenterId);
            })
            .arrayPromise()
            .then(function (list) {
                return _.pluck(list, 'templates');
            })
            .then(_.flatten)
            .value();
    };

    self.findByRef = function(templateCriteria) {
        return dataCenterClient.getDeploymentCapabilities(templateCriteria.datacenter.id)
            .then(function(capabilities) {
                return _.filter(capabilities.templates, new TemplateCriteria(templateCriteria).extractPredicateFromCriteria().fn);
            })
            .then(preprocessResult);
    }

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

}

