
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var Groups = require('./../groups/groups.js');
var Templates = require('./../templates/templates.js');
var OperationPromise = require('./../../common-services/queue/operation-promise.js');

var QueueClient = require('./../../common-services/queue/queue-client.js');
var DiskType = require('./../domain/disk-type.js');
var CreateServerConverter = require('./utils/create-server-converter.js');

//describe global objects
/**
 * @typedef ServerReference
 * @type {object}
 * @property {string} id - an ID.
 */

/**
 * @typedef CreateServerConfig
 * @type {object}
 * @property {string} name - a server name.
 * @property {string} description - a server description.
 *
 * @property {object} group - a group reference.
 * @property {DataCenter} group.datacenter - a datacenter reference.
 * @property {string} group.name - a group name.
 *
 * @property {object} template - a template reference.
 * @property {DataCenter} template.datacenter - a datacenter reference.
 * @property {Os} template.os - an os name.
 * @property {string} template.version - an os version.
 * @property {Machine.Architecture} template.architecture - an os architecture.
 * @property {string} template.edition - an os edition.
 *
 * @property {object} network - a network config.
 * @property {string} network.primaryDns - a primary DNS.
 * @property {string} network.secondaryDns - a secondary DNS.
 * @property {number} cpu - a cpu count.
 * @property {number} memoryGB - a memory size (in GB).
 * @property {Server} type - a server type.
 * @property {Server.StorageType} storageType - a type of server storage.
 * @property {string} ttl - Date/time that the server should be deleted (ISO format).
 */

module.exports = Servers;

/**
 * The service that works with servers
 * @param rest the REST client
 * @constructor
 */
function Servers(rest) {

    var self = this;
    var serverClient = new ServerClient(rest);
    var queueClient = new QueueClient(rest);
    var groups = new Groups(rest);
    var templates = new Templates(rest);
    var serverConverter = new CreateServerConverter(rest);

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
        var promise = new OperationPromise(queueClient, self.findByUuid);

        Promise.resolve(command)
            .then(serverConverter.fetchGroupId)
            .then(function(groupId) {
                return _.extend(command, {groupId: groupId});
            })
            .then(serverConverter.fetchTemplateName)
            .then(function(templateName) {
                return _.extend(command, {sourceServerId: templateName});
            })
            .then(serverConverter.convertDns)
            .then(serverConverter.convertMachine)
            .then(function(command) {
                return serverClient
                    .createServer(command)
                    .then(promise.resolveWhenJobCompleted , promise.processErrors);
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
            .then(promise.resolveWhenJobCompleted , promise.processErrors);

        return promise;
    }
}