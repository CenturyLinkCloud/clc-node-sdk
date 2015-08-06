
var SingleDataCenterCriteria = require('./single-datacenter-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = DataCenterCriteria;


/**
 * Class that used to filter data centers
 * @typedef DataCenterCriteria
 * @type {(SingleDataCenterCriteria|CompositeCriteria)}
 *
 */
function DataCenterCriteria(criteria) {
    return new SearchCriteria(criteria, SingleDataCenterCriteria);
}