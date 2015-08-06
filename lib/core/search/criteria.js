var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');

module.exports = Criteria;

function Criteria(criteria) {
    var self = this;

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

            var subcriteria = _.chain(convertedOperands)
                .compact()
                .value();

            if(_.isEmpty(subcriteria)) {
                return;
            }

            var result = {};
            result[logicalOperator] = subcriteria;
            return result;
        }
    };

    self.compositePredicate = function(CriteriaClass, path) {
        // extract only 1st criteria
        var compositeOperation = _.pairs(criteria)[0];
        var logicalOperator = compositeOperation[0];
        var operands = _.asArray(compositeOperation[1]);

        var defaultPredicate = selectDefaultPredicate(logicalOperator);

        return _.reduce(operands, function(predicate, operand) {
            return predicate[logicalOperator](new CriteriaClass(operand).predicate(path));
        }, defaultPredicate);
    };

    function selectDefaultPredicate(operator) {
        return Predicate[operator === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

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

    self.parseCriteria = function(RootCriteriaClass, SingleCriteriaClass) {
        if (self.isComposite()) {
            _.chain(_.keys(criteria))
                .each(function(key) {
                    criteria[key] = _.map(criteria[key], function(subcriteria) {
                        return new RootCriteriaClass(subcriteria).parseCriteria();
                    });
                }).value();
        } else {
            criteria = new SingleCriteriaClass(criteria).parseCriteria();
        }
        return criteria;
    };

    self.getPredicate = function (path, CompositeCriteriaClass, SingleCriteriaClass) {
        var nodeCriteria = self.isComposite() ?
            new CompositeCriteriaClass(criteria) :
            new SingleCriteriaClass(criteria);

        return nodeCriteria.predicate(path);
    };
}