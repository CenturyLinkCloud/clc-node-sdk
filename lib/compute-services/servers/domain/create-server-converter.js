
var _ = require('underscore');
var Templates = require('./../../templates/templates.js');
var DiskType = require('./disk-type.js');
var Server = require('./server.js');

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

    self.loadTemplate = function(command) {
        if (command.template) {
            return templates.findSingle(command.template)
                .then(function(template) {
                    command.fetchedTemplate = template;
                    return command;
                });
        }

        return command;
    };

    self.setManagedOs = function(command) {
        if (command.managedOS === true) {
            if(!hasTemplateCapability(command.fetchedTemplate, "managedOS")) {
                throw new Error("Managed OS capabilities is not supported by this template");
            }
            command.isManagedOS = true;

        }
        return _.omit(command, "managedOS");
    };

    function hasTemplateCapability(template, capability) {
        return template.capabilities.indexOf(capability) > -1;
    }

    self.fetchTemplateName = function (command) {
        if (!command.sourceServerId && command.fetchedTemplate) {
            return command.fetchedTemplate.name;
        }

        return command.sourceServerId;
    };

    self.convertDns = function (command) {
        var primaryDns = command.primaryDns ?
            command.primaryDns :
            (command.network ? command.network.primaryDns : undefined);

        var secondaryDns = command.secondaryDns ?
            command.secondaryDns :
            (command.network ? command.network.secondaryDns : undefined);

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

    self.convertTtl = function(command) {
        if (command.ttl) {
            var ttl = command.ttl;

            var now = new Date();

            if (typeof ttl === "number") {
                now.setHours(now.getHours() + ttl);
                ttl = now;
            }

            if (ttl.constructor && ttl.constructor.name === "Duration") {
                var addSeconds = ttl.as('seconds');
                now.setSeconds(now.getSeconds() + addSeconds);
                ttl = now;
            }

            if (isNaN(Date.parse(new Date(ttl)))) {
                throw new Error('Please specify ttl in correct format. See documentation for details');
            }

            if (typeof ttl === "string") {
                ttl = new Date(ttl);
            }

            command.ttl = ttl.toISOString();
        }

        return command;
    };

    self.setDefaultValues = function(command) {
        command.type = command.type || Server.STANDARD;
        command.storageType = command.storageType || Server.StorageType.STANDARD;

        return command;
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