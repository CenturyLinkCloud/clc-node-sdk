
var _ = require('underscore');
var SinglePolicyCriteria = require('./single-policy-criteria.js');
var CompositePolicyCriteria = require('./composite-policy-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = PolicyCriteria;

/**
 * Class that used to filter alert policies
 * @typedef PolicyCriteria
 * @type {(SinglePolicyCriteria|CompositePolicyCriteria)}
 *
 */
function PolicyCriteria (criteria) {
    var self = this;

    self.predicate = function (path) {
        var policyCriteria = new Criteria(criteria).isComposite() ?
            new CompositePolicyCriteria(criteria) :
            new SinglePolicyCriteria(criteria);

        return policyCriteria.predicate(path);
    };

    self.get = function() {
        if (new Criteria(criteria).isComposite()) {
            _.chain(_.keys(criteria))
            .each(function(key) {
                criteria[key] = _.map(criteria[key], function(subcriteria) {
                    return new PolicyCriteria(subcriteria).get();
                });
            }).value();
        } else {
            criteria = new SinglePolicyCriteria(criteria).get();
        }
        return criteria;
    };
}