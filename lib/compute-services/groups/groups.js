
var ServerClient = require('./../servers/server-client.js');
var GroupClient = require('./group-client.js');
var DataCenterService = require('./../../base-services/datacenters/datacenter-service.js');
var _ = require('underscore');
var Promise = require("bluebird");

module.exports = Groups;

/**
 * Service that allow to manage groups in CenturyLink Cloud
 *
 * @param rest
 * @constructor
 */
function Groups(rest) {
    var self = this;
    var serverClient = new ServerClient(rest);
    var dataCenters = new DataCenterService(rest);
    var groupClient = new GroupClient(rest);

    self.findByNameAndDatacenter = function(criteria) {
        return dataCenters.findSingle(criteria.datacenter)
            .then(function(datacenter) {
                return _.findWhere(datacenter.links, {rel: "group"}).id;
            })
            .then(function(groupId) {
                return serverClient.findGroupById(groupId);
            })
            .then(function(group) {
                return _.findWhere(group.groups, {name: criteria.name});
            });
    };

    /**
     * Method allow to create group
     *
     * @param {object} params
     * @param {GroupSearchCriteria} params.parentGroup
     * @param {string} params.name
     * @param {string} params.description
     *
     * @memberof Groups
     */
    self.create = function (params) {
        return groupClient.create(params);
    };
}
