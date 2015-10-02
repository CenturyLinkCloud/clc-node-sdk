
var Predicate = require('./../../../../../core/predicates/predicates.js');
var Criteria = require('./../../../../../core/search/criteria.js');

module.exports = SingleVerticalAutoScalePolicyCriteria;


/**
 * The type of {@link VerticalAutoScalePolicyCriteria} that represents single search criteria.
 *
 * @typedef SingleVerticalAutoScalePolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - an auto scale policy id restriction.
 * @property {String | Array<String>} name - an auto scale policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy which name
 * contains specified keyword.
 *
 * @property {String | Array<String>} resourceType - a resource type restriction.
 * @property {int | Array<int>} thresholdPeriodMinutes - a threshold period in minutes restriction.
 * @property {int | Array<int>} scaleUpIncrement - a scale up increment restriction.
 * @property {int | Array<int>} scaleUpThreshold - a scale up threshold restriction.
 * @property {String | Array<String>} scaleDownThreshold - a scale down threshold restriction.
 *
 * @property {function} where - restriction that pass only policy which data match function logic.
 *
 * @example policy criteria
 * {
 *     name: ["My Policy"],
 *     nameContains: "test",
 *     resourceType: "cpu",
 *     thresholdPeriodMinutes: 30,
 *     scaleUpIncrement: 4,
 *     scaleUpThreshold: 50,
 *     scaleDownThreshold: 20,
 *     where: function(policy) {
 *          return 2 === policy.range.min && 4 === policy.range.max;
 *     }
 * }
 */
function SingleVerticalAutoScalePolicyCriteria(criteria) {
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
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamAnyOf('resourceType'))
            .and(filters.byParamAnyOf('thresholdPeriod', 'thresholdPeriodMinutes'))
            .and(filters.byParamAnyOf('scaleUpIncrement'))
            .and(filters.byParamAnyOf('scaleUpThreshold'))
            .and(filters.byParamAnyOf('scaleDownThreshold')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self, true);
    };

    init();
}