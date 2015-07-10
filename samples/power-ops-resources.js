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

var startsWith = function (str, substr) { return str.indexOf(substr) === 0; };
var contains = function (str, substr) { return str.indexOf(substr) > -1; };

var groupName = "SampleGroup";
var dataCenter = DataCenter.GB_PORTSMOUTH;

var serverSearchCriteria = {
    dataCenter: dataCenter,
    group: {
        name: groupName
    }
};

var server1Name = "nginx";
var server2Name = "apache";
var server3Name = "mysql";


function __createGroup() {
    console.log("Create group " + groupName);
    return compute
        .groups()
        .create({
            parentGroup: {
                dataCenter: dataCenter,
                name: compute.Group.DEFAULT
            },
            name: groupName,
            description: 'SampleGroup for power operations'});
}

function __deleteGroup() {
    console.log("Delete group " + groupName);
    return compute
        .groups()
        .delete({
            name: groupName,
            dataCenter: dataCenter
        });
}

function __createServers() {
    return Promise.join(
        __createServer(server1Name, "a_nginx"),
        __createServer(server2Name, "a_apache"),
        __createServer(server3Name, "b_mysql")
    );
}

function __createServer(name, description) {
    console.log("Create server " + name);
    return compute
        .servers()
        .create({
            name: name,
            description: description,
            group: {
                dataCenter: dataCenter,
                name: groupName
            },
            template: {
                dataCenter: dataCenter,
                operatingSystem: {
                    family: OsFamily.CENTOS,
                    version: "6",
                    architecture: Machine.Architecture.X86_64
                }
            },
            machine: {
                cpu: 1,
                memoryGB: 1
            },
            type: Server.STANDARD,
            storageType: Server.StorageType.STANDARD
        })
        .then(function(result) {
            return result.id;
        });
}

function __checkServers(servers) {
    assert.equal(servers.length, 3);

    _.each(servers, function(server) {
        assert(
            contains(server.id, server1Name) ||
            contains(server.id, server2Name) ||
            contains(server.id, server3Name)
        );
    });

    return servers;
}

function __displayResult(result) {
    _.each(result, function(element) {
        console.log("    " + element.id);
    });

    return result;
}

/* List created servers */
function __findCreatedServers() {
    return __findServers()
        .then(function(servers) {
            console.log("Created servers:");
            return servers;
        })
        .then(__displayResult)
        .then(__checkServers);
}

/* List created servers */
function __findServers() {
    return compute.servers().find(serverSearchCriteria);
}

function __findServersByRef(serverRefs) {
    return compute.servers().find(serverRefs);
}

function __restartServersForGroup() {
    console.log("Restart all servers in group " + groupName);
    return compute.groups().reboot(
            {
                dataCenter: dataCenter,
                name: groupName
            }
        )
        .then(__findServersByRef)
        .then(__checkServersState("active", "started"));
}

function __stopServers() {
    console.log("Stop all created servers");
    return compute.servers().powerOff(serverSearchCriteria)
        .then(__findServersByRef)
        .then(__checkServersState("active", "stopped"));
}

function __startServers() {
    console.log("Start all created servers");
    return compute.servers().powerOn(serverSearchCriteria)
        .then(__findServersByRef)
        .then(__checkServersState("active", "started"));
}

function __checkServersState(serverState, powerState) {
    return function(servers) {
        console.log("Check that server state is *" + serverState +
            "*, power state is *" + powerState + "* for servers");
        __displayResult(servers);

        _.each(servers, __checkServerState(serverState, powerState));

        console.log('Done');

        return servers;
    }
}

function __checkServerState(serverState, powerState) {
    return function(server) {
        if (serverState) {
            assert.equal(server.status, serverState);
        }
        if(powerState) {
            assert.equal(server.details.powerState, powerState);
        }
    };
}

function __createSnapshotForServers() {
    console.log("Create snapshot for servers where description starts with 'a'");
    return __checkSnapshotCountForServers(0)
        .then(_.partial(compute.servers().createSnapshot, _, 3))
        .then(_.partial(__checkSnapshotCountForServers, 1));
}

function __revertToSnapshotForServers() {
    console.log("Revert to snapshot servers where description starts with 'a'");
    return __findServersWithDescriptionStarts("a")
        .then(compute.servers().revertToSnapshot);
}

function __findServersWithDescriptionStarts(description) {
    var criteria = _.clone(serverSearchCriteria);
    criteria.where = function(metadata) {
        return startsWith(metadata.description, description);
    };

    return compute.servers().find(criteria);
}

function __checkSnapshotCountForServers(snapshotCount) {
    return __findServersWithDescriptionStarts("a")
        .then(function(servers) {
            _.each(servers, function(server) {
                assert.equal(server.details.snapshots.length, snapshotCount);
            });

            return servers;
        });
}

function __pauseServers() {
    return __findServersWithDescriptionStarts("a")
        .then(function(servers) {
            console.log("Pause servers:");
            __displayResult(servers);
            return servers;
        })
        .then(compute.servers().pause)
        .then(__findServersByRef)
        .then(__checkServersState("active", "paused"));
}


function run() {
    __createGroup()
    .then(__createServers)
    .then(__findCreatedServers)
    .then(__checkServersState("active", "started"))

    .then(__stopServers)
    .then(__startServers)
    .then(__restartServersForGroup)

    .then(__createSnapshotForServers)
    .then(__pauseServers)
    .then(__revertToSnapshotForServers)
    .then(__findCreatedServers)
    .then(__checkServersState("active", "started"))
    .then(__deleteGroup)
    .then(_.partial(console.log, "Finished!"));
}

run();