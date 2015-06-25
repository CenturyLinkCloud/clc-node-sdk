
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = SingleDataCenterCriteria;


function SingleDataCenterCriteria(criteria) {
    var self = this;

    function filterById() {
        if (criteria.id) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    }

    function filterByName () {
        return criteria.name &&
            Predicate.equalToAnyOf(_.asArray(criteria.name), 'name') ||
            Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    function filterNameContains() {
        return new Predicate(function(data) {
            if (criteria.nameContains) {
                var found = _.filter(_.asArray(criteria.nameContains), function (value) {
                    return Predicate.compareIgnoreCase(value, data.name);
                }).length;

                if (found === 0) {
                    return false;
                }
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filterById()
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains()),
            path
        );
    };
}