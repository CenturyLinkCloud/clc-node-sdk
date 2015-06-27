
var _ = require('./../../../core/underscore.js');
var SingleGroupCriteria = require('./single-group-criteria.js');
var CompositeGroupCriteria = require('./composite-group-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = GroupCriteria;

/**
 * @typedef GroupCriteria
 * @type {object}
 *
 * @property {string} id - a group id restriction.
 * @property {string} name - a group name restriction.
 * @property {string} nameContains - restriction that pass only group which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only group which description contains specified keyword.
 * @property {DataCenterCriteria} dataCenter - restrict datacenters in which need to execute search.
 */
function GroupCriteria (criteria) {
    var self = this;

    self.predicate = function () {
        var groupCriteria = new Criteria(criteria).isConditional() ?
            new CompositeGroupCriteria(criteria) :
            new SingleGroupCriteria(criteria);

        return groupCriteria.predicate();
    };

    self.processDataCenterCriteria = function() {
        if (new Criteria(criteria).isConditional()) {
            _.each(_.keys(criteria), function(key) {
                criteria[key] = _.map(criteria[key], function(subcriteria) {
                    return new GroupCriteria(subcriteria).processDataCenterCriteria();
                });
            });
        } else {
            criteria = new SingleGroupCriteria(criteria).processDataCenterCriteria();
        }
        return criteria;
    };
}