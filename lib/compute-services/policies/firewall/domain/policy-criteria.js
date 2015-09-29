
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = FirewallPolicyCriteria;

/**
 * Class that used to filter anti-affinity policies
 * @typedef FirewallPolicyCriteria
 * @type {(SingleFirewallPolicyCriteria|CompositeCriteria)}
 *
 */
function FirewallPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}