
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
