
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
        return Predicate.match(criteria.nameContains, "name");
    }

    function filterDescriptionContains() {
        return Predicate.match(criteria.descriptionContains, "description");
    }

    self.predicate = function (path) {
        return Predicate.extract(
            (criteria.dataCenter ?
                new DataCenterCriteria(criteria.dataCenter).predicate("dataCenter") : Predicate.alwaysTrue())
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains()),
            path
        );
    };

    self.parseDataCenterCriteria = function () {
        //instantiate object from properties
        var dataCenterCriteria =
        {
            id: criteria.dataCenterId ? _.asArray(criteria.dataCenterId) : null,
            name: criteria.dataCenterName ? _.asArray(criteria.dataCenterName) : null,
            nameContains: criteria.dataCenterNameContains ? _.asArray(criteria.dataCenterNameContains) : null
        };

        var parsedCriteria = _.omit(criteria, ['dataCenterId', 'dataCenterName', 'dataCenterNameContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.dataCenter ? _.asArray(dataCenterCriteria)
            : _.asArray(parsedCriteria.dataCenter, dataCenterCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            parsedCriteria.dataCenter = {or: nonEmptyOperands};
        }

        return parsedCriteria;
    };
}