
var Promise = require('bluebird');
var _ = require('./../../core/underscore.js');
var SearchSupport = require('./../../core/search/search-support.js');
var ServerCriteria = require('../servers/domain/server-criteria.js');
var BillingStatsEngine = require('./domain/billing-stats-engine.js');
var MonitoringStatsEngine = require('./domain/monitoring-stats-engine.js');

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
     * Get aggregated billing stats.
     * @param {Object} statsParams - filter and grouping params
     * filter by all dataCenters and grouping by group by default
     * @example
     * {
     *     group: {
     *         dataCenter: DataCenter.US_EAST_STERLING,
     *         name: Group.DEFAULT
     *     },
     *     groupBy: Resource.DATACENTER
     * }
     *
     * @returns {Promise<BillingStatsEntry[]>} - promise that resolved by list of BillingStatsEntry.
     *
     * @instance
     * @function billingStats
     * @memberof Statistics
     */
    self.billingStats = function (statsParams) {
        var statsEngine = new BillingStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    /**
     * Get aggregated monitoring stats.
     * @param {Object} statsParams - filter and grouping params
     * filter by all dataCenters and grouping by group by default
     * @example
     * {
     *     group: {
     *         dataCenter: DataCenter.US_EAST_STERLING,
     *         name: Group.DEFAULT
     *     },
     *     timeFilter: {
     *           start: '2015-04-05T16:00:00',
     *           end: '2015-04-05T22:00:00',
     *           sampleInterval: '02:00:00',
     *           type: MonitoringStatsType.HOURLY
     *     },
     *     groupBy: Resource.SERVER
     * }
     *
     * @returns {Promise<MonitoringStatsEntry[]>} - promise that resolved by list of MonitoringStatsEntry.
     *
     * @instance
     * @function monitoringStats
     * @memberof Statistics
     */
    self.monitoringStats = function (statsParams) {
        var statsEngine = new MonitoringStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    init();
}
