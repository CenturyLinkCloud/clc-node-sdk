
var DataCenterService = require('./datacenters/datacenter-service.js');
var _ = require('underscore');


module.exports = CommonServices;

function CommonServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.dataCenters = _.memoize(function () {
        return new DataCenterService(getRestClientFn());
    });

    init ();
}