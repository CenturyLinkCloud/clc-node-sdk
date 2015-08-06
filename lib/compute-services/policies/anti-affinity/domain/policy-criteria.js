
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = PolicyCriteria;

/**
 * Class that used to filter anti-affinity policies
 * @typedef PolicyCriteria
 * @type {(SinglePolicyCriteria|CompositeCriteria)}
 *
 */
function PolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}