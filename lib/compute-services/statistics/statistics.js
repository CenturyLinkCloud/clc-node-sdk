
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

    self.billingStats = function (statsParams) {
        var statsEngine = new BillingStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    init();
}
