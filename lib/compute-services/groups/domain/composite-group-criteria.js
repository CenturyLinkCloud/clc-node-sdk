
var _ = require('./../../../core/underscore.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = CompositeGroupCriteria;

/**
 * The type of {@link GroupCriteria} that represents composite search criteria.
 * @typedef CompositeGroupCriteria
 * @type {object}
 *
 * @property {Array<GroupCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<GroupCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              name: Group.ARCHIVE,
 *              dataCenterId: 'de1'
 *          },
 *          {
 *              description: "123test123",
 *              dataCenter: [{id:'test'}, {nameContains: 'blah'}]
 *          }
 *  ]
 * }
 *
 */

function CompositeGroupCriteria(criteria) {
    var GroupCriteria = require('./group-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(GroupCriteria, path);
    };
}