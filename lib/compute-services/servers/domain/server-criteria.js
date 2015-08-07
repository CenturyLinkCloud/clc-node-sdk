
var SingleServerCriteria = require('./single-server-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = ServerCriteria;

/**
 * Class that used to filter servers
 * @typedef ServerCriteria
 * @type {(SingleServerCriteria|CompositeCriteria)}
 *
 */
function ServerCriteria (criteria) {
    return new SearchCriteria(criteria, SingleServerCriteria);

}