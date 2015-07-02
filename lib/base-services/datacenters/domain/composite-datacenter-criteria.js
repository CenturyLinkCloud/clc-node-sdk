
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = CompositeDataCenterCriteria;

/**
 * The type of {@link DataCenterCriteria} that represents composite search criteria.
 * @typedef CompositeDataCenterCriteria
 * @type {object}
 *
 * @property {Array<DataCenterCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<DataCenterCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * and: [
 *    { nameContains: 'CA' },
 *    { name: 'CA1 - Canada (Vancouver)' },
 *    { and: [{ nameContains: 'Canada' }, { id: 'ca1' }] }
 * ]
 *
 */
function CompositeDataCenterCriteria(criteria) {
    var DataCenterCriteria = require('./datacenter-criteria.js');
    var self = this;

    function selectDefaultPredicate(condition) {
        return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

    self.predicate = function (path) {
        // extract only 1st criteria
        var value = _.pairs(criteria)[0];
        var condition = value[0];
        var expressions = _.asArray(value[1]);

        var predicate = selectDefaultPredicate(condition);

        _.each(expressions, function(expression) {
            var subCriteria = new DataCenterCriteria(expression);
            predicate = predicate[condition](subCriteria.predicate(path));
        });

        return predicate;
    };
}