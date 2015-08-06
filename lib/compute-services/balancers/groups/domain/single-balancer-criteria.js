
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleSharedLoadBalancerCriteria;


/**
 * The type of {@link SharedLoadBalancerCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleSharedLoadBalancerCriteria
 * @type {object}
 *
 * @property {string} id - a balancer id restriction.
 * @property {string} name - a balancer name restriction.
 * @property {string} ip - a balancer ip address restriction.
 * @property {string} status - a balancer status restriction.
 * @property {string} nameContains - restriction that pass only balancer which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only balancer which description contains specified keyword.
 * @property {function} where - restriction that pass only balancer which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only balancer which data center name contains specified keyword.
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
 * @example load balancer criteria
 * {
 *     name: ['My balancer'],
 *     descriptionContains: "blah",
 *     ip: ['66.155.94.19'],
 *     status: 'enabled',
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.name === 'Balancer';
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleSharedLoadBalancerCriteria(criteria) {
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
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byParamMatch('descriptionContains', 'description'))
            .and(filters.byParamAnyOf('ip', 'ipAddress'))
            .and(filters.byParamAnyOf('status')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}