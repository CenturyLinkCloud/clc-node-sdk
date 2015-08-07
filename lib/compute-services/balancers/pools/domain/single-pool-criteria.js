
var Predicate = require('./../../../../core/predicates/predicates.js');
var BalancerCriteria = require('./../../groups/domain/balancer-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleLoadBalancerPoolCriteria;


/**
 * The type of {@link LoadBalancerNodeCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>balancer</b> search criteria and the properties
 * <b>balancerId, balancerName, balancerNameContains, balancerDescription, balancerDescriptionContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {string} id - a pool id restriction.
 * @property {number} port - a pool port restriction.
 * @property {string} method - restriction that pass only pool which method equals specified keyword.
 * @property {string} persistence - restriction that pass only pool which persistence equals specified keyword.
 * @property {function} where - restriction that pass only pool which data match function logic.
 * @property {SharedLoadBalancerCriteria} balancer - restrict shared load balancers in which need to execute search.
 *
 * @property {string} balancerId - a shared load balancer id restriction.
 * @property {string} balancerName - a shared load balancer name restriction.
 * @property {string} balancerNameContains - restriction that pass only pool,
 * which shared load balancer name contains specified keyword.
 * @property {string} balancerDescription - a shared load balancer description restriction.
 * @property {string} balancerDescriptionContains - restriction that pass only pool,
 * which shared load balancer description contains specified keyword.
 *
 * @example shared load balancer criteria
 * {
 *     name: ['My balancer'],
 *     descriptionContains: "blah",
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.name === 'Balancer';
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 *
 * @example pool criteria
 * {
 *     port: [80, 443],
 *     method: "leastConnection",
 *     persistence: "sticky",
 *     where: function(metadata) {
 *          return metadata.nodes.length === 2;
 *     },
 *     balancerNameContains: 'Balancer'
 * }
 */
function SingleLoadBalancerPoolCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'balancer';

        self.criteriaPropertiesMap = {
            id: 'balancerId',
            name: 'balancerName',
            nameContains: 'balancerNameContains',
            description: 'balancerDescription',
            descriptionContains: 'balancerDescriptionContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(BalancerCriteria, 'balancer')
            .and(filters.byId())
            .and(filters.byParamAnyOf('method'))
            .and(filters.byParamAnyOf('port'))
            .and(filters.byParamAnyOf('persistence')),

            path
        );
    };

    self.parseCriteria = function () {
        return new Criteria(criteria).parseSingleCriteria(self);
    };

    init();
}