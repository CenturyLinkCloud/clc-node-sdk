var _ =  require('underscore');

var SampleUtils = {

    createServer: function(computeServices, config) {
        var dataCenter = config.dataCenter || computeServices.DataCenter.DE_FRANKFURT;
        var name = config.name || 'srv';
        var description = config.description || (name + " description");

        var defaultCfg = {
            name: name,
            description: description,
            group: {
                dataCenter: dataCenter,
                name: computeServices.Group.DEFAULT
            },
            template: {
                dataCenter: dataCenter,
                operatingSystem: {
                    family: computeServices.OsFamily.CENTOS,
                    version: "6",
                    architecture: computeServices.Machine.Architecture.X86_64
                }
            },
            network: {
                primaryDns: "172.17.1.26",
                secondaryDns: "172.17.1.27"
            },
            machine: {
                cpu: 1,
                memoryGB: 1
            },
            type: computeServices.Server.STANDARD,
            storageType: computeServices.Server.StorageType.STANDARD
        };

        return computeServices
            .servers()
            .create(_.extend(defaultCfg, config));
    }

};

module.exports = SampleUtils;