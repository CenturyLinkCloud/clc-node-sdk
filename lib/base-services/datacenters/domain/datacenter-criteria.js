
var CompositeDataCenterCriteria = require('./composite-datacenter-criteria.js');
var SingleDataCenterCriteria = require('./single-datacenter-criteria.js');
var Criteria = require('./../../../core/criteria/criteria.js');
var _ = require('underscore');

module.exports = DataCenterCriteria;


/**
 * @typedef DataCenterSearchCriteria
 * @type {object}
 *
 * @property {string} id - a IDs of target datacenters
 * @property {string} name - a name of target datacenters
 * @property {string} nameContains - search datacenters which name contains specified keyword
 */
function DataCenterCriteria(criteria) {
    var self = this;

    self.predicate = function (path) {
        var dataCenterCriteria = Criteria.isConditionalCriteria(criteria) ?
            new CompositeDataCenterCriteria(criteria) :
            new SingleDataCenterCriteria(criteria);

        return dataCenterCriteria.predicate(path);
    };
}

//extract datacenter related criteria options from another criteria
DataCenterCriteria.extractCriteria = function(criteria, convertFilterCriteriaFn) {
    if (Criteria.isConditionalCriteria(criteria)) {
        return convertConditionalCriteria(criteria);
    }
    return convertFilterCriteriaFn(criteria);

    function convertConditionalCriteria(conditionalCriteria) {
        //extract only 1st criteria
        var pair = _.pairs(conditionalCriteria)[0];
        var condition = pair[0];
        var expressions = _.asArray(pair[1]);

        var subcriteria = [];

        _.each(expressions, function(expression) {
            var converted;
            if (Criteria.isConditionalCriteria(expression)) {
                converted = convertConditionalCriteria(expression);
            } else {
                converted = convertFilterCriteriaFn(expression);
            }
            subcriteria.push(converted);
        });

        var result = {};
        result[condition] = subcriteria;
        return result;
    }
};