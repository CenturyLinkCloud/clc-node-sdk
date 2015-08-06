
var SingleGroupCriteria = require('./single-group-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = GroupCriteria;

/**
 * Class that used to filter groups
 * @typedef GroupCriteria
 * @type {(SingleGroupCriteria|CompositeCriteria)}
 *
 */
function GroupCriteria (criteria) {
    return new SearchCriteria(criteria, SingleGroupCriteria);
}