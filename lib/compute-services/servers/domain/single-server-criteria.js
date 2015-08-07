
var _ = require('underscore');
var Predicate = require('./../../../core/predicates/predicates.js');
var GroupCriteria = require('./../../groups/domain/group-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

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
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(new GroupCriteria(criteria).parseCriteria());
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'group';

        self.criteriaPropertiesMap = {
            id: 'groupId',
            name: 'groupName',
            nameContains: 'groupNameContains',
            dataCenter: 'dataCenter'
        };
    }

    function filterActive() {
        return criteria.onlyActive && Predicate.equalTo("active", "status") ||
                Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(GroupCriteria, 'group')
                .and(filters.byId())
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name'))
                .and(filters.byParamMatch('descriptionContains', 'description'))
                .and(filters.byParamAnyOf('powerStates', 'details.powerState'))

                .and(filterActive()),
            path
        );
    };

    self.parseCriteria = function () {
        var parsedCriteria = criteriaHelper.parseSingleCriteria(self);

        if (_.isEmpty(parsedCriteria.group)) {
            delete parsedCriteria.group;
        }

        return parsedCriteria;
    };

    init();
}