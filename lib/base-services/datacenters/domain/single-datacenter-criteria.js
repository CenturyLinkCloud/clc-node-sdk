
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = SingleDataCenterCriteria;

/**
 * The type of {@link DataCenterCriteria} that represents single search criteria.
 * @typedef SingleDataCenterCriteria
 * @type {object}
 *
 * @property {string} id - a IDs of target datacenters
 * @property {string} name - a name of target datacenters
 * @property {string} nameContains - search datacenters which name contains specified keyword
 * @property {function} where - restriction that pass only data center which data match function logic.
 */
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
        return Predicate.match(criteria.nameContains, "name");
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