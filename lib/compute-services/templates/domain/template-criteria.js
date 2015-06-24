
var Predicate = require('./../../../core/predicates/predicates.js');
var _ = require('./../../../core/underscore.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');

module.exports = TemplateCriteria;

/**
 * @typedef TemplateSearchCriteria
 * @type {object}
 *
 * @property {string} name - a template name restriction.
 * @property {string} nameContains - restriction that pass only template which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only template which description contains specified keyword.
 * @property {object} operatingSystem
 * @property {string} operatingSystem.family - search templates with operation system of specified os family.
 * @property {string} operatingSystem.version - search templates of specified os version.
 * @property {string} operatingSystem.edition - search templates of specified os edition.
 * @property {Architecture} operatingSystem.architecture - search templates of specified architecture.
 * @property {DataCenterSearchCriteria} dataCenter - restrict datacenters in which need to execute search.
 * @property {string} dataCenterId - restrict templates by DataCenter ID.
 * @property {string} dataCenterName - restrict templates by DataCenter Name.
 * @property {string} dataCenterNameContains - search templates with name that contains specified keyword.
 */
function TemplateCriteria (nakedCriteria) {
    var self = this;

    function init () {
    }

    self.extractPredicateFromCriteria = function() {
        if (isConditionalCriteria(nakedCriteria)) {
            return resolveConditionalCriteria(nakedCriteria);
        }
        return resolveFilterCriteria(nakedCriteria, 'and');
    };

    function isConditionalCriteria(criteria) {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    }

    function selectDefaultPredicate(condition) {
        return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

    function resolveConditionalCriteria(criteria) {
        //extract only 1st criteria
        var value = _.pairs(criteria)[0];
        var condition = value[0];
        var expressions = _.asArray(value[1]);

        var predicate = selectDefaultPredicate(condition);

        _.each(expressions, function(expression) {
            if (isConditionalCriteria(expression)) {
                predicate = predicate[condition](resolveConditionalCriteria(expression));
            } else {
                predicate = predicate[condition](resolveFilterCriteria(expression, condition));
            }
        });

        return predicate;
    }

    function resolveFilterCriteria(criteria, condition) {
        var dataCenterPredicate = new DataCenterCriteria(TemplateCriteria.extractDataCenterCriteria(criteria))
                .predicate("dataCenter");

        var predicate = selectDefaultPredicate(condition);
        if (criteria.name) {
            predicate = predicate[condition](Predicate.equalToAnyOf(criteria.name, "name"));
        }
        if (criteria.nameContains) {
            predicate = predicate[condition](Predicate.contains(criteria.nameContains, "name"));
        }
        if (criteria.descriptionContains) {
            predicate = predicate[condition](Predicate.contains(criteria.descriptionContains, "description"));
        }
        if (criteria.where) {
            if (typeof criteria.where !== "function") {
                throw new Error("Criteria.where property must be a function");
            }
            predicate = predicate[condition](new Predicate(criteria.where));
        }
        if (criteria.operatingSystem) {
            predicate = predicate[condition](resolveCriteriaByOs(criteria.operatingSystem));
        }

        return dataCenterPredicate.and(predicate);
    }

    function resolveCriteriaByOs(osCriteria) {
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

    init ();
}

//convert dataCenter related criteria properties in template criteria to dataCenter criteria
TemplateCriteria.extractDataCenterCriteria = function(templateCriteria) {
    if (isConditionalCriteria(templateCriteria)) {
        return convertConditionalCriteria(templateCriteria);
    }
    return convertFilterCriteria(templateCriteria);

    function isConditionalCriteria(criteria) {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    }

    function convertConditionalCriteria(criteria) {
        //extract only 1st criteria
        var pair = _.pairs(criteria)[0];
        var condition = pair[0];
        var expressions = _.asArray(pair[1]);

        var subcriteria = [];

        _.each(expressions, function(expression) {
            var converted;
            if (isConditionalCriteria(expression)) {
                converted = convertConditionalCriteria(expression);
            } else {
                converted = convertFilterCriteria(expression);
            }
            subcriteria.push(converted);
        });

        var result = {};
        result[condition] = subcriteria;
        return result;
    }

    function convertFilterCriteria(criteria) {
        return {
            id: criteria.dataCenter,
            nameContains: criteria.dataCenterNameContains,
            where: criteria.dataCenterWhere
        };
    }
};