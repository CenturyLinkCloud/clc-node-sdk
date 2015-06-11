
var Predicate = require('./../../../core/predicates/predicates.js');
var _ = require('underscore');

module.exports = TemplateCriteria;


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
        var expressions = [].concat(value[1]);

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
        var dataCenterPredicate = resolveDataCenterCriteria(criteria);
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

    function resolveDataCenterCriteria(criteria) {
        return new Predicate(function(data) {
            var dataCenter = data.dataCenter;

            if (criteria.dataCenter) {
                if (criteria.dataCenter.indexOf(dataCenter.id) === -1) {
                    return false;
                }
            }
            if (criteria.dataCenterNameContains) {
                var found = _.filter([].concat(criteria.dataCenterNameContains), function(value) {
                    return dataCenter.name.indexOf(value) > -1;
                }).length;
                if (found === 0) {
                    return false;
                }
            }
            if (criteria.dataCenterWhere) {
                return criteria.dataCenterWhere(dataCenter);
            }

            return true;
        });
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
        var expressions = [].concat(pair[1]);

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
        var res = {};
        if (criteria.dataCenter) {
            res.id = criteria.dataCenter;
        }
        if (criteria.dataCenterNameContains) {
            res.nameContains = criteria.dataCenterNameContains;
        }
        if (criteria.dataCenterWhere) {
            res.where = criteria.dataCenterWhere;
        }

        return res;
    }
};