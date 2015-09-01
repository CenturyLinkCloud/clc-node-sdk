
var SingleCriteria = require('./single-network-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = NetworkCriteria;

/**
 * Class that used to filter networks
 * @typedef NetworkCriteria
 * @type {(SingleNetworkCriteria|CompositeCriteria)}
 *
 */
function NetworkCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}