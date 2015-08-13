
var _ = require('underscore');
var Promise = require("bluebird");
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var CreateServerJob = require('./../../base-services/queue/domain/create-server-job.js');
var SshClient = require('./domain/ssh-client.js');
var Server = require('./domain/server.js');

var Criteria = require('./../../core/search/criteria.js');
var ServerCriteria = require('./domain/server-criteria');
var PublicIpConverter = require('./domain/public-ip-converter.js');
var SearchSupport = require('./../../core/search/search-support.js');

//describe global objects
/**
 * @typedef ServerReference
 * @type {object}
 * @property {string} id - an ID.
 */

module.exports = Servers;

/**
 * The service that works with servers
 * @param {ServerClient} serverClient server REST client
 * @param {CreateServerConverter} serverConverter server converter
 * @param {QueueClient} queueClient queue REST client
 * @param {Groups} groupService group service
 * @constructor
 */
function Servers(serverClient, serverConverter, queueClient, groupService) {
    var self = this;

    function init () {
        SearchSupport.call(self);
        serverConverter._serverService(self);
    }

    function initCriteria() {
        return new ServerCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    function findByRef() {
        var promises = _.chain([arguments])
            .flatten()
            .map(function (reference) {
                return serverClient.findServerById(reference.id);
            })
            .value();

        return Promise.all(promises).then(preprocessResult);
    }

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
     * Method allows to search servers.
     *
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be searched
     *
     * @return {Promise<Array<ServerMetadata>>} - promise that resolved by list of references to
     * successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Servers
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var groupCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.group;
        });

        var filteredByDataCenterPromise;
        if (!groupCriteria) {
            filteredByDataCenterPromise = Promise.resolve([]);
        } else {
            filteredByDataCenterPromise = groupService.find(groupCriteria);
        }

        return filteredByDataCenterPromise
            .then(loadServerDetails)
            .then(getServers)
            .then(_.partial(loadServersById, criteria))
            .then(_.flatten)
            .then(_.partial(filterServers, criteria));
    };

    function loadServerDetails(groups) {
        return Promise.all(
            _.map(groups, function(group) {
                return groupService._findByRef(group, true)
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

    function loadServersById(criteria, servers) {
        var allIds = new Criteria(criteria).extractIdsFromCriteria();
        if (!_.isEmpty(allIds)) {
            return Promise.join(
                Promise.all(
                    _.map(_.asArray(allIds), function(serverId) {
                        return findByRef({id: serverId});
                    })),
                servers
            );
        } else {
            return servers;
        }
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
            .then(_.partial(setGroupIdToCommand, command))
            .then(serverConverter.loadTemplate)
            .then(serverConverter.setManagedOs)
            .then(serverConverter.setHyperscaleServer)
            .then(serverConverter.setTemplateName)
            .then(serverConverter.convertDns)
            .then(serverConverter.convertMachine)
            .then(serverConverter.convertCustomFields)
            .then(serverConverter.convertTtl)
            .then(serverConverter.setPolicies)
            .then(serverConverter.setDefaultValues)
            .then(serverConverter.clearConfig);
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
        var promise = new OperationPromise(queueClient, resolveServerId, "Create Server");

        composeCreateServerPromise(command)
            .then(function(request) {
                return serverClient
                    .createServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        if (command.managedOS === true) {
            promise.addJobFn(waitUntilServerIsConstructed());
        }

        if (command.publicIp) {
            promise.addJobFn(waitUntilPublicIpIsAdded(command));
        }

        return promise;
    };

    function waitUntilPublicIpIsAdded(command) {
        return function(server) {
            return self.addPublicIp(server, command.publicIp);
        };
    }

    function waitUntilServerIsConstructed() {
        return function(server) {
            return new CreateServerJob(serverClient, server);
        };
    }

    /**
     * Clone created server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function clone
     */
    self.clone = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId, "Clone Server");

        composeCreateServerPromise(command)
            .then(serverConverter.convertServerAttributesToClone)
            .then(function(request) {
                return serverClient
                    .cloneServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    function setGroupIdToCommand(command, groupId) {
        if (groupId) {
            return _.extend(command, {groupId: groupId});
        }
        return command;
    }

    function composeModifyPasswordConfig(command) {
        if (command.password !== undefined) {
            if (command.currentPassword === command.password) {
                delete command.password;
                delete command.currentPassword;
            } else {
                command.password = {
                    current: command.currentPassword,
                    password: command.password
                };
            }
        }
    }

    function composeModifyDisksConfig(command) {
        if (command.disks) {
            var serverData = command.serversData;
            var diskConfig = _.chain(serverData).map(_.property("disks")).flatten().value();

            //disk config provided as array - no conversion needed
            if (!(command.disks instanceof Array)) {
                var newDiskCfg = command.disks;

                if (newDiskCfg.add) {
                    var toAdd = _.asArray(newDiskCfg.add);
                    diskConfig = diskConfig.concat(toAdd);
                }

                if (newDiskCfg.remove) {
                    var toRemove = _.asArray(newDiskCfg.remove);
                    diskConfig = _.filter(diskConfig, function(disk) {
                        return toRemove.indexOf(disk.id) === -1;
                    });
                }

                if (newDiskCfg.edit) {
                    var toEdit = _.asArray(newDiskCfg.edit);

                    _.each(diskConfig, function(srvDisk) {
                        var newDiskCfg = _.findWhere(toEdit, {id: srvDisk.id});
                        if (newDiskCfg) {
                            srvDisk.size = newDiskCfg.size;
                        }
                    });
                }
            }

            command.disks = _.chain(diskConfig)
                .flatten()
                .each(function(cfg) {
                    if (cfg.id) {
                        cfg.diskId = cfg.id;
                        delete cfg.id;
                    }
                    if (cfg.size) {
                        cfg.sizeGB = cfg.size;
                        delete cfg.size;
                    }
                    delete cfg.partitionPaths;
                })
                .uniq(function(cfg) {
                    return cfg.diskId;
                })
                .value();
        }
    }

    function composeModifyServerPromise(command) {
        return Promise.resolve(command)
            .then(serverConverter.fetchGroupId)
            .then(_.partial(setGroupIdToCommand, command))
            .then(serverConverter.convertCustomFields)
            .then(function(command) {
                var updateProperties = ['description', 'groupId', 'cpu', 'memory', 'disks', 'password', 'customFields'];

                composeModifyPasswordConfig(command);

                composeModifyDisksConfig(command);

                var updateConfig = _.chain(updateProperties)
                    .map(function(property) {
                        if(command[property]) {
                            return {
                                op: 'set',
                                member: property,
                                value: command[property]
                            };
                        }
                    })
                    .compact()
                    .value();

                return {
                    serverId: command.serverId,
                    config: updateConfig
                };
            });
    }

    function composeModifyServersRequest(command) {
        return Promise.all(_.map(command.serversData, function(data) {
            var cmd = _.extend(
                command,
                {
                    serverId: data.id,
                    currentPassword: data.credentials.password
                });

            return composeModifyServerPromise(cmd);
        }));
    }

    /**
     * Modify servers.
     * @param {SearchCriteria} searchCriteria - criteria that specify set of servers that will be modified
     * @param {ModifyServerConfig} command the server modify config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function modify
     */
    self.modify = function (searchCriteria, command) {

        var result = self.find(searchCriteria)
            .then(function(servers) {
                return Promise.all(_.map(servers, function(srv) {
                    return Promise.props({
                        id: srv.id,
                        disks: srv.details.disks,
                        credentials: self.findCredentials({id: srv.id})
                    });
                }));
            })
            .then(function(serversData) {
                command.serversData = serversData;
                return command;
            })
            .then(composeModifyServersRequest)
            .then(_.partial(_.map, _, modify))
            .then(Promise.settle);

        return new OperationPromise(
            queueClient,
            function() {
                return _.map(command.serversData, _.partial(_.omit, _, 'disks', 'credentials'));
            },
            "Modify Server"
        ).fromInspections(result);
    };

    function modify(request) {
        return serverClient.modifyServer(request.serverId, request.config);
    }

    /**
     * Deletes a server.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be deleted
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function delete
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (servers) {
                return Promise.settle(_.map(servers, deleteServer));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Delete Server").fromInspections(result);
    };

    function deleteServer(serverMetadata) {
        return serverClient
            .deleteServer(serverMetadata.id)
            .then(function (jobInfo) {
                jobInfo.server = serverMetadata.id;
                return jobInfo;
            });
    }

    /**
     * Method returns credentials of single server specified by search criteria
     * @params {ServerSearchCriteria} criteria that allow to specify target single server
     *
     * @returns {Promise} Credentials data for specified server
     */
    self.findCredentials = function () {
        var criteria = self._searchCriteriaFrom(arguments);

        return Promise
            .resolve(criteria)
            .then(self.findSingle)
            .then(getServerId)
            .then(serverClient.findServerCredentials);
    };

    function getServerId (metadata) {
        return metadata.id;
    }

    /**
     * Import server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function import
     */
    self.import = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId, "Import Server");

        composeCreateServerPromise(command)
            .then(serverConverter.convertServerAttributesToImport)
            .then(function(request) {
                return serverClient
                    .importServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    /**
     * Power on servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be started
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function powerOn
     */
    self.powerOn = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "powerOn");
    };

    /**
     * Power off servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be stopped
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function powerOff
     */
    self.powerOff = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "powerOff");
    };

    /**
     * Pause servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be paused
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function pause
     */
    self.pause = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "pause");
    };

    /**
     * Start maintenance servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function startMaintenance
     */
    self.startMaintenance = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "startMaintenance");
    };

    /**
     * Stop maintenance servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function stopMaintenance
     */
    self.stopMaintenance = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "stopMaintenance");
    };


    /**
     * Shut down servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be shut downed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function shutDown
     */
    self.shutDown = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "shutDown");
    };

    /**
     * Reboot servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be rebooted
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function reboot
     */
    self.reboot = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "reboot");
    };

    /**
     * Reset servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be reseted
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function reset
     */
    self.reset = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "reset");
    };

    /**
     * Archive servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be archived
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function archive
     */
    self.archive = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "archive");
    };

    /**
     * Restore servers to group.
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers that will be restored
     * @param {GroupCriteria} groupCriteria - criteria that specify group, in that will be server restored
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function restore
     */
    self.restore = function(serverCriteria, groupCriteria) {
        serverCriteria = initCriteria(serverCriteria);

        var result = self.find(serverCriteria)
            .then(function(servers) {
                return Promise.props({
                    serverIds: extractServerIdFromMetadataList(servers),
                    targetGroup: getGroupId(groupCriteria)
                });
            })
            .then(function(result) {
                return Promise.settle(_.map(result.serverIds, _.partial(restore, _, result.targetGroup)));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Restore Server").fromInspections(result);

    };

    function restore(serverId, groupId) {
        return serverClient.restore(serverId, {targetGroupId: groupId})
            .then(function(status) {
                return Promise.resolve(_.extend(status, {server: serverId}));
            });
    }

    function sendPowerOperationRequest(criteria, operation) {
        var result = self.find(criteria)
            .then(extractServerIdFromMetadataList)
            .then(function(serverIds) {
                return serverClient.powerOperation(operation, serverIds);
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Power operation: " + operation).from(result);
    }

    function extractServerIdFromMetadataList(servers) {
        return _.map(servers, function(server) {
            return server.id.toUpperCase();
        });
    }

    function getGroupId(groupCriteria) {
        return groupService.findSingle(groupCriteria)
            .then(_.property('id'));
    }

    function extractServerIdsFromStatus(jobInfoList) {
        return jobInfoList.map(function (curInfo) {
            return { id: curInfo.server };
        });
    }

    /**
     * Create snapshot for servers.
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers to perform create snapshot operation on.
     * @param {Number} expirationDays - Number of days to keep the snapshot for (must be between 1 and 10).
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function createSnapshot
     */
    self.createSnapshot = function(serverCriteria, expirationDays) {
        serverCriteria = initCriteria(serverCriteria);

        var result = self.find(serverCriteria)
            .then(extractServerIdFromMetadataList)
            .then(function(serverIds) {
                return serverClient.createSnapshot({serverIds: serverIds, snapshotExpirationDays: expirationDays});
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Create Snapshot").from(result);
    };

    function getSnapshotId(server) {
        var snapshot = server.details ? server.details.snapshots[0] : null;
        if (!snapshot) {
            throw new Error("The server " + server.id + " does not contain any snapshots");
        }

        var snapshotLink = _.findWhere(snapshot.links, {rel: "self"}).href;

        return _.last(snapshotLink.split('/'));
    }

    function setServerIdToJobInfo(server) {
        return function(jobInfo) {
            return _.extend(jobInfo, {server: server.id});
        };
    }

    /**
     * Delete snapshot for servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers to perform delete snapshot operation on.
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function deleteSnapshot
     */
    self.deleteSnapshot = function() {
        var criteria = initCriteria(arguments);

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.settle(
                    _.map(servers, function(server) {
                        return serverClient.deleteSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Delete Snapshot").fromInspections(result);
    };

    /**
     * Revert servers to snapshot.
     * @param {ServerCriteria} arguments - criteria that specify set of servers to perform revert operation on.
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function revertToSnapshot
     */
    self.revertToSnapshot = function() {
        var criteria = initCriteria(arguments);

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.settle(
                    _.map(servers, function(server) {
                        return serverClient.revertToSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Revert to Snapshot").fromInspections(result);
    };

    /**
     * Add public ip to group of servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers
     * @param {PublicIpConfig} publicIpConfig - add public ip config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function addPublicIp
     */
    self.addPublicIp = function(searchCriteria, publicIpConfig) {
        var result = self
            .find(self._searchCriteriaFrom(searchCriteria))
            .then(function (servers) {
                return Promise.settle(_.map(servers, function(server) {
                    return serverClient
                        .addPublicIp(server.id, new PublicIpConverter().convert(publicIpConfig))
                        .then(setServerIdToJobInfo(server));
                }));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Add Public IP").fromInspections(result);
    };

    function loadPublicIpDetails(server) {
        return Promise.all(
            _.map(fetchPublicIpList(server), function(ip){
                return Promise.props(
                    {
                        address: serverClient.getPublicIp(server.id, ip),
                        publicIp: ip
                    }
                );
            })
        );
    }

    function extendPublicIp(props) {
        return Promise.all(
            _.map(props, function(enhancedIp) {
                return _.extend(enhancedIp.address, {publicIPAddress: enhancedIp.publicIp});
            })
        );
    }

    /**
     * Find all ipAddresses including opened ports and source restrictions for a single server by search criteria.
     * @param {ServerCriteria} arguments - criteria that specify single server
     * @returns {Promise<PublicIpConfig>} promise that resolved by list of PublicIpConfig
     *
     * @memberof Servers
     * @instance
     * @function findPublicIp
     */
    self.findPublicIp = function() {
        var criteria = self._searchCriteriaFrom(arguments);

        return self
            .findSingle(criteria)
            .then(loadPublicIpDetails)
            .then(extendPublicIp);
    };

    /**
     * Remove all public ipAddresses for set of servers by search criteria.
     * @param {ServerCriteria} arguments - criteria that specify a set of servers
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function removeAllPublicIp
     */
    self.removeAllPublicIp = function() {
        var criteria = self._searchCriteriaFrom(arguments);

        var result = self
            .find(criteria)
            .then(function(servers) {
                return Promise.all(
                    _.map(servers, function(server) {
                        return Promise.all(
                            _.map(fetchPublicIpList(server), function(publicIp) {
                                return serverClient
                                    .removePublicIp(server.id, publicIp)
                                    .then(setServerIdToJobInfo(server));
                            })
                        );
                    })
                );

            })
            .then(_.flatten);

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Remove all Public IP").from(result);
    };

    /**
     * Remove public ipAddresses for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify single server
     * @param {String} publicIp - public ip
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function removePublicIp
     */
    self.removePublicIp = function(searchCriteria, publicIp) {
        var result = self
            .findSingle(searchCriteria)
            .then(function(server) {
                return serverClient
                    .removePublicIp(server.id, publicIp)
                    .then(setServerIdToJobInfo(server));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Remove public IP").from(result);
    };

    /**
     * Modify all public ip for set of servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers
     * @param {PublicIpConfig} publicIpConfig - public ip config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function modifyAllPublicIp
     */
    self.modifyAllPublicIp = function(searchCriteria, publicIpConfig) {
        var result = self
            .find(self._searchCriteriaFrom(searchCriteria))
            .then(_.partial(doModifyAllPublicIp, publicIpConfig))
            .then(_.flatten);

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Modif all public IP").from(result);
    };

    function doModifyAllPublicIp(publicIpConfig, servers) {
        return Promise.all(
            _.map(servers, function(server) {
                return Promise.all(
                    _.map(fetchPublicIpList(server), function(publicIp) {
                        return serverClient
                            .modifyPublicIp(server.id, publicIp, convertPublicIpConfig(publicIpConfig))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            })
        );
    }

    /**
     * Modify public ipAddresses for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify single server
     * @param {String} publicIp - public ip
     * @param {PublicIpConfig} publicIpConfig - public ip config
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function modifyPublicIp
     */
    self.modifyPublicIp = function(searchCriteria, publicIp, publicIpConfig) {
        var result = self
            .findSingle(searchCriteria)
            .then(function(server) {
                return serverClient
                    .modifyPublicIp(server.id, publicIp, convertPublicIpConfig(publicIpConfig))
                    .then(setServerIdToJobInfo(server));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Modify public IP").from(result);
    };

    function fetchPublicIpList(server) {
        return _.chain(server.details.ipAddresses)
            .pluck("public")
            .compact()
            .value();
    }

    function convertPublicIpConfig(publicIpConfig) {
        return new PublicIpConverter().convert(publicIpConfig);
    }

    //TODO make public?
    ///**
    // * Get anti-affinity policies for a servers.
    // * @param {ServerCriteria} searchCriteria - criteria that specify set of servers
    // * @returns {Promise<Array>} the queued operation. Returns data in format [{serverId: srvId, policy: policy}]
    // *
    // * @memberof Servers
    // * @instance
    // * @function getAntiAffinityPolicy
    // */
    //self.getAntiAffinityPolicy = function() {
    //    return self
    //        .find(self._searchCriteriaFrom(arguments))
    //        .then(function(servers) {
    //            return Promise.all(
    //                _.map(servers, loadServerAntiAffinityPolicy)
    //            );
    //        })
    //        .then(function(policies) {
    //            return _.map(policies, function(policy) {
    //                return {
    //                    serverId: _.findWhere(policy.links, {rel: "server"}).id,
    //                    policy: policy
    //                };
    //            });
    //        });
    //};
    //
    //function loadServerAntiAffinityPolicy(server) {
    //    return serverClient.getPolicy(server.id, "antiAffinityPolicy");
    //}
    /**
    * Initiate SSH client for a servers.
    * @param {ServerCriteria} arguments - criteria that specify set of servers
    * @returns {SshClient} the queued operation. Returns ssh client
    *
    * @memberof Servers
    * @instance
    * @function execSsh
    */
    self.execSsh = function() {
        var promise = self.find(arguments)
            .then(loadPublicIp)
            .then(loadPublicIpWithSshAndCredentials);

        return new SshClient(promise);
    };

    function loadPublicIp(servers) {
        return Promise.all(_.map(servers, function(server) {
            return Promise.props({
                ipAddress: self.findPublicIp(server),
                server: server
            });
        }));
    }

    function loadPublicIpWithSshAndCredentials(serverData) {
        return Promise.all(_.map(serverData, function(data) {
            return Promise.props({
                ipAddress: getIpAddressPromise(data),
                server: data.server,
                credentials: self.findCredentials(data.server)
            });
        }));
    }

    function getIpAddressPromise(prop) {
        if (findPublicIpWithOpenSshPort(prop.ipAddress)) {
            return findPublicIpWithOpenSshPort(prop.ipAddress);
        }
        return self.addPublicIp(prop.server, {openPorts: [Server.Port.SSH]})
            .then(_.partial(self.findPublicIp, prop.server))
            .then(findPublicIpWithOpenSshPort);
    }

    function findPublicIpWithOpenSshPort(ipAddresses) {
        if (ipAddresses.length === 0) {
            return null;
        }

        return _.chain(ipAddresses)
            .filter(function(address) {
                return _.findWhere(address.ports, {port: Server.Port.SSH});
            })
            .first()
            .value();
    }

    init();
}