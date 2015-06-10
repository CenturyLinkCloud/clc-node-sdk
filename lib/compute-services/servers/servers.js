
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var Groups = require('./../groups/groups.js');
var Templates = require('./../templates/templates.js');
var OperationPromise = require('./../../common-services/queue/operation-promise.js');

var QueueClient = require('./../../common-services/queue/queue-client.js');
var DiskType = require('./../domain/disk-type.js');

module.exports = Servers;


function Servers(rest) {

    var self = this;
    var serverClient = new ServerClient(rest);
    var queueClient = new QueueClient(rest);
    var groups = new Groups(rest);
    var templates = new Templates(rest);

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    self.findByRef = function () {
        var promises = _.chain([arguments])
            .flatten()
            .map(function (reference) {
                return serverClient.findServerById(reference.id);
            })
            .value();

        return Promise.all(promises).then(preprocessResult);
    };

    self.findByUuid = function(uuid) {

        return serverClient
            .findServerByUuid(uuid)
            .then(preprocessResult);
    };

    self.create = function (command) {
        var promise = new OperationPromise(queueClient, self.findByUuid);

        Promise.resolve(command)
            .then(function(command) {
                if (!command.groupId && command.group) {
                    if (command.group.datacenter && command.group.name) {
                        return groups
                            .findByNameAndDatacenter(command.group)
                            .then(function(group) {
                                return group.id;
                            });
                    }

                    return command.group;
                }

                return command.groupId;
            })
            .then(function(groupId) {
                return _.extend(command, {groupId: groupId});
            })
            .then(function(command) {
                var primaryDns = command.primaryDns;
                var secondaryDns = command.secondaryDns;

                if ((!primaryDns || !secondaryDns) && command.network) {
                    primaryDns = command.network.primaryDns;
                    secondaryDns = command.network.secondaryDns;
                }

                return _.extend(
                    command,
                    {
                        primaryDns: primaryDns,
                        secondaryDns: secondaryDns
                    }
                );
            })
            .then(function(command) {
                var additionalDisks = [];
                var cpu = command.cpu ? command.cpu : command.machine.cpu;
                var memoryGB = command.memoryGB ? command.memoryGB : command.machine.memoryGB;

                if (command.machine && command.machine.disks) {
                    _.each(command.machine.disks, function(disk) {
                        var additionalDisk;

                        if (!disk.size) {
                            additionalDisk = {
                                sizeGB: disk,
                                type: DiskType.RAW
                            };
                        } else {
                            additionalDisk = {
                                sizeGB: disk.size,
                                type: disk.type ? disk.type : (disk.path ? DiskType.PARTITIONED : DiskType.RAW)
                            };

                            if (disk.path) {
                                additionalDisk.path = disk.path;
                            }
                        }

                        additionalDisks.push(additionalDisk);
                    });
                }

                return _.extend(
                    command,
                    {
                        cpu: cpu,
                        memoryGB: memoryGB,
                        additionalDisks: additionalDisks
                    }
                );
            })
            .then(function(command) {
                if (!command.sourceServerId && command.template) {
                    return templates.findByRef(command.template)
                        .then(function(template) {
                            return template.name;
                        });
                }

                return command.sourceServerId;
            })
            .then(function(templateName) {
                return _.extend(command, {sourceServerId: templateName});
            })
            .then (function(command) {
                return serverClient
                    .createServer(command)
                    .then(promise.resolveWhenJobCompleted , promise.processErrors);
            });

        return promise;
    };

    self.delete = function (server) {
        var promise = new OperationPromise(queueClient);

        serverClient
            .deleteServer(server.id)
            .then(promise.resolveWhenJobCompleted , promise.processErrors);

        return promise;
    };
}