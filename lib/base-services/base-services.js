
var DataCenterService = require('./datacenters/datacenter-service.js');
var _ = require('underscore');
var DataCenter = require('./datacenters/domain/datacenter.js');


module.exports = BaseServices;

function BaseServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.dataCenters = _.memoize(function () {
        return new DataCenterService(getRestClientFn());
    });

    self.DataCenter = DataCenter;

    init ();
}