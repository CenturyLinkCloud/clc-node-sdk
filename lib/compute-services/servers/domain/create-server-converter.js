
var _ = require('underscore');
var Groups = require('./../../groups/groups.js');
var Templates = require('./../../templates/templates.js');
var DiskType = require('./disk-type.js');

module.exports = CreateServerConverter;

function CreateServerConverter(rest) {

    var self = this;
    var groups = new Groups(rest);
    var templates = new Templates(rest);

    self.fetchGroupId = function (command) {
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
}