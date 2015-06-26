
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');

module.exports = SingleGroupCriteria;

function SingleGroupCriteria(criteria) {
    var self = this;

    function filterById() {
        if (criteria.id) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    }

    function filterByName () {
        return criteria.name &&
            Predicate.equalToAnyOf(_.asArray(criteria.name), 'name') ||
            Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    function filterNameContains() {
        return new Predicate(function(data) {
            if (criteria.nameContains) {
                var found = _.filter(_.asArray(criteria.nameContains), function (value) {
                    return Predicate.compareIgnoreCase(value, data.name);
                }).length;

                if (found === 0) {
                    return false;
                }
            }

            return true;
        });
    }

    function filterDescriptionContains() {
        return new Predicate(function(data) {
            if (criteria.descriptionContains) {
                var found = _.filter(_.asArray(criteria.descriptionContains), function (value) {
                    return Predicate.compareIgnoreCase(value, data.description);
                }).length;

                if (found === 0) {
                    return false;
                }
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
            new DataCenterCriteria(criteria.dataCenter).predicate("dataCenter")
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains()),
            path
        );
    };

    self.processDataCenterCriteria = function () {
        //instantiate object from properties
        var dataCenterCriteria =
        {
            id: criteria.dataCenterId ? _.asArray(criteria.dataCenterId) : null,
            name: criteria.dataCenterName ? _.asArray(criteria.dataCenterName) : null,
            nameContains: criteria.dataCenterNameContains ? _.asArray(criteria.nameContains) : null
        };

        //transform criteria to Array
        var arrayCriteria = !criteria.dataCenter ? _.asArray(dataCenterCriteria)
            : _.asArray(criteria.dataCenter, dataCenterCriteria);

        criteria.dataCenter = {or: _.filter(arrayCriteria, function(criteria) {
            return !_.values(criteria).every(_.isNull);
        })};

        return criteria;
    };
}