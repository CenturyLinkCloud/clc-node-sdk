
var DataCenterService = require('./datacenters/datacenters.js');
var QueueClient = require('./queue/queue-client.js');
var DataCenterClient = require('./datacenters/datacenter-client.js');
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

    self.dataCenters = _.memoize(function () {
        return new DataCenterService(dataCenterClient());
    });

    self.DataCenter = DataCenter;

    init ();
}