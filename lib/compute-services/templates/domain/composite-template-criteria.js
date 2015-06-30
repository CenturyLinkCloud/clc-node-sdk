var _ = require('./../../../core/underscore.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = CompositeTemplateCriteria;


function CompositeTemplateCriteria(criteria) {
    var TemplateCriteria = require('./template-criteria.js');
    var self = this;

    self.predicate = function () {
        return new Criteria(criteria).compositePredicate(TemplateCriteria);
    };
}