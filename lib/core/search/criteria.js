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
}