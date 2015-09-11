
var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');

module.exports = CompositeCriteria;

/**
 * Represents composite search criteria.
 * @typedef CompositeCriteria
 * @type {object}
 *
 * @property {Array} or - the list of operands, that applies with OR operator.
 * @property {Array} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          singleCriteriaObj1,
 *          singleCriteriaObj2
 *  ]
 * }
 *
 * @param criteria the search criteria
 * @param SingleCriteriaClass the class, that represents single search criteria
 * @constructor
 */
function CompositeCriteria(criteria, SingleCriteriaClass) {
    var self = this;
    var SearchCriteria = require('./common-criteria.js');

    self.predicate = function(path) {
        // extract only 1st criteria
        var compositeOperation = _.pairs(criteria)[0];
        var logicalOperator = compositeOperation[0];
        var operands = _.asArray(compositeOperation[1]);

        var defaultPredicate = selectDefaultPredicate(logicalOperator);

        return _.reduce(operands, function(predicate, operand) {
            return predicate[logicalOperator](new SearchCriteria(operand, SingleCriteriaClass).predicate(path));
        }, defaultPredicate);
    };

    function selectDefaultPredicate(operator) {
        return Predicate[operator === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }
}