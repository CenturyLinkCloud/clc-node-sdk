
var _ = require('underscore');
var Predicate = require('./../../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../../base-services/datacenters/domain/datacenter-criteria.js');

module.exports = SinglePolicyCriteria;


/**
 * The type of {@link PolicyCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SinglePolicyCriteria
 * @type {object}
 *
 * @property {string} id - a anti-affinity policy id restriction.
 * @property {string} name - a anti-affinity policy name restriction.
 * @property {string} nameContains - restriction that pass only policy which name contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only group which data center name contains specified keyword.
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
function SinglePolicyCriteria(criteria) {
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
            (criteria.dataCenter ?
                new DataCenterCriteria(criteria.dataCenter).predicate("dataCenter") : Predicate.alwaysTrue())
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains()),
            path
        );
    };

    self.parseDataCenterCriteria = function () {
        //instantiate object from properties
        var dataCenterCriteria =
        {
            id: criteria.dataCenterId ? _.asArray(criteria.dataCenterId) : null,
            name: criteria.dataCenterName ? _.asArray(criteria.dataCenterName) : null,
            nameContains: criteria.dataCenterNameContains ? _.asArray(criteria.dataCenterNameContains) : null
        };

        var parsedCriteria = _.omit(criteria, ['dataCenterId', 'dataCenterName', 'dataCenterNameContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.dataCenter ? _.asArray(dataCenterCriteria)
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
        if (_.isEmpty(parsedCriteria)) {
            parsedCriteria.dataCenter = {};
        }

        return parsedCriteria;
    };
}