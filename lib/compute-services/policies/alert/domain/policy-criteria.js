
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = AlertPolicyCriteria;

/**
 * Class that used to filter alert policies
 * @typedef AlertPolicyCriteria
 * @type {(SingleAlertPolicyCriteria|CompositeCriteria)}
 *
 */
function AlertPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}