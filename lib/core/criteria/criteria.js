var _ = require('underscore');

module.exports = Criteria;

function Criteria() {}

Criteria.isConditionalCriteria = function(criteria) {
    return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
};

Criteria.extractDataCenterCriteria = function(groupCriteria, convertFilterCriteriaFn) {
    if (Criteria.isConditionalCriteria(groupCriteria)) {
        return convertConditionalCriteria(groupCriteria);
    }
    return convertFilterCriteriaFn(groupCriteria);

    function convertConditionalCriteria(criteria) {
        //extract only 1st criteria
        var pair = _.pairs(criteria)[0];
        var condition = pair[0];
        var expressions = _.asArray(pair[1]);

        var subcriteria = [];

        _.each(expressions, function(expression) {
            var converted;
            if (Criteria.isConditionalCriteria(expression)) {
                converted = convertConditionalCriteria(expression);
            } else {
                converted = convertFilterCriteriaFn(expression);
            }
            subcriteria.push(converted);
        });

        var result = {};
        result[condition] = subcriteria;
        return result;
    }
};