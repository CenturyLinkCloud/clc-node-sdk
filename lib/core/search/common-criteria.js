
var _ = require('underscore');
var Criteria = require('./criteria.js');
var CompositeCriteria = require('./composite-criteria.js');

module.exports = SearchCriteria;

function SearchCriteria (criteria, SingleCriteriaClass) {
    var self = this;
    var criteriaHelper = new Criteria(criteria);

    self.predicate = function (path) {
        var subCriteria = criteriaHelper.isComposite() ?
            new CompositeCriteria(criteria, SingleCriteriaClass) :
            new SingleCriteriaClass(criteria);

        return subCriteria.predicate(path);
    };

    self.parseCriteria = function() {
        if (criteriaHelper.isComposite()) {
            _.chain(_.keys(criteria))
                .each(function(key) {
                    criteria[key] = _.map(criteria[key], function(subcriteria) {
                        return new SearchCriteria(subcriteria, SingleCriteriaClass).parseCriteria();
                    });
                }).value();
        } else {
            criteria = new SingleCriteriaClass(criteria).parseCriteria();
        }
        return criteria;
    };
}