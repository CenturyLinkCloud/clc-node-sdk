var _ = require('./../../core/underscore.js');
var Promise = require("bluebird");
var AntiAffinity = require('./anti-affinity/anti-affinity.js');
var Alert = require('./alert/alert.js');

module.exports = Policies;

/**
 * Service that allow to manage policies (anti-affinity, alert etc) in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function Policies(dataCenterService, policyClient, queueClient) {
    var self = this;

    self.antiAffinity = _.memoize(function () {
        return new AntiAffinity(
            dataCenterService,
            policyClient,
            queueClient
        );
    });

    self.alert = _.memoize(function () {
        return new Alert(
            policyClient,
            queueClient
        );
    });

}