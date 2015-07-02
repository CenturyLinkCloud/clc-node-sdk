
var _ = require('underscore');
var Templates = require('./../../templates/templates.js');
var DiskType = require('./disk-type.js');

module.exports = CreateServerConverter;

function CreateServerConverter(groups, templates, accountClient) {

    var self = this;

    self.fetchGroupId = function (command) {
        if (!command.groupId && command.group) {
            return groups
                .findSingle(command.group)
                .then(_.property('id'));
        }

        return command.groupId;
    };

    self.fetchTemplateName = function (command) {
        if (!command.sourceServerId && command.template) {
            return templates.findSingle(command.template)
                .then(function(template) {
                    return template.name;
                });
        }

        return command.sourceServerId;
    };

    self.convertDns = function (command) {
        var primaryDns = command.primaryDns ?
            command.primaryDns : command.network.primaryDns;

        var secondaryDns = command.secondaryDns ?
            command.secondaryDns : command.network.secondaryDns;

        return _.extend(command, { primaryDns: primaryDns, secondaryDns: secondaryDns });
    };

    self.convertMachine = function (command) {
        var cpu = command.cpu ?
            command.cpu : command.machine.cpu;

        var memoryGB = command.memoryGB ?
            command.memoryGB : command.machine.memoryGB;

        var additionalDisks = [];

        if (command.machine && command.machine.disks) {
            _.each(command.machine.disks, function(disk) {
                var additionalDisk;

                if (!disk.size) {
                    additionalDisk = { sizeGB: disk, type: DiskType.RAW };
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

        return _.extend(command, {
            cpu: cpu,
            memoryGB: memoryGB,
            additionalDisks: additionalDisks
        });
    };

    self.convertServerAttributesToClone = function (command, server, password) {
        return _.extend(command, {
            sourceServerId: server.id,
            sourceServerPassword: password
        });
    };

    self.convertServerAttributesToImport = function (command) {
        return _.extend(command, {
            ovfId: command.ovf.id,
            ovfOsType: command.ovf.osType
        });
    };


    self.convertCustomFields = function(command) {
        if (command.customFields) {
            return accountClient.getCustomFields()
                .then(_.partial(filterCustomFields, command))
                .then(_.partial(composeCustomFields, command));
        }

        return command;
    };

    function filterCustomFields(command, availableFields) {
        var filteredFields = _.map(command.customFields, function(criteria) {
                var byName = _.filter(availableFields, function(field) {
                    return field.name === criteria.name;
                });
                var byFunction = criteria.where ? _.filter(availableFields, criteria.where) : [];
                return _.asArray(byName, byFunction);
            }
        );
        return _.chain(filteredFields)
            .flatten()
            .uniq(function(field) {
                return field.id;
            })
            .value();
    }

    function composeCustomFields(command, filteredFields) {
        command.customFields = _.map(filteredFields, function(field) {
            return {
                id: field.id,
                value: _.find(command.customFields, function(criteria) {
                    return criteria.name === field.name || criteria.where(field);
                }).value
            };
        });
        return command;
    }
}