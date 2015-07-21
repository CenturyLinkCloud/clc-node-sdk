var assert = require('assert');
var _ = require('underscore');
var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');

var sdk = new Sdk();
var compute = sdk.computeServices();

var DataCenter = compute.DataCenter;
var Server = compute.Server;
var Group = compute.Group;

var OsFamily = compute.OsFamily;
var Machine = compute.Machine;

var containsIgnoreCase = function (str, substr) { return str.toUpperCase().indexOf(substr.toUpperCase()) > -1; };

var appGroupName = "Application";
var businessGroupName = "Business";
var dataCenter = DataCenter.US_CENTRAL_CHICAGO;

var groupSearchCriteria = {
    dataCenter: dataCenter,
    groupName: [appGroupName, businessGroupName]
};

var portsConfig = [
    Server.Port.HTTP,
    Server.Port.HTTPS,
    { from: 8080, to: 8085 },
    { protocol: Server.Protocol.TCP, port: 23 }
];

var sourceRestrictionsConfig = [
    '71.100.60.0/24',
    { ip: '192.168.3.0', mask: '255.255.255.128' }
];

var mysqlDiskSize = 10;
var mysqlDiskPath = "/db";

var mysqlServerName = "mySql";
var nginxServerName = "nginx";
var apacheServerName = "apache";

var infrastructureConfig = {
    dataCenter: dataCenter,
    group: {
        name: appGroupName,
        description: 'Group for super command functionality'
    },
    subItems: [
        {
            group: businessGroupName,
            subItems: [
                apacheServer(),
                mySqlServer()
            ]
        },
        nginxServer()
    ]
};

function deleteGroup() {
    console.log("Delete group " + appGroupName);
    return compute
        .groups()
        .delete({
            dataCenter: dataCenter,
            name: appGroupName
        });
}

function nginxServer() {
    return _.extend(centOsServerConfig(), {
        name: nginxServerName,
        publicIp: {
            openPorts: portsConfig,
            sourceRestrictions: sourceRestrictionsConfig
        }
    });
}

function apacheServer() {
    return _.extend(centOsServerConfig(), {
        name: apacheServerName
    });
}

function mySqlServer() {
    return _.extend(centOsServerConfig(), {
        name: mysqlServerName,
        machine: {
            cpu: 1,
            memoryGB: 1,
            disks: [
                { path: mysqlDiskPath, size: mysqlDiskSize }
            ]
        }
    });
}

function centOsServerConfig() {
    return {
        name: "centOS",
        template: {
            operatingSystem: {
                family: OsFamily.CENTOS,
                version: "6",
                architecture: Machine.Architecture.X86_64
            }
        },
        machine: {
            cpu: 1,
            memoryGB: 1
        }
    }
}

function checkServers(servers) {
    assert.equal(servers.length, 3);

    _.each(servers, function(server) {
        assert(
            containsIgnoreCase(server.id, mysqlServerName) ||
            containsIgnoreCase(server.id, apacheServerName) ||
            containsIgnoreCase(server.id, nginxServerName)
        );
    });

    return servers;
}

function displayResult(result) {
    _.each(_.asArray(result), function(element) {
        console.log("    " + element.id);
    });

    return result;
}

/* List created servers */
function findCreatedServers() {
    return compute.servers()
        .find(groupSearchCriteria)
        .then(function(servers) {
            console.log("Created servers:");
            return servers;
        })
        .then(displayResult)
        .then(checkServers);
}

function checkNginxServer() {
    console.log("Check nginx server");

    return compute.servers()
        .findSingle(_.extend(groupSearchCriteria, {nameContains: nginxServerName}))
        .then(displayResult)
        .then(function(server) {
            assert(containsIgnoreCase(server.name, nginxServerName));
            assert.equal(server.group.name, appGroupName);

            return server;
        })
        .then(compute.servers().findPublicIp)
        .then(checkPublicIp);
}

function checkPublicIp(ipAddress) {
    console.log("  Check public ip");

    assert.equal(ipAddress.length, 1);
    var publicIpData = ipAddress[0];

    assert(publicIpData.internalIPAddress);

    assert.deepEqual(
        publicIpData.ports,
        [
            { port: Server.Port.HTTP, protocol: Server.Protocol.TCP },
            { port: Server.Port.HTTPS, protocol: Server.Protocol.TCP },
            { port: 8080, portTo: 8085, protocol: Server.Protocol.TCP },
            { port: 23, protocol: Server.Protocol.TCP }
        ]
    );

    assert.deepEqual(
        publicIpData.sourceRestrictions,
        [
            { cidr: '71.100.60.0/24' },
            { cidr: '192.168.3.0/25' }
        ]
    );
}

function checkMysqlServer() {
    console.log("Check mysql server");

    return compute.servers()
        .findSingle(_.extend(groupSearchCriteria, {nameContains: mysqlServerName}))
        .then(displayResult)
        .then(checkDisk);
}

function checkDisk(server) {
    assert(containsIgnoreCase(server.name, mysqlServerName));

    console.log("  Check additional disk");
    assert.equal(_.last(server.details.disks).sizeGB, mysqlDiskSize);
    assert.equal(_.last(server.details.partitions).path, mysqlDiskPath);
    assert(_.last(server.details.partitions).sizeGB <= mysqlDiskSize);
}

function run() {
    console.log("Create infrastructure...");
    console.log(JSON.stringify(infrastructureConfig, null, 2));

    compute.groups()
        .defineInfrastructure(infrastructureConfig)
        .then(findCreatedServers)

        .then(checkNginxServer)
        .then(checkMysqlServer)

        .then(deleteGroup)
        .tap(function() {console.log("Finished!");});
}

run();