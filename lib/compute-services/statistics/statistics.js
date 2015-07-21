
var Promise = require('bluebird');
var _ = require('./../../core/underscore.js');
var SearchSupport = require('./../../core/search/search-support.js');
var ServerCriteria = require('../servers/domain/server-criteria.js');
var BillingStatsEngine = require('./domain/billing-stats-engine.js');

var Criteria = require('./../../core/search/criteria.js');

module.exports = Statistics;

/**
 * The service that works with statistics
 *
 * @constructor
 */

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

function Statistics (serverService, groupService, dataCenterService) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Get aggregated stats.
     * @param {Object} statsParams - filter and grouping params
     * @example
     * {
     *     group: {
     *         dataCenter: DataCenter.US_EAST_STERLING,
     *             name: Group.DEFAULT
     *     },
     *     groupBy: Resource.DATACENTER
     * }
     *
     * @returns {Promise<BillingStatsEntry[]} - promise that resolved by list of BillingStatsEntry.
     *
     * @instance
     * @function billingStats
     * @memberof Statistics
     */
    self.billingStats = function (statsParams) {
        var statsEngine = new BillingStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    init();
}
