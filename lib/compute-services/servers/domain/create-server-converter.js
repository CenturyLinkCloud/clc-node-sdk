
var _ = require('underscore');
var Templates = require('./../../templates/templates.js');
var DiskType = require('./disk-type.js');
var Server = require('./server.js');
var Promise = require('bluebird');

module.exports = CreateServerConverter;

function CreateServerConverter(groups, templates, accountClient, policies) {

    var self = this;

    self._serverService = function(serverService) {
        self.serverService = serverService;
    };

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
                throw new Error("Managed OS capability is not supported by this template");
            }
            command.isManagedOS = true;

        }
        return command;
    };

    function hasTemplateCapability(template, capability) {
        return template.capabilities.indexOf(capability) > -1;
    }

    self.setTemplateName = function (command) {
        var templateName = command.sourceServerId;
        if (!command.sourceServerId && command.fetchedTemplate) {
            templateName = command.fetchedTemplate.name;
        }

        return _.extend(command, {sourceServerId: templateName});
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

    self.setHyperscaleServer = function(command) {
        if (command.type === Server.HYPERSCALE) {
            if(!hasTemplateCapability(command.fetchedTemplate, "hyperscale")) {
                throw new Error("Hyperscale capability is not supported by this template");
            }
            command.storageType = Server.StorageType.HYPERSCALE;

        }
        return command;
    };

    self.setPolicies = function(command) {
        if (command.machine) {
            return setAntiAffinityPolicy(command)
                .then(setAutoScalePolicy);
        }
        return command;
    };

    function setAntiAffinityPolicy(command) {
        var antiAffinity = command.machine.antiAffinity;
        if (antiAffinity) {
            antiAffinity.dataCenter = command.group.dataCenter || command.template.dataCenter;

            return policies.antiAffinity()
                .findSingle(antiAffinity)
                .then(function(policy) {
                    return _.extend(command, {antiAffinityPolicyId: policy.id});
                });
        }

        return Promise.resolve(command);
    }

    function setAutoScalePolicy(command) {
        if (command.machine.autoScale) {
            return setVerticalAutoScalePolicy(command)
                .then(setHorizontalAutoScalePolicy);
        }

        return Promise.resolve(command);
    }

    function setVerticalAutoScalePolicy(command) {
        var vertical = command.machine.autoScale.vertical;
        if (vertical) {
            return policies.autoScale().vertical()
                .findSingle(vertical)
                .then(function(policy) {
                    return _.extend(command, {cpuAutoscalePolicyId: policy.id});
                });
        }

        return Promise.resolve(command);
    }

    function setHorizontalAutoScalePolicy(command) {
        return Promise.resolve(command);
    }

    self.setDefaultValues = function(command) {
        command.type = command.type || Server.STANDARD;
        command.storageType = command.storageType || Server.StorageType.STANDARD;

        return command;
    };

    self.clearConfig = function(command) {
        return _.omit(command, "machine", "group", "template", "managedOS", "policy", "fetchedTemplate", "network");
    };

    self.convertServerAttributesToClone = function (command) {
        return self.serverService
            .findSingle(command.from.server)
            .then(function(server) {
                command.sourceServerId = server.id;
                return self.serverService.findCredentials(server);
            })
            .then(function(credentials) {
                command.sourceServerPassword = credentials.password;
                return command;
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