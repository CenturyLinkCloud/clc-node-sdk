
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../../core/search/common-criteria.js');

module.exports = VerticalAutoScalePolicyCriteria;

/**
 * Class that used to filter auto scale policies
 * @typedef VerticalAutoScalePolicyCriteria
 * @type {(SingleVerticalAutoScalePolicyCriteria|CompositeCriteria)}
 *
 */
function VerticalAutoScalePolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}