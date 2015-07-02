
var _ = require('./../../../core/underscore.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = CompositeServerCriteria;

/**
 * The type of {@link ServerCriteria} that represents composite search criteria.
 * @typedef CompositeServerCriteria
 * @type {object}
 *
 * @property {Array<ServerCriteria>} or - the list of operands, that applies with OR operator.
 * @property {Array<ServerCriteria>} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          {
 *              nameContains: 'test100',
 *              dataCenterId: 'de1',
 *              onlyActive: true
 *          },
 *          {
 *              description: "test",
 *              dataCenter: [{id:'ca1'}, {nameContains: 'Toronto'}],
 *              where: function(metadata) {
 *                  return metadata.details.diskCount === 5;
 *              }
 *          }
 *  ]
 * }
 *
 */
function CompositeServerCriteria(criteria) {
    var ServerCriteria = require('./server-criteria.js');
    var self = this;

    self.predicate = function () {
        return new Criteria(criteria).compositePredicate(ServerCriteria);
    };
}