
var Predicate = require('./../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleGroupCriteria;


/**
 * The type of {@link NetworkCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleGroupCriteria
 * @type {object}
 *
 * @property {string} id - a network id restriction.
 * @property {string} name - a network name restriction.
 * @property {string} gateway - a network gateway restriction.
 * @property {string} netmask - a network netmask restriction.
 * @property {int} vlan - a network vlan restriction.
 * @property {string} nameContains - restriction that pass only network which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only network which description contains specified keyword.
 * @property {function} where - restriction that pass only network which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only group which data center name contains specified keyword.
 *
 * @example
 * {
 *     name: "vlan_9998_12.34.0",
 *     descriptionContains: "12.34.0",
 *     gateway: "12.34.0.1",
 *     netmask: "255.255.255.0",
 *     vlan: 9998,
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.type === "private";
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleGroupCriteria(criteria) {
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
            .and(filters.byParamAnyOf('gateway'))
            .and(filters.byParamAnyOf('netmask'))
            .and(filters.byParamAnyOf('vlan'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byParamMatch('descriptionContains', 'description')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}