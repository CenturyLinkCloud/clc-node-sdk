
var ServerClient = require('./../servers/server-client.js');
var DataCenterService = require('./../../base-services/datacenters/datacenter-service.js');
var _ = require('underscore');
var Promise = require("bluebird");

module.exports = Groups;


function Groups(rest) {

    var self = this;
    var serverClient = new ServerClient(rest);
    var dataCenters = new DataCenterService(rest);

    self.findByNameAndDatacenter = function(criteria) {
        return dataCenters.findSingle(criteria.datacenter)
            .then(function(datacenter) {
                return  _.findWhere(datacenter.links, {rel: "group"}).id;
            })
            .then(function(groupId) {
                return serverClient.findGroupById(groupId);
            })
            .then(function(group) {
                return _.findWhere(group.groups, {name: criteria.name});
            });
    };
}