
var SingleCriteria = require('./single-template-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = TemplateCriteria;

/**
 * Class that used to filter templates
 * @typedef TemplateCriteria
 * @type {(SingleTemplateCriteria|CompositeCriteria)}
 *
 */
function TemplateCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}