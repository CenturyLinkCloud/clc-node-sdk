
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var Groups = require('./../groups/groups.js');
var Templates = require('./../templates/templates.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');

var QueueClient = require('./../../base-services/queue/queue-client.js');
var DiskType = require('./domain/disk-type.js');
var CreateServerConverter = require('./domain/create-server-converter.js');

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
function Servers(serverClient, serverConverter, queueClient) {
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

}