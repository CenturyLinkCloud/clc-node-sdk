
var _ = require('underscore');

module.exports = ServerBuilder;

function ServerBuilder (compute) {
    var self = this;
    var server;

    self.createCentOsVm = function (configCustomization) {
        var DataCenter = compute.DataCenter;
        var Server = compute.Server;
        var Group = compute.Group;
        var OsFamily = compute.OsFamily;
        var Machine = compute.Machine;

        return compute
            .servers()
            .create(_.extend({
                name: "web",
                description: "My web server",
                group: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                template: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    operatingSystem: {
                        family: OsFamily.CENTOS,
                        version: "6",
                        architecture: Machine.Architecture.X86_64
                    }
                },
                network: {
                    primaryDns: "172.17.1.26",
                    secondaryDns: "172.17.1.27"
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 },
                        { path: "/data", size: 4 }
                    ]
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD
            }, configCustomization))
            .then(function (createdServer) {
                return server = createdServer;
            });
    };

    self.deleteServer = function (done) {
        return function () {
            return compute
                .servers()
                .delete(server)
                .then(function () {
                    done();
                });
        };
    };

}