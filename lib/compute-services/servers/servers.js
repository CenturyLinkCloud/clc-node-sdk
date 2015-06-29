
var _ = require('underscore');
var Promise = require("bluebird");
var Templates = require('./../templates/templates.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');

var DiskType = require('./domain/disk-type.js');
var Criteria = require('./../../core/criteria/criteria.js');
var GroupCriteria = require('./../groups/domain/group-criteria.js');
var ServerCriteria = require('./domain/server-criteria');

//describe global objects
/**
 * @typedef ServerReference
 * @type {object}
 * @property {string} id - an ID.
 */

module.exports = Servers;

/**
 * The service that works with servers
 * @param rest the REST client
 * @constructor
 */
function Servers(serverClient, serverConverter, queueClient, groupService) {
    var self = this;

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    /**
     * Method allows to resolve resource metadata by reference.
     *
     * @param {...ServerReference} refs the server references
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function findByRef
     */
    self.findByRef = function () {
        var promises = _.chain([arguments])
            .flatten()
            .map(function (reference) {
                return serverClient.findServerById(reference.id);
            })
            .value();

        return Promise.all(promises).then(preprocessResult);
    };

    /**
     * Method allows to find server by uuid.
     * @param uuid {String} the server uuid
     * @returns {Promise}
     *
     * @memberof Servers
     * @instance
     * @function findByUuid
     */
    self.findByUuid = function(uuid) {
        return serverClient
            .findServerByUuid(uuid)
            .then(preprocessResult);
    };

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        criteria = new ServerCriteria(criteria).processGroupCriteria();

        var groupCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.group;
        });

        return groupService.find(groupCriteria)
            .then(loadServerDetails)
            .then(getServers)
            .then(_.partial(filterServers, criteria));
    };

    function loadServerDetails(groups) {
        return Promise.all(
            _.map(groups, function(group) {
                return groupService.findByRef(group, true)
                    .then(function(groupWithServers) {
                        groupWithServers.dataCenter = group.dataCenter;
                        return groupWithServers;
                    });
            })
        );
    }

    function getServers(groups) {
        return _.chain(
            _.map(groups, function(group) {
                return group.getAllServers();
            }))
            .flatten()
            .value();
    }

    function filterServers(criteria, servers) {
        if (!servers || servers.length === 0) {
            return [];
        }
        return _.filter(servers, new ServerCriteria(criteria).predicate().fn);
    }

    function resolveServerId(response) {
        return self
            .findByUuid(_.findWhere(response.links, {rel: "self"}).id)
            .then(function (metadata) {
                return { id: metadata.id };
            });
    }

    function composeCreateServerPromise(command) {
        return Promise.resolve(command)
            .then(serverConverter.fetchGroupId)
            .then(function(groupId) {
                return _.extend(command, {groupId: groupId});
            })
            .then(serverConverter.fetchTemplateName)
            .then(function(templateName) {
                return _.extend(command, {sourceServerId: templateName});
            })
            .then(serverConverter.convertDns)
            .then(serverConverter.convertMachine);
    }

    /**
     * Creates a new server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function create
     */
    self.create = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId);

        composeCreateServerPromise(command)
            .then(function(request) {
                return serverClient
                    .createServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    /**
     * Clone created server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function clone
     */
    self.clone = function (command, serverId) {
        var promise = new OperationPromise(queueClient, resolveServerId);

        composeCreateServerPromise(command)
            .then(serverConverter.convertServerAttributesToClone)
            .then(function(request) {
                return serverClient
                    .cloneServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    /**
     * Deletes a server.
     * @param {ServerReference} server the server reference
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function delete
     */
    self.delete = function (server) {
        var promise = new OperationPromise(queueClient);

        serverClient
            .deleteServer(server.id)
            .then(promise.resolveWhenJobCompleted, promise.processErrors);

        return promise;
    };

    /**
     * Method returns credentials of single server specified by search criteria
     * @params {ServerSearchCriteria} criteria that allow to specify target single server
     *
     * @returns {Promise} Credentials data for specified server
     */
    self.findCredentials = function (criteria) {
//        var criteria = self._searchCriteriaFrom(arguments);

        return Promise
                .resolve(criteria)
//                .then(self.findSingle)
                .then(getServerId)
                .then(serverClient.findServerCredentials);
    };

    function getServerId (metadata) {
        return metadata.id;
    }

}