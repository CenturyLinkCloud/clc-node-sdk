
var DataCenterService = require('./datacenters/datacenter-service.js');
var _ = require('underscore');
var DataCenter = require('./../compute-services/domain/datacenter.js');


module.exports = CommonServices;

function CommonServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.dataCenters = _.memoize(function () {
        return new DataCenterService(getRestClientFn());
    });

    self.DataCenter = new DataCenter();

    init ();
}