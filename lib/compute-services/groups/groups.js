
var ServerClient = require('./../servers/server-client.js');
var GroupClient = require('./group-client.js');
var DataCenterService = require('./../../base-services/datacenters/datacenter-service.js');
var QueueClient = require('./../../base-services/queue/queue-client.js');
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var _ = require('underscore');
var Promise = require("bluebird");

module.exports = Groups;

/**
 * Service that allow to manage groups in CenturyLink Cloud
 *
 * @param rest
 * @constructor
 */
function Groups(serverClient, dataCenters, groupClient, queueClient) {
    var self = this;

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
        var result = groupClient.createGroup(params);

        return new NoWaitOperationPromise(queueClient, getGroupCriteria).from(result);
    };

    self.delete = function (groupCriteria) {
        var result = groupClient.deleteGroup(groupCriteria.id);

        return new OperationPromise(queueClient, _.constant({ id: groupCriteria.id })).from(result);
    };

    function getGroupCriteria(response) {
        return { id: response.id };
    }
}
