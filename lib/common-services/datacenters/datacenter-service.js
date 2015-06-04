
var DataCenterClient = require('./datacenter-client.js');
var _ = require('underscore');
<<<<<<< HEAD
var DataCenter = require('./../../compute-services/domain/datacenter.js');
=======
var Predicate = require('./../../core/predicates/predicates.js');
>>>>>>> ce41e1779126b0bbf27b19c0f78018930e83c5fd

module.exports = DataCenterService;


function DataCenterService (rest) {
    var self = this;
    var dataCenterClient = new DataCenterClient(rest);

    function prepareListResult(list) {
        return (list.length == 1) ? list[0] : list;
    }

    self.findByRef = function (reference) {

        var filterById = function(dataCenter) {
            return dataCenter.id == reference.id;
        };

        var filterByName = function(dataCenter) {
            return dataCenter.name
                    .toLowerCase()
                    .indexOf(reference.name.toLowerCase()) > -1;
        };

        var filter = reference.id ? filterById : filterByName;

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, filter);
            })
            .then(prepareListResult);
    };

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, DataCenter.extractPredicateFromCriteria(criteria).fn);
            })
            .then(prepareListResult);
    };
}