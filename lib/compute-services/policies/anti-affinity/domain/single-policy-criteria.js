
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleAntiAffinityPolicyCriteria;


/**
 * The type of {@link AntiAffinityPolicyCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleAntiAffinityPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - a anti-affinity policy id restriction.
 * @property {String | Array<String>} name - a anti-affinity policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy which name
 * contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {String | Array<String>} dataCenterId - a data center id restriction.
 * @property {String | Array<String>} dataCenterName - a data center name restriction.
 * @property {String | Array<String>} dataCenterNameContains - restriction that pass only group which data center name
 * contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example policy criteria
 * {
 *     name: ["My Policy"],
 *     nameContains: "test",
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(policy) {
 *          return ["DE1", "GB1"].indexOf(policy.location) === -1;
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleAntiAffinityPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self, true);
    };

    init();
}