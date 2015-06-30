
var _ = require('./../../../core/underscore.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = CompositeGroupCriteria;


function CompositeGroupCriteria(criteria) {
    var GroupCriteria = require('./group-criteria.js');
    var self = this;

    self.predicate = function (path) {
        return new Criteria(criteria).compositePredicate(GroupCriteria, path);
    };
}