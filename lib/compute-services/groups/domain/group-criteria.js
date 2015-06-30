
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

    self.predicate = function (path) {
        var groupCriteria = new Criteria(criteria).isComposite() ?
            new CompositeGroupCriteria(criteria) :
            new SingleGroupCriteria(criteria);

        return groupCriteria.predicate(path);
    };

    self.parseDataCenterCriteria = function() {
        if (new Criteria(criteria).isComposite()) {
            _.chain(_.keys(criteria))
            .each(function(key) {
                criteria[key] = _.map(criteria[key], function(subcriteria) {
                    return new GroupCriteria(subcriteria).parseDataCenterCriteria();
                });
            }).value();
        } else {
            criteria = new SingleGroupCriteria(criteria).parseDataCenterCriteria();
        }
        return criteria;
    };
}