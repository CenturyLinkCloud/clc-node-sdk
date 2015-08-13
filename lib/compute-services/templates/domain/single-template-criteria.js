
var Predicate = require('./../../../core/predicates/predicates.js');
var _ = require('underscore');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleTemplateCriteria;

/**
 * @typedef SingleTemplateCriteria
 * @type {object}
 *
 * @property {String | Array<String>} name - a template name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only template
 * which name contains specified keyword.
 * @property {String | Array<String>} descriptionContains - restriction that pass only template
 * which description contains specified keyword.
 * @property {object} operatingSystem
 * @property {string} operatingSystem.family - search templates with operation system of specified os family.
 * @property {string} operatingSystem.version - search templates of specified os version.
 * @property {string} operatingSystem.edition - search templates of specified os edition.
 * @property {Architecture} operatingSystem.architecture - search templates of specified architecture.
 * @property {DataCenterCriteria} dataCenter - restrict datacenters in which need to execute search.
 * @property {String | Array<String>} dataCenterId - restrict templates by DataCenter ID.
 * @property {String | Array<String>} dataCenterName - restrict templates by DataCenter Name.
 * @property {String | Array<String>} dataCenterNameContains - search templates with name
 * that contains specified keyword.
 */
function SingleTemplateCriteria (criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains',
            where: 'dataCenterWhere'
        };
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
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name'))
                .and(filters.byParamMatch('descriptionContains', 'description'))
                .and(filterByOs()),
            path
        );
    };

    self.parseCriteria = function () {
        var parsedCriteria = criteriaHelper.parseSingleCriteria(self);

        if (_.isEmpty(parsedCriteria.dataCenter)) {
            delete parsedCriteria.dataCenter;
        }

        return parsedCriteria;
    };

    init();
}