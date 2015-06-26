
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = CompositeGroupCriteria;


function CompositeGroupCriteria(criteria) {
    var GroupCriteria = require('./group-criteria.js');
    var self = this;

    function selectDefaultPredicate(condition) {
        return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }

    self.predicate = function () {
        // extract only 1st criteria
        var value = _.pairs(criteria)[0];
        var condition = value[0];
        var expressions = _.asArray(value[1]);

        var predicate = selectDefaultPredicate(condition);

        _.each(expressions, function(expression) {
            var subCriteria = new GroupCriteria(expression);
            predicate = predicate[condition](subCriteria.predicate());
        });

        return predicate;
    };
}