
var SampleUtils = {

    createServer: function(computeServices, name, dataCenter) {
        return computeServices
            .servers()
            .create({
                name: name,
                description: name + " description",
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
            })
            .then(function(result) {
                return result.id;
            });
    },

    createLoadBalancer: function(computeServices, dataCenter, name) {
        return computeServices
            .balancers()
            .groups()
            .create({
                dataCenter: dataCenter,
                name: name,
                description: name + " description"
            });
    },

    createLoadBalancerPool: function(computeServices, balancer, port, method, persistence) {
        return computeServices
            .balancers()
            .pools()
            .create({
                balancer: balancer,
                port: port,
                method: method,
                persistence: persistence
            });
    },

    setLoadBalancerNodes: function(computeServices, pool, nodes) {
        return computeServices
            .balancers()
            .nodes()
            .create({
                pool: pool,
                nodes: nodes
            });
    },

    deleteLoadBalancers: function(computeServices, criteria) {
        return computeServices
            .balancers()
            .groups()
            .delete(criteria)
    }

};

module.exports = SampleUtils;