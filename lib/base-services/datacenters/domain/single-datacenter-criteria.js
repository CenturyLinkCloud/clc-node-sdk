
var Predicate = require('./../../../core/predicates/predicates.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleDataCenterCriteria;

/**
 * The type of {@link DataCenterCriteria} that represents single search criteria.
 * @typedef SingleDataCenterCriteria
 * @type {object}
 *
 * @property {string | Array<string>} id - a ID of target data center
 * @property {string | Array<string>} name - a name of target data center
 * @property {string | Array<string>} nameContains - search data centers which name contains specified keyword
 * @property {function} where - restriction that pass only data center which data match function logic.
 */
function SingleDataCenterCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byId()
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name')),

            path
        );
    };

    init();
}