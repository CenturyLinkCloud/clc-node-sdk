
var DataCenterService = require('./datacenters/datacenter-service.js');
var _ = require('underscore');
var DataCenter = require('./../compute-services/domain/datacenter.js');
var Server = require('./../compute-services/domain/server.js');
var Group = require('./../compute-services/domain/group.js');


module.exports = BaseServices;

function BaseServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.dataCenters = _.memoize(function () {
        return new DataCenterService(getRestClientFn());
    });

    self.DataCenter = DataCenter;

    self.Server = Server;

    self.Group = Group;

    init ();
}