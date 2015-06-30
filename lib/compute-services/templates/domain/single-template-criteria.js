
var Predicate = require('./../../../core/predicates/predicates.js');
var _ = require('./../../../core/underscore.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');

var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleTemplateCriteria;

function SingleTemplateCriteria (criteria) {
    var self = this;

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

    function filterByOs() {
        if (!criteria.operatingSystem) {
            return Predicate.alwaysTrue();
        }

        var osCriteria = criteria.operatingSystem;

        return new Predicate(function(data) {
            var osType = data.osType.toUpperCase();

            if (!osCriteria) {
                return true;
            }

            if (osCriteria.family) {
                if (osType.indexOf(osCriteria.family.toUpperCase()) === 0) {
                    osType = osType.replace(osCriteria.family.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.architecture) {
                if (osType.indexOf(osCriteria.architecture.toUpperCase()) > -1) {
                    osType = osType.replace(osCriteria.architecture.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.version) {
                if (osType.indexOf(osCriteria.version.toUpperCase()) === 0) {
                    osType = osType.replace(osCriteria.version.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.edition) {
                if (osType.indexOf(osCriteria.edition.toUpperCase()) > -1) {
                    osType = osType.replace(osCriteria.edition.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
            new DataCenterCriteria(criteria.dataCenter).predicate("dataCenter")
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains())
                .and(filterByOs()),
            path
        );
    };

    self.parseDataCenterCriteria = function () {
        //instantiate object from properties
        var dataCenterCriteria =
        {
            id: criteria.dataCenterId ? _.asArray(criteria.dataCenterId) : null,
            name: criteria.dataCenterName ? _.asArray(criteria.dataCenterName) : null,
            nameContains: criteria.dataCenterNameContains ? _.asArray(criteria.dataCenterNameContains) : null,
            where: criteria.dataCenterWhere ? criteria.dataCenterWhere : null
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