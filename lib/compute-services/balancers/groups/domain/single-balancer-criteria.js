
var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');

module.exports = SingleSharedLoadBalancerCriteria;


/**
 * The type of {@link LoadBalancerNodeCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleLoadBalancerNodeCriteria
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

    function filterDescriptionContains() {
        return Predicate.match(criteria.descriptionContains, "description");
    }

    function filterByIpAddress() {
        return criteria.ip &&
            Predicate.equalToAnyOf(_.asArray(criteria.ip), 'ipAddress') ||
            Predicate.alwaysTrue();
    }

    function filterByStatus() {
        return criteria.status &&
            Predicate.equalToAnyOf(_.asArray(criteria.status), 'status') ||
            Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            (criteria.dataCenter ?
                new DataCenterCriteria(criteria.dataCenter).predicate("dataCenter") : Predicate.alwaysTrue())
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains())
                .and(filterByIpAddress())
                .and(filterByStatus()),
            path
        );
    };

    self.parseCriteria = function () {
        //instantiate object from properties
        var dataCenterCriteria =
        {
            id: getCriteriaValue('dataCenterId'),
            name: getCriteriaValue('dataCenterName'),
            nameContains: getCriteriaValue('dataCenterNameContains')
        };

        var parsedCriteria = _.omit(criteria, ['dataCenterId', 'dataCenterName', 'dataCenterNameContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.dataCenter ?
            _.asArray(dataCenterCriteria)
            : _.asArray(parsedCriteria.dataCenter, dataCenterCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            if (nonEmptyOperands.length === 1) {
                parsedCriteria.dataCenter = nonEmptyOperands[0];
            } else {
                parsedCriteria.dataCenter = {or: nonEmptyOperands};
            }
        }

        //if criteria is empty - should find overall
        if (_.isEmpty(parsedCriteria) || _.isUndefined(parsedCriteria.dataCenter)) {
            parsedCriteria.dataCenter = {};
        }

        return parsedCriteria;
    };

    function getCriteriaValue(property) {
        return criteria[property] ? _.asArray(criteria[property]) : null;
    }
}