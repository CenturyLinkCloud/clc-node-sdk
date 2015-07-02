
var _ = require('./../../../core/underscore.js');
var SingleGroupCriteria = require('./single-group-criteria.js');
var CompositeGroupCriteria = require('./composite-group-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = GroupCriteria;

/**
 * Class that used to filter groups
 * @typedef GroupCriteria
 * @type {(SingleGroupCriteria|CompositeGroupCriteria)}
 *
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