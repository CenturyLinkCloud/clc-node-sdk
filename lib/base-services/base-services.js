
var DataCenters = require('./datacenters/datacenters.js');
var QueueClient = require('./queue/queue-client.js');
var ExperimentalQueueClient = require('./queue/experimental-queue-client');
var DataCenterClient = require('./datacenters/datacenter-client.js');
var AccountClient = require('./account/account-client.js');
var _ = require('underscore');
var DataCenter = require('./datacenters/domain/datacenter.js');


module.exports = BaseServices;

function BaseServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    var dataCenterClient = _.memoize(function () {
        return new DataCenterClient(getRestClientFn());
    });

    self._queueClient = _.memoize(function () {
        return new QueueClient(getRestClientFn());
    });

    self._experimentalQueueClient = _.memoize(function () {
        return new ExperimentalQueueClient(getRestClientFn());
    });

    self.dataCenters = _.memoize(function () {
        return new DataCenters(dataCenterClient());
    });

    self.accountClient = _.memoize(function () {
        return new AccountClient(getRestClientFn());
    });

    self.DataCenter = DataCenter;

    init ();
}