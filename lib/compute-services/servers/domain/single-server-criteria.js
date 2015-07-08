
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');
var GroupCriteria = require('./../../groups/domain/group-criteria.js');

module.exports = SingleServerCriteria;


/**
 * The type of {@link ServerCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleServerCriteria
 * @type {object}
 *
 * @property {string} id - a server id restriction.
 * @property {string} name - a server name restriction.
 * @property {string} nameContains - restriction that pass only servers which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only servers which description contains specified keyword.
 * @property {function} where - restriction that pass only server which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 * @property {GroupCriteria} group - restrict groups in which need to execute search.
 * @property {Boolean} onlyActive - restriction that pass only active servers .
 * @property {Array<string>} powerStates - restriction that pass only servers in specified power state.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only server which data center name contains specified keyword.
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
 * @example server criteria
 * {
 *     nameContains:'web',
 *     onlyActive: true,
 *     powerStates: ['started'],
 *     dataCenter: [{id : 'ca1'}],
 *     dataCenterId: 'de1',
 *     dataCenterName: DataCenter.DE_FRANKFURT.name,
 *     group: {name: 'Default Group'}
 * }
 */
function SingleServerCriteria(criteria) {
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

    function filterByPowerState() {
        return criteria.powerStates && Predicate.equalToAnyOf(criteria.powerStates, "details.powerState") ||
            Predicate.alwaysTrue();
    }

    function filterActive() {
        return criteria.onlyActive && Predicate.equalTo("active", "status") ||
                Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            (criteria.group ? new GroupCriteria(criteria.group).predicate("group") : Predicate.alwaysTrue())
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains())
                .and(filterActive())
                .and(filterByPowerState()),
            path
        );
    };

    self.parseGroupCriteria = function () {
        criteria = new GroupCriteria(criteria).parseDataCenterCriteria();
        //instantiate object from properties
        var groupCriteria =
        {
            id: criteria.groupId ? _.asArray(criteria.groupId) : null,
            name: criteria.groupName ? _.asArray(criteria.groupName) : null,
            nameContains: criteria.groupNameContains ? _.asArray(criteria.groupNameContains) : null,
            dataCenter: criteria.dataCenter ? criteria.dataCenter : null
        };

        var parsedCriteria = _.omit(criteria, ['groupId', 'groupName', 'groupNameContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.group ? _.asArray(groupCriteria)
            : _.asArray(parsedCriteria.group, groupCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        //set to group criteria data center criteria
        if (parsedCriteria.dataCenter) {
            _.each(nonEmptyOperands, function(groupCriteria) {
                groupCriteria.dataCenter = parsedCriteria.dataCenter;
            });
        }

        if (nonEmptyOperands.length > 0) {
            if (nonEmptyOperands.length === 1) {
                parsedCriteria.group = nonEmptyOperands[0];
            } else {
                parsedCriteria.group = {or: nonEmptyOperands};
            }
        }

        return parsedCriteria;
    };
}