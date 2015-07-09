
var _ = require('underscore');
var Promise = require("bluebird");
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var CreateServerJob = require('./../../base-services/queue/domain/create-server-job.js');

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
 * @param rest the REST client
 * @constructor
 */
function Servers(serverClient, serverConverter, queueClient, groupService) {
    var self = this;

    function init () {
        SearchSupport.call(self);
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
     * @param {ServerCriteria} args - criteria that specify set of servers that will be searched
     *
     * @return {Promise<Array<ServerMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Servers
     */
    self.find = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        var groupCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.group;
        });

        if(_.isEmpty(criteria)) {
            groupCriteria = {};
        }

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
            .then(serverConverter.fetchTemplateName)
            .then(function(templateName) {
                return _.extend(command, {sourceServerId: templateName});
            })
            .then(serverConverter.convertDns)
            .then(serverConverter.convertMachine)
            .then(serverConverter.convertCustomFields)
            .then(_.partial(_.omit, _, 'fetchedTemplate'));
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

        if (command.managedOS === true) {
            promise.setJobFn(waitUntilServerIsConstructed());
        }

        return promise;
    };

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

    function setGroupIdToCommand(command, groupId) {
        if (groupId) {
            return _.extend(command, {groupId: groupId});
        }
        return command;
    }

    function composeModifyPasswordConfig(command) {
        if (command.password) {
            if (command.password.old === command.password.new) {
                delete command.password;
            } else {
                command.password = {
                    current: command.password.old,
                    password: command.password.new
                };
            }
        }
    }

    function composeModifyDisksConfig(command) {
        if (command.disks) {
            var serverDisks = command.serversData;
            var diskConfig = _.chain(serverDisks).map(_.property("disks")).flatten().value();

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

                return _.chain(updateProperties)
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
            });
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

        return self.find(searchCriteria)
            .then(function(servers) {
                return _.map(servers, function(srv) {
                    return {
                        id: srv.id,
                        disks: srv.details.disks
                    };
                });
            })
            .then(function(serversData) {
                command.serverIds = _.pluck(serversData, "id");
                command.serversData = serversData;
                return command;
            })
            .then(_.partial(composeModifyServerPromise, command))
            .then(function(request) {
                return _.map(command.serverIds, function(id) {
                    return modify(id, request);
                });
            })
            .then(Promise.all)
            .then(function() {
                return _.map(command.serversData, _.partial(_.omit, _, 'disks'));
            });
    };

    function modify(id, request) {
        var promise = new OperationPromise(queueClient);

        serverClient.modifyServer(id, request)
            .then(_.property('data'))
            .then(promise.resolveWhenJobCompleted, promise.processErrors);

        return promise;
    }

    /**
     * Deletes a server.
     * @param {ServerReference} serverCriteria criteria that specify set of servers that will be deleted
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
                return Promise.all(_.map(servers, deleteServer));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
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
        var promise = new OperationPromise(queueClient, resolveServerId);

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
     * @param {ServerCriteria} args - criteria that specify set of servers that will be started
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function powerOn
     */
    self.powerOn = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "powerOn");
    };

    /**
     * Power off servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be stopped
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function powerOff
     */
    self.powerOff = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "powerOff");
    };

    /**
     * Pause servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be paused
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function pause
     */
    self.pause = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "pause");
    };

    /**
     * Start maintenance servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function startMaintenance
     */
    self.startMaintenance = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "startMaintenance");
    };

    /**
     * Stop maintenance servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function stopMaintenance
     */
    self.stopMaintenance = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "stopMaintenance");
    };


    /**
     * Shut down servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be shut downed
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function shutDown
     */
    self.shutDown = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "shutDown");
    };

    /**
     * Reboot servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be rebooted
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function reboot
     */
    self.reboot = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "reboot");
    };

    /**
     * Reset servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be reseted
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function reset
     */
    self.reset = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        return sendPowerOperationRequest(criteria, "reset");
    };

    /**
     * Archive servers.
     * @param {ServerCriteria} args - criteria that specify set of servers that will be archived
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function archive
     */
    self.archive = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

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
        serverCriteria = new ServerCriteria(self._searchCriteriaFrom(serverCriteria)).parseGroupCriteria();

        var result = self.find(serverCriteria)
            .then(function(servers) {
                return Promise.props({
                    serverIds: extractServerIdFromMetadataList(servers),
                    targetGroup: getGroupId(groupCriteria)
                });
            })
            .then(function(result) {
                return Promise.all(_.map(result.serverIds, _.partial(restore, _, result.targetGroup)));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);

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

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
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
     * @param {number} expirationDays - Number of days to keep the snapshot for (must be between 1 and 10).
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function createSnapshot
     */
    self.createSnapshot = function(serverCriteria, expirationDays) {
        serverCriteria = new ServerCriteria(self._searchCriteriaFrom(serverCriteria)).parseGroupCriteria();

        var result = self.find(serverCriteria)
            .then(extractServerIdFromMetadataList)
            .then(function(serverIds) {
                return serverClient.createSnapshot({serverIds: serverIds, snapshotExpirationDays: expirationDays});
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
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
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers to perform delete snapshot operation on.
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function deleteSnapshot
     */
    self.deleteSnapshot = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.all(
                    _.map(servers, function(server) {
                        return serverClient.deleteSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
    };

    /**
     * Revert servers to snapshot.
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers to perform revert operation on.
     * @returns {Promise} the queued operation
     *
     * @memberof Servers
     * @instance
     * @function revertToSnapshot
     */
    self.revertToSnapshot = function() {
        var criteria = new ServerCriteria(self._searchCriteriaFrom(arguments)).parseGroupCriteria();

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.all(
                    _.map(servers, function(server) {
                        return serverClient.revertToSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
    };

    /**
     * Add public ip to group of servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers that will be paused
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
                return Promise.all(_.map(servers, function(server) {
                    return serverClient
                        .addPublicIp(server.id, new PublicIpConverter().convert(publicIpConfig))
                        .then(setServerIdToJobInfo(server));
                }));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
    };

    /**
     * Find all ipAddresses including opened ports and source restrictions for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify single server
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
            .then(function(server) {
                return Promise.all(
                    _.map(fetchPublicIpList(server), function(ip){
                        return serverClient.getPublicIpAddress(server.id, ip);
                    })
                );
            });
    };

    /**
     * remove all public ipAddresses for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify a group of servers
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
                                    .removePublicIpAddress(server.id, publicIp)
                                    .then(setServerIdToJobInfo(server));
                            })
                        );
                    })
                );

            })
            .then(function (jobInfoArray) {
                return _.flatten(jobInfoArray);
            });



        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
    };

    /**
     * remove public ipAddresses for a single server by search criteria.
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
                    .removePublicIpAddress(server.id, publicIp)
                    .then(setServerIdToJobInfo(server));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus).from(result);
    };

    function fetchPublicIpList(server) {
        return _.chain(server.details.ipAddresses)
            .pluck("public")
            .compact()
            .value();
    }

    init();
}