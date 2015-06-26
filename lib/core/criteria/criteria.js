var _ = require('underscore');

module.exports = Criteria;

function Criteria(criteria) {
    var self = this;

    self.isConditional = function() {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    };

    //extract more specific criteria from another
    self.extractSubCriteria = function(convertFilterCriteriaFn) {
        if (self.isConditional()) {
            return convertConditionalCriteria(criteria);
        }
        return convertFilterCriteriaFn(criteria);

        function convertConditionalCriteria(criteria) {
            //extract only 1st criteria
            var pair = _.pairs(criteria)[0];
            var condition = pair[0];
            var expressions = _.asArray(pair[1]);

            var subcriteria = _.map(expressions, function(expression) {
                var converted;
                if (new Criteria(expression).isConditional()) {
                    converted = convertConditionalCriteria(expression);
                } else {
                    converted = convertFilterCriteriaFn(expression);
                }

                return converted;
            });

            var result = {};
            result[condition] = subcriteria;
            return result;
        }
    };
}