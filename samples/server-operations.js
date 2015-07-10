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


function createGroup() {
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

function deleteGroup() {
    console.log("Delete group " + groupName);
    return compute
        .groups()
        .delete({
            name: groupName,
            dataCenter: dataCenter
        });
}

function createServers() {
    return Promise.join(
        createServer(server1Name, "a_nginx"),
        createServer(server2Name, "a_apache"),
        createServer(server3Name, "b_mysql")
    );
}

function createServer(name, description) {
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

function checkServers(servers) {
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

function displayResult(result) {
    _.each(result, function(element) {
        console.log("    " + element.id);
    });

    return result;
}

/* List created servers */
function findCreatedServers() {
    return findServers()
        .then(function(servers) {
            console.log("Created servers:");
            return servers;
        })
        .then(displayResult)
        .then(checkServers);
}

/* List created servers */
function findServers() {
    return compute.servers().find(serverSearchCriteria);
}

function findServersByRef(serverRefs) {
    return compute.servers().find(serverRefs);
}

function restartServersForGroup() {
    console.log("Restart all servers in group " + groupName);
    return compute.groups().reboot(
            {
                dataCenter: dataCenter,
                name: groupName
            }
        )
        .then(findServersByRef)
        .then(checkServersState("active", "started"));
}

function stopServers() {
    console.log("Stop all created servers");
    return compute.servers().powerOff(serverSearchCriteria)
        .then(findServersByRef)
        .then(checkServersState("active", "stopped"));
}

function startServers() {
    console.log("Start all created servers");
    return compute.servers().powerOn(serverSearchCriteria)
        .then(findServersByRef)
        .then(checkServersState("active", "started"));
}

function checkServersState(serverState, powerState) {
    return function(servers) {
        console.log("Check that server state is *" + serverState +
            "*, power state is *" + powerState + "* for servers");
        displayResult(servers);

        _.each(servers, checkServerState(serverState, powerState));

        console.log('Done');

        return servers;
    }
}

function checkServerState(serverState, powerState) {
    return function(server) {
        if (serverState) {
            assert.equal(server.status, serverState);
        }
        if(powerState) {
            assert.equal(server.details.powerState, powerState);
        }
    };
}

function createSnapshotForServers() {
    console.log("Create snapshot for servers where description starts with 'a'");
    return checkSnapshotCountForServers(0)
        .then(_.partial(compute.servers().createSnapshot, _, 3))
        .then(_.partial(checkSnapshotCountForServers, 1));
}

function revertToSnapshotForServers() {
    console.log("Revert to snapshot servers where description starts with 'a'");
    return findServersWithDescriptionStarts("a")
        .then(compute.servers().revertToSnapshot);
}

function findServersWithDescriptionStarts(description) {
    var criteria = _.clone(serverSearchCriteria);
    criteria.where = function(metadata) {
        return startsWith(metadata.description, description);
    };

    return compute.servers().find(criteria);
}

function checkSnapshotCountForServers(snapshotCount) {
    return findServersWithDescriptionStarts("a")
        .then(function(servers) {
            _.each(servers, function(server) {
                assert.equal(server.details.snapshots.length, snapshotCount);
            });

            return servers;
        });
}

function pauseServers() {
    return findServersWithDescriptionStarts("a")
        .then(function(servers) {
            console.log("Pause servers:");
            displayResult(servers);
            return servers;
        })
        .then(compute.servers().pause)
        .then(findServersByRef)
        .then(checkServersState("active", "paused"));
}


function run() {
    createGroup()
        .then(createServers)
        .then(findCreatedServers)
        .then(checkServersState("active", "started"))

        .then(stopServers)
        .then(startServers)
        .then(restartServersForGroup)

        .then(createSnapshotForServers)
        .then(pauseServers)
        .then(revertToSnapshotForServers)
        .then(findCreatedServers)
        .then(checkServersState("active", "started"))
        .then(deleteGroup)
        .then(_.partial(console.log, "Finished!"));
}

run();