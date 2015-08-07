var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');
var Filters = require('./filters.js');
var CompositeCriteria = require('./composite-criteria.js');
module.exports = Criteria;

function Criteria(criteria) {
    var self = this;
    var filters = new Filters(criteria);

    self.getFilters = function() {
        return filters;
    };

    self.isComposite = function() {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    };

    //extract more specific criteria from another
    self.extractSubCriteria = function(convertFilterCriteriaFn) {
        if (self.isComposite()) {
            return convertConditionalCriteria(criteria);
        }
        return convertFilterCriteriaFn(criteria);

        function convertConditionalCriteria(criteria) {
            //extract only 1st criteria
            var compositeOperation = _.pairs(criteria)[0];
            var logicalOperator = compositeOperation[0];
            var operands = _.asArray(compositeOperation[1]);


            var convertedOperands = _.map(operands, function(operand) {
                var converted;
                if (new Criteria(operand).isComposite()) {
                    converted = convertConditionalCriteria(operand);
                } else {
                    converted = convertFilterCriteriaFn(operand);
                }

                return converted;
            });

            var subCriteria = _.chain(convertedOperands)
                .compact()
                .value();

            if(_.isEmpty(subCriteria)) {
                return;
            }

            var result = {};
            result[logicalOperator] = subCriteria;
            return result;
        }
    };

    self.extractIdsFromCriteria = function(ids) {
        if (!ids) {
            ids = [];
        }
        if (self.isComposite()) {
            var compositeOperation = _.pairs(criteria)[0];
            var operands = _.asArray(compositeOperation[1]);
            return _.map(operands, function(operand) {
                return new Criteria(operand).extractIdsFromCriteria(ids);
            });
        }
        if (criteria.id) {
            return _.flatten(_.asArray(criteria.id, ids));
        }
        return ids;
    };

    self.parseSingleCriteria = function(singleCriteriaInstance, omitSecondCondition) {
        var criteriaRootProperty = singleCriteriaInstance.criteriaRootProperty;
        var propertiesMap = singleCriteriaInstance.criteriaPropertiesMap;
        var propertyCriteria = parsePropertiesCriteria(propertiesMap);

        var parsedCriteria = _.omit(criteria, _.values(propertiesMap));

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria[criteriaRootProperty] ?
            _.asArray(propertyCriteria)
            : _.asArray(parsedCriteria[criteriaRootProperty], propertyCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            parsedCriteria[criteriaRootProperty] = (nonEmptyOperands.length === 1) ?
                nonEmptyOperands[0] :
                {or: nonEmptyOperands};
        }

        //if criteria is empty - should find overall
        //omitSecondCondition param - if provided, don't check second condition
        if (_.isEmpty(parsedCriteria) ||
           (!omitSecondCondition && _.isUndefined(parsedCriteria[criteriaRootProperty]))
        ) {
                parsedCriteria[criteriaRootProperty] = {};
        }

        return parsedCriteria;
    };

    function parsePropertiesCriteria(propertiesMap) {
        var result = {};

        _.each(propertiesMap, function(propertyName, key) {
            result[key] = getCriteriaValue(propertyName);
        });

        return result;
    }

    function getCriteriaValue(property) {
        if (criteria[property]) {
            if (typeof criteria[property] === 'function') {
                return criteria[property];
            }
            return _.asArray(criteria[property]);
        }
        return null;
    }
}