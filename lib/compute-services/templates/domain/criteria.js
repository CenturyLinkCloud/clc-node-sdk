
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = TemplateCriteria;


function TemplateCriteria (nakedCriteria) {
    var self = this;
    var criteria = {};

    function init () {
        criteria = nakedCriteria;
    }

    self.extractPredicateFromCriteria = function() {
        if (isConditionalCriteria(criteria)) {
            return resolveConditionalCriteria(criteria);
        }
        return resolveFilterCriteria(criteria, 'and');
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
        var predicate = selectDefaultPredicate(condition);
        if (criteria.name) {
            predicate = predicate[condition](Predicate.containsValue(criteria.name, "name"));
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
            predicate = predicate[condition](resolveCriteriaByOs());
        }

        return predicate;
    }

    function resolveCriteriaByOs() {
        return new Predicate(function(data) {
            var osType = data.osType.toUpperCase();
            var osCriteria = criteria.operatingSystem;

            if (osCriteria.family) {
                if (osType.indexOf(osCriteria.family.toUpperCase()) === 0) {
                    osType = osType.replace(osCriteria.family.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.architecture) {
                if (osType.indexOf(osCriteria.architecture.toUpperCase()) > 0) {
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
                if (osType.startsWith(osCriteria.edition.toUpperCase())) {
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