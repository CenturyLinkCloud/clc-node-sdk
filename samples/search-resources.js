var assert = require('assert');
var _ = require('underscore');
var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var SampleUtils = require('./sample-utils.js');

var sdk = new Sdk();
var compute = sdk.computeServices();

var DataCenter = compute.DataCenter;
var Server = compute.Server;
var Group = compute.Group;

var OsFamily = compute.OsFamily;
var Machine = compute.Machine;

var startsWith = function (str, substr) { return str.indexOf(substr) === 0; };
var contains = function (str, substr) { return str.indexOf(substr) > -1; };
var onlyCompletedServers = function (serverMetadata) {
    return serverMetadata.status !== 'underConstruction';
};

var server1Name = "srv-1";
var server2Name = "srv-2";
var server3Name = "srv-3";

var serverIds = [];

function __checkServers(servers) {
    assert.equal(servers.length, 3);

    _.each(servers, function(server) {
        assert(
            contains(server.id, server1Name) ||
            contains(server.id, server2Name) ||
            contains(server.id, server3Name)
        );
    });
}

function __displayResult(result) {
    _.each(result, function(element) {
        console.log("    " + element.id);
    });

    return result;
}

function __deleteServer(serverId) {
    compute.servers().delete({ id : serverId});
}

/* List all servers available for current user */
function __findAllServers() {
    return compute.servers().find({
        dataCenter: [DataCenter.US_EAST_STERLING, DataCenter.US_WEST_SANTA_CLARA],
        where: onlyCompletedServers
    })
    .then(function(servers) {
        console.log("All servers:");
        return servers;
    })
    .then(__displayResult)
    .then(__checkServers);
}

/* Find all active servers in all datacenters */
function __findAllActiveServers() {
    return compute.servers().find({
        dataCenter: [DataCenter.US_EAST_STERLING, DataCenter.US_WEST_SANTA_CLARA],
        onlyActive: true,
        where: onlyCompletedServers
    })
    .then(function(servers) {
        console.log("Active servers:");
        return servers;
    })
    .then(__displayResult)
    .then(__checkServers);
}

/* Find server within some group in all datacenters */
function __findServersByGroup() {
    return compute.servers().find({
        dataCenter: [DataCenter.US_EAST_STERLING, DataCenter.US_WEST_SANTA_CLARA],
        group: {name: Group.DEFAULT},
        where: onlyCompletedServers
    })
    .then(function(servers) {
        console.log("Servers from Default Group (VA1 and WA1):");
        return servers;
    })
    .then(__displayResult)
    .then(__checkServers);
}

/* Find server that contains some value in it�s metadata */
function __findServerByValueInMetadata() {
    return compute.servers().find({
        dataCenter: [DataCenter.US_EAST_STERLING, DataCenter.US_WEST_SANTA_CLARA],
        where: function(serverMetadata) {
            return contains(serverMetadata.description, server1Name) && onlyCompletedServers(serverMetadata)
        }
    })
    .then(function(servers) {
        console.log("Server by '" + server1Name + "' value in metadata:");
        return servers;
    })
    .then(__displayResult)
    .then(function(servers) {
        assert.equal(servers.length, 1);
        assert(contains(servers[0].id, server1Name))
    });
}

/* Find groups that contains keyword in description */
function __findGroupByKeywordInDescription() {
    return compute.groups().find({
        dataCenter: [DataCenter.US_EAST_STERLING, DataCenter.US_WEST_SANTA_CLARA],
        descriptionContains: "The default"
    })
    .then(function(servers) {
        console.log("Groups that contains 'The default' keyword in description:");
        return servers;
    })
    .then(__displayResult)
    .then(function(groups) {
        assert.equal(groups.length, 2);
    });
}

/* Find templates of specified operating system */
function __listCentOsTemplates() {
    compute
        .templates()
        .find({
            dataCenter: DataCenter.US_EAST_STERLING,
            operatingSystem: {
                family: OsFamily.CENTOS,
                architecture: Machine.Architecture.X86_64
            }
        })
        .then(function (results) {
            assert(results.length > 0);

            var firstTemplate = _.first(results);
            assert(startsWith(firstTemplate.name, 'CENTOS'));

            console.log("Available CentOs templates:");
            _.each(results, function(template) {
                console.log("    " + template.name);
            });
        });
}

function run() {
    Promise.join(
        SampleUtils.createServer(compute, server1Name, DataCenter.US_EAST_STERLING),
        SampleUtils.createServer(compute, server2Name, DataCenter.US_WEST_SANTA_CLARA),
        SampleUtils.createServer(compute, server3Name, DataCenter.US_EAST_STERLING),

        function(serverId1, serverId2, serverId3) {
            serverIds.push(serverId1);
            serverIds.push(serverId2);
            serverIds.push(serverId3);
        }
    )
    .then(__findAllServers)
    .then(__findAllActiveServers)
    .then(__findServersByGroup)
    .then(__findServerByValueInMetadata)
    .then(__listCentOsTemplates)
    .then(__findGroupByKeywordInDescription)
    .then(function() {
        _.each(serverIds, __deleteServer);
    });
}

run();