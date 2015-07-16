
var _ = require('underscore');
var Criteria = require('./../../../../../core/search/criteria.js');

module.exports = CompositePolicyCriteria;

/**
 * The type of {@link PolicyCriteria} that represents composite search criteria.
 * @typedef CompositePolicyCriteria
 * @type {object}
 *
 * @property {Array<PolicyCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<PolicyCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              name: "My Policy",
 *              dataCenterId: 'de1'
 *          },
 *          {
 *              nameContains: "policy",
 *              dataCenter: [DE_FRANKFURT]
 *          }
 *  ]
 * }
 *
 */

function CompositePolicyCriteria(criteria) {
    var PolicyCriteria = require('./policy-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(PolicyCriteria, path);
    };
}