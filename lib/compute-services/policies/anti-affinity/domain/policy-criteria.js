
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = AntiAffinityPolicyCriteria;

/**
 * Class that used to filter anti-affinity policies
 * @typedef AntiAffinityPolicyCriteria
 * @type {(SingleAntiAffinityPolicyCriteria|CompositeCriteria)}
 *
 */
function AntiAffinityPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}