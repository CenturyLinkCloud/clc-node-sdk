
var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var BalancerCriteria = require('./../../groups/domain/balancer-criteria.js');

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

    function filterByMethod() {
        return criteria.method &&
            Predicate.equalToAnyOf(_.asArray(criteria.method), 'method') ||
            Predicate.alwaysTrue();
    }

    function filterByPort() {
        return criteria.port &&
            Predicate.equalToAnyOf(_.asArray(criteria.port), 'port') ||
            Predicate.alwaysTrue();
    }

    function filterByPersistence() {
        return criteria.persistence &&
            Predicate.equalToAnyOf(_.asArray(criteria.persistence), 'persistence') ||
            Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            (criteria.balancer ?
                new BalancerCriteria(criteria.balancer).predicate("balancer") : Predicate.alwaysTrue())
                .and(filterById())
                .and(filterByMethod())
                .and(filterByPersistence())
                .and(filterByPort())
                .and(filterByCustomPredicate()),
            path
        );
    };

    self.parseCriteria = function () {
        var balancerCriteria = collectCriteriaFromProperties();


        var parsedCriteria = _.omit(criteria, ['balancerId', 'balancerName', 'balancerNameContains',
            'balancerDescription', 'balancerDescriptionContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.balancer ? _.asArray(balancerCriteria)
            : _.asArray(parsedCriteria.balancer, balancerCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            if (nonEmptyOperands.length === 1) {
                parsedCriteria.balancer = nonEmptyOperands[0];
            } else {
                parsedCriteria.balancer = {or: nonEmptyOperands};
            }
        }

        //if criteria is empty - should find overall
        if (_.isEmpty(parsedCriteria) || _.isUndefined(parsedCriteria.balancer)) {
            parsedCriteria.balancer = {};
        }

        return parsedCriteria;
    };

    //instantiate object from properties
    function collectCriteriaFromProperties() {
        return {
            id: getCriteriaValue('balancerId'),
            name: getCriteriaValue('balancerName'),
            nameContains: getCriteriaValue('balancerNameContains'),
            description: getCriteriaValue('balancerDescription'),
            descriptionContains: getCriteriaValue('balancerDescriptionContains')
        };
    }

    function getCriteriaValue(property) {
        return criteria[property] ? _.asArray(criteria[property]) : null;
    }
}