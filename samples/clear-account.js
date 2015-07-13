var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var _ = require('underscore');

var sdk = new Sdk();
var compute = sdk.computeServices();
var dataCenters = sdk.baseServices().dataCenters();

var Group = compute.Group;

function clearAccount() {
    console.log('clear environment');
    return dataCenters.find()
        .then(deleteServers)
        .then(deleteGroups)
        .then(clearDone);
}

function deleteServers(dataCenters) {
    console.log('delete all servers');
    return compute.servers().delete({
            group: {
                dataCenter: dataCenters,
                nameContains: [Group.ARCHIVE, Group.TEMPLATES, Group.DEFAULT]
            }
        })
        .then(function() {
            return dataCenters;
        });
}

function deleteGroups(dataCenters) {
    console.log('delete all groups, except Archive, Default Group, Templates');

    return compute.groups().find(
            {
                dataCenter: dataCenters,
                name: [Group.DEFAULT, Group.ARCHIVE, Group.TEMPLATES]
            }
        ).then(function(groups) {
            var subGroups = _.chain(groups)
                    .map(function(group) {
                        return group.getGroups();
                    })
                    .flatten()
                    .value();
            return compute.groups().delete(subGroups);
        });
}

function clearDone() {
    console.log('Finished!');
}

function run() {
    clearAccount();
}

run();