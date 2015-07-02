
var CompositeDataCenterCriteria = require('./composite-datacenter-criteria.js');
var SingleDataCenterCriteria = require('./single-datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');
var _ = require('underscore');

module.exports = DataCenterCriteria;


/**
 * Class that used to filter data centers
 * @typedef DataCenterCriteria
 * @type {(SingleDataCenterCriteria|CompositeDataCenterCriteria)}
 *
 */
function DataCenterCriteria(criteria) {
    var self = this;

    self.predicate = function (path) {
        var dataCenterCriteria = new Criteria(criteria).isComposite() ?
            new CompositeDataCenterCriteria(criteria) :
            new SingleDataCenterCriteria(criteria);

        return dataCenterCriteria.predicate(path);
    };

}