
var CompositeDataCenterCriteria = require('./composite-datacenter-criteria.js');
var SingleDataCenterCriteria = require('./single-datacenter-criteria.js');

module.exports = DataCenterCriteria;


/**
 * @typedef DataCenterSearchCriteria
 * @type {object}
 *
 * @property {string} id - a IDs of target datacenters
 * @property {string} name - a name of target datacenters
 * @property {string} nameContains - search datacenters which name contains specified keyword
 */
function DataCenterCriteria(criteria) {
    var self = this;

    self.predicate = function () {
        var dataCenterCriteria = self.isConditionalCriteria() ?
            new CompositeDataCenterCriteria(criteria) :
            new SingleDataCenterCriteria(criteria);

        return dataCenterCriteria.predicate();
    };

    self.isConditionalCriteria = function () {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    };
}